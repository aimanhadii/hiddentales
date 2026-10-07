# ============================================================
# HiddenTales Backend - FINAL CLEAN VERSION
# (ViT + Color Psychology + T5 + OpenRouter + Firebase)
# ============================================================

# -------------------------
# IMPORTS
# -------------------------
from werkzeug.middleware.proxy_fix import ProxyFix
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
)
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib import colors

from werkzeug.security import generate_password_hash, check_password_hash
import os, json, torch, traceback, base64, requests, threading, io
import numpy as np
import colorsys
from datetime import datetime
from PIL import Image
from sklearn.cluster import KMeans

import firebase_admin
from firebase_admin import credentials, firestore

from flask import (
    Flask,
    request,
    jsonify,
    send_from_directory,
    send_file,
    url_for,
    make_response
)


from werkzeug.utils import secure_filename

import tensorflow as tf
from torchvision import transforms
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from dotenv import load_dotenv
from flask_cors import CORS

app = Flask(__name__)
app.wsgi_app = ProxyFix(
    app.wsgi_app,
    x_proto=1,
    x_host=1
)

# This covers everything and allows your S3 site to talk to ngrok
CORS(app, resources={r"/*": {
    "origins": "*", 
    "allow_headers": ["*", "ngrok-skip-browser-warning", "Content-Type"]
}})
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response("", 204)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
        return response

# ============================================================
# ENVIRONMENT
# ============================================================

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

AI_DIR = os.path.join(BASE_DIR, "fypModels", "fypModels")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


# ============================================================
# FIREBASE INIT
# ============================================================

FIREBASE_KEY_PATH = os.path.join(
    BASE_DIR,
    os.getenv("FIREBASE_KEY_PATH", "firebase-service-account.json")
)

cred = credentials.Certificate(FIREBASE_KEY_PATH)


if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("🔥 Firebase key exists:", os.path.exists(FIREBASE_KEY_PATH))
print("🔥 Firebase key path:", FIREBASE_KEY_PATH)


# ============================================================
# MODEL PATHS
# ============================================================

VIT_PATH = os.path.join(AI_DIR, "HiddenTales_Model", "best.torchscript")
CLASSES_JSON = os.path.join(AI_DIR, "HiddenTales_Model", "classes.json")

COLOR_MODEL_PATH = os.path.join(
    AI_DIR, "color_model_export", "color_model_export",
    "HiddenTales_ColorModel_Improved.keras"
)

COLOR_LABELS_PATH = os.path.join(
    AI_DIR, "color_model_export", "color_model_export",
    "color_dataset", "label_names.json"
)

T5_PATH = os.path.join(
    AI_DIR, "nlp_model_export", "nlp_model_export",
    "HiddenTales_T5_Final"
)


# ============================================================
# FLASK
# ============================================================

PUBLIC_BACKEND_URL = os.getenv(
    "PUBLIC_BACKEND_URL",
    "http://localhost:5000"
)


app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024


# ============================================================
# LOAD MODELS
# ============================================================

print("🔄 Loading models...")

VIT_MODEL = torch.jit.load(VIT_PATH, map_location=DEVICE).eval()
EMOTION_LABELS = [x.lower() for x in json.load(open(CLASSES_JSON))]

EVAL_TF = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize((0.485, 0.456, 0.406),
                         (0.229, 0.224, 0.225)),
])

COLOR_MODEL = tf.keras.models.load_model(COLOR_MODEL_PATH, compile=False)
COLOR_LABELS = json.load(open(COLOR_LABELS_PATH))
COLOR_INPUT_SHAPE = COLOR_MODEL.input_shape[1:3]

T5_TOKENIZER = AutoTokenizer.from_pretrained(T5_PATH, local_files_only=True)
T5_MODEL = AutoModelForSeq2SeqLM.from_pretrained(
    T5_PATH, local_files_only=True
).to(DEVICE)

print("✅ All models loaded")


# ============================================================
# OPENROUTER CONFIG
# ============================================================

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = "qwen/qwen-2-vl-72b-instruct"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

ELL_RESULTS = {}   # optional polling cache


# ============================================================
# COLOR UTILITIES
# ============================================================


COLOR_NORMALIZATION_MAP = {
    "grey": "gray",
    "dark grey": "gray",
    "light grey": "gray",
    "dark gray": "gray",
    "light gray": "gray",
}

def normalize_color_name(color: str) -> str:
    if not color:
        return "gray"
    return COLOR_NORMALIZATION_MAP.get(color.strip().lower(), color.strip().lower())


def get_saturation(rgb):
    r, g, b = [x / 255.0 for x in rgb]
    _, l, s = colorsys.rgb_to_hls(r, g, b)
    return s, l


def predict_color(rgb):
    r, g, b = [x / 255.0 for x in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)

    # Very dark
    if l < 0.10:
        return "black"

    # Neutral gray ONLY if hue is undefined
    if s < 0.15 and (h < 0.05 or h > 0.95):
        return "gray"

    # Let the model decide
    h_img, w_img = COLOR_INPUT_SHAPE
    patch = np.zeros((1, h_img, w_img, 3), dtype=np.uint8)
    patch[:] = rgb

    pred = COLOR_MODEL.predict(patch / 255.0, verbose=0)
    return COLOR_LABELS[int(np.argmax(pred))]



def extract_dominant_colors(path):
    img = Image.open(path).convert("RGB").resize((128, 128))
    arr = np.array(img).reshape(-1, 3)

    if len(arr) < 50:
        return ["grey"]

    km = KMeans(n_clusters=3, n_init=5).fit(arr)
    colors = []

    for c in km.cluster_centers_.astype(int):
        raw = predict_color(c)
        name = normalize_color_name(raw)

        if name not in colors:
            colors.append(name)

    return colors[:3]


# ============================================================
# T5 REPORT
# ============================================================

def generate_t5_report(emotion, colors):
    prompt = f"emotion: {emotion} | colors: {', '.join(colors)}"
    inputs = T5_TOKENIZER(prompt, return_tensors="pt").to(DEVICE)

    with torch.no_grad():
        out = T5_MODEL.generate(
            **inputs,
            max_length=120,
            do_sample=False
        )

    return T5_TOKENIZER.decode(out[0], skip_special_tokens=True)


# ============================================================
# OPENROUTER ASYNC
# ============================================================

def call_ellm_async(path, filename, emotion, confidence, analysis_id):
    try:
        img = Image.open(path).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")

        img_b64 = base64.b64encode(buf.getvalue()).decode()

        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": f"Emotion: {emotion} ({confidence:.1f}%)"},
                    {"type": "image_url",
                     "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}}
                ]
            }],
            "temperature": 0.35,
            "max_tokens": 450
        }

        r = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "HTTP-Referer": "https://hiddentales-frontend.s3-website-ap-southeast-2.amazonaws.com",
                "X-Title": "HiddenTales"
            },
            json=payload,
            timeout=60
        )

        r.raise_for_status()
        report = r.json()["choices"][0]["message"]["content"]

        db.collection("analysis").document(analysis_id).update({
            "ellmReport": report,
            "ellmStatus": "done",              # ✅ ADD
            "ellmCompletedAt": firestore.SERVER_TIMESTAMP
        })


        ELL_RESULTS[filename] = report

    except Exception as e:
        db.collection("analysis").document(analysis_id).update({
            "ellmError": str(e)
        })


# ============================================================
# STATIC
# ============================================================

@app.route("/uploads/<filename>")
def serve_upload(filename):
    return send_from_directory(
        UPLOAD_FOLDER,
        filename
    )



# ============================================================
# AUTH: SIGN UP
# ============================================================

@app.route("/api/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()
        email = data.get("email")
        username = data.get("username")
        password = data.get("password")

        if not email or not username or not password:
            return jsonify(success=False, message="Missing fields"), 400

        users_ref = db.collection("users")
        existing = users_ref.where("email", "==", email).limit(1).get()

        if len(existing) > 0:
            return jsonify(success=False, message="Email already registered"), 409

        users_ref.add({
            "email": email,
            "username": username,
            "password": generate_password_hash(password),
            "createdAt": firestore.SERVER_TIMESTAMP
        })

        return jsonify(
            success=True,
            message="Account created successfully"
        )

    except Exception as e:
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500

# ============================================================
# AUTH: LOGIN
# ============================================================

@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify(success=False, message="Missing credentials"), 400

        users_ref = db.collection("users")
        users = users_ref.where("email", "==", email).limit(1).get()

        if len(users) == 0:
            return jsonify(success=False, message="User not found"), 404

        user = users[0].to_dict()

        if not check_password_hash(user["password"], password):
            return jsonify(success=False, message="Invalid password"), 401

        # Simple session token (demo)
        token = f"token-{datetime.now().timestamp()}"

        return jsonify(
        success=True,
        userId=users[0].id,     # 🔥 THIS IS THE FIX
        username=user["username"],
        token=token
        )

    except Exception as e:
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500
    
# ============================================================
# CHILD: CREATE
# ============================================================

@app.route("/api/children", methods=["POST"])
def create_child():
    try:
        data = request.get_json()

        user_id = data.get("userId")
        name = data.get("name")
        age = data.get("age")
        gender = data.get("gender")
        photo = data.get("photo", "")

        if not user_id or not name:
            return jsonify(success=False, message="Missing data"), 400

        doc_ref = db.collection("children").document()  # ✅ create ID first
        doc_ref.set({
            "userId": user_id,
            "name": name,
            "age": age,
            "gender": gender,
            "photo": photo,
            "createdAt": firestore.SERVER_TIMESTAMP
        })

        return jsonify(
            success=True,
            childId=doc_ref.id
        )

    except Exception as e:
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500


# ============================================================
# CHILD: GET BY USER
# ============================================================

@app.route("/api/children", methods=["GET"])
def get_children():
    try:
        user_id = request.args.get("userId")

        if not user_id:
            return jsonify(success=False, message="Missing userId"), 400

        children_ref = db.collection("children").where("userId", "==", user_id)
        docs = children_ref.stream()

        children = []
        for doc in docs:
            d = doc.to_dict()
            children.append({
                "id": doc.id,
                "name": d.get("name"),
                "age": d.get("age"),
                "gender": d.get("gender"),
                "photo": d.get("photo", "")
            })

        return jsonify(success=True, children=children)

    except Exception as e:
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500

# ============================================================
# CHILD: DELETE (CASCADE)
# ============================================================

@app.route("/api/children/<child_id>", methods=["DELETE"])
def delete_child(child_id):
    try:
        print("🗑️ DELETE request for child_id:", child_id)

        doc_ref = db.collection("children").document(child_id)
        doc = doc_ref.get()

        if not doc.exists:
            print("⚠️ Child NOT found in Firestore:", child_id)
            return jsonify(success=False, message="Child not found"), 404

        doc_ref.delete()
        print("✅ Child deleted:", child_id)

        analyses = db.collection("analysis").where("childId", "==", child_id).stream()
        count = 0
        for d in analyses:
            d.reference.delete()
            count += 1

        print(f"🧹 Deleted {count} analysis documents")

        return jsonify(success=True)

    except Exception as e:
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500



# ============================================================
# FIXED GET ANALYSIS
# ============================================================
@app.route("/api/analysis", methods=["GET"])
def get_analysis():
    try:
        child_id = request.args.get("childId")
        if not child_id:
            return jsonify(success=False, message="Missing childId"), 400

        # Ensure ordering works correctly
        docs = (
            db.collection("analysis")
            .where("childId", "==", child_id)
            .order_by("createdAt", direction=firestore.Query.ASCENDING)
            .stream()
        )

        results = []
        for d in docs:
            data = d.to_dict()
            data["id"] = d.id  # Set the document ID
            
            # Convert Firestore Timestamp to ISO string/milliseconds for Frontend
            if "createdAt" in data and data["createdAt"]:
                try:
                    # This prevents the 'DatetimeWithNanoseconds' attribute error
                    data["createdAt"] = data["createdAt"].timestamp() * 1000
                except:
                    data["createdAt"] = None
                    
            results.append(data)

        return jsonify(success=True, results=results)
    except Exception as e:
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500


@app.route("/api/welcome/drawings", methods=["GET"])
def get_welcome_drawings():
    try:
        user_id = request.args.get("userId")
        if not user_id:
            return jsonify(success=False, message="Missing userId"), 400

        # 1️⃣ Get all children for this user
        children = db.collection("children").where("userId", "==", user_id).stream()
        child_ids = [c.id for c in children]

        if not child_ids:
            return jsonify(success=True, drawings=[])

        # 2️⃣ Get drawings from all children
        drawings = []
        for cid in child_ids:
            docs = (
                db.collection("analysis")
                .where("childId", "==", cid)
                .limit(10)
                .stream()
            )
            for d in docs:
                data = d.to_dict()
                drawings.append({
                    "id": d.id,
                    "imageUrl": data.get("imageUrl"),
                    "emotion": data.get("emotion"),
                    "createdAt": data.get("createdAt").timestamp() * 1000
                    if data.get("createdAt") else None
                })

        # 3️⃣ Shuffle & limit
        import random
        random.shuffle(drawings)

        return jsonify(success=True, drawings=drawings[:8])

    except Exception as e:
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500


# ============================================================
# ANALYSIS: DELETE (CASCADE IMAGE + FIRESTORE DOC)
# ============================================================
@app.route("/api/analysis/<analysis_id>", methods=["DELETE"])
def delete_analysis(analysis_id):
    try:
        doc_ref = db.collection("analysis").document(analysis_id)
        doc = doc_ref.get()

        if not doc.exists:
            return jsonify(success=False, message="Analysis not found"), 404

        data = doc.to_dict()

        # 🔥 DELETE IMAGE FILE
        image_url = data.get("imageUrl")
        if image_url:
            filename = image_url.split("/")[-1]
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                print("🗑️ Image deleted:", file_path)

        # 🔥 DELETE FIRESTORE DOC
        doc_ref.delete()
        print("🗑️ Analysis deleted:", analysis_id)

        return jsonify(success=True)

    except Exception as e:
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500

# ============================================================
# FIXED PREDICT (Ensuring analysis_id is a string)
# ============================================================
@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        child_id = request.form.get("childId")
        file = request.files.get("drawing")
        title = request.form.get("title") or "Untitled"

        if not child_id or not file:
            return jsonify(success=False, message="Missing data"), 400

        filename = secure_filename(f"{int(datetime.now().timestamp())}_{file.filename}")
        path = os.path.join(UPLOAD_FOLDER, filename)
        # 🔥 RESIZE & OPTIMIZE IMAGE BEFORE SAVING
        img = Image.open(file).convert("RGB")
        img.thumbnail((1024, 1024))     # limit size
        img.save(path, optimize=True, quality=85)

        public_base = (PUBLIC_BACKEND_URL or "").rstrip("/")
        image_url = f"{public_base}/uploads/{filename}"



        # AI Processing (Keep your existing ViT/Color logic here)
        img = Image.open(path).convert("RGB")
        x = EVAL_TF(img).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            probs = torch.softmax(VIT_MODEL(x), dim=1)[0]
        
        idx = int(torch.argmax(probs))
        emotion = EMOTION_LABELS[idx]
        confidence = float(probs[idx] * 100)
        prob_dict = {EMOTION_LABELS[i]: float(probs[i] * 100) for i in range(len(EMOTION_LABELS))}
        colors = extract_dominant_colors(path)
        t5_text = generate_t5_report(emotion, colors)

        # Save to Firebase
        new_doc = {
        "childId": child_id,
        "title": title,
        "emotion": emotion,
        "confidence": confidence,
        "probabilities": prob_dict,
        "colors": colors,
        "t5Report": t5_text,

        "ellmStatus": "pending",   # ✅ ADD THIS

        "imageUrl": image_url,
        "createdAt": firestore.SERVER_TIMESTAMP
    }

        
        doc_ref = db.collection("analysis").document() # Create ID first
        doc_ref.set(new_doc)
        analysis_id = doc_ref.id

        # Start Async LLM
        threading.Thread(
            target=call_ellm_async,
            args=(path, filename, emotion, confidence, analysis_id),
            daemon=True
        ).start()

        return jsonify(
            success=True,
            analysisId=analysis_id,
            emotion=emotion,
            probabilities=prob_dict,
            colors=colors,
            narrative_report=t5_text,
            image_url=image_url
        )

    except Exception as e:
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500
    
    
    
@app.route("/api/report/pdf/<analysis_id>", methods=["GET"])
def generate_pdf_report(analysis_id):
    try:
        doc = db.collection("analysis").document(analysis_id).get()
        if not doc.exists:
            return jsonify(success=False, message="Analysis not found"), 404

        data = doc.to_dict()
        child_id = data["childId"]

        child_doc = db.collection("children").document(child_id).get()
        child = child_doc.to_dict() if child_doc.exists else {}

        buffer = io.BytesIO()
        pdf = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        # ✅ MUST EXIST
        styles = getSampleStyleSheet()

        styles.add(ParagraphStyle(
            name="ReportTitle",
            fontSize=18,
            alignment=TA_CENTER,
            spaceAfter=14,
            fontName="Helvetica-Bold"
        ))

        styles.add(ParagraphStyle(
            name="ReportBody",
            fontSize=10,
            leading=14,
            spaceAfter=10
        ))

        story = []

        # ── HEADER ─────────────────────────────
        story.append(Paragraph(
            "HiddenTales – Emotional Analysis Report",
            styles["ReportTitle"]
        ))

        story.append(Paragraph(
            "AI-assisted emotional interpretation from children’s drawings",
            ParagraphStyle(
                "Sub",
                fontSize=10,
                alignment=TA_CENTER,
                textColor=colors.grey
            )
        ))

        story.append(Spacer(1, 14))

        # ── CHILD INFO ─────────────────────────
        info = [
            ["Child Name", child.get("name", "-"), "Age", child.get("age", "-")],
            ["Drawing Title", data.get("title", "Untitled"),
             "Date", datetime.now().strftime("%d %b %Y")]
        ]

        table = Table(info, colWidths=[80, 160, 50, 120])
        table.setStyle(TableStyle([
            ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
            ("BACKGROUND", (0,0), (-1,0), colors.whitesmoke),
            ("FONT", (0,0), (-1,-1), "Helvetica", 9),
        ]))

        story.append(table)
        story.append(Spacer(1, 14))

        # ── DRAWING IMAGE ──────────────────────
        img_url = data.get("imageUrl")
        if img_url:
            filename = img_url.split("/")[-1]
            path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(path):
                story.append(RLImage(path, width=240, height=240))
                story.append(Spacer(1, 12))

        # ── EMOTION TABLE ──────────────────────
        probs = data.get("probabilities", {})
        emotion_table = [["Emotion", "Confidence"]] + [
            [k.capitalize(), f"{v:.2f}%"] for k, v in probs.items()
        ]

        et = Table(emotion_table, colWidths=[120, 120])
        et.setStyle(TableStyle([
            ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
            ("BACKGROUND", (0,0), (-1,0), colors.lightgrey),
            ("FONT", (0,0), (-1,-1), "Helvetica", 9),
        ]))

        story.append(et)
        story.append(Spacer(1, 10))

        # ── COLORS ─────────────────────────────
        story.append(Paragraph(
            f"<b>Dominant Colors:</b> {', '.join(data.get('colors', []))}",
            styles["ReportBody"]
        ))

        # ── PSYCHOLOGICAL REPORT ───────────────
        combined = (
            (data.get("t5Report") or "") + "\n\n" +
            (data.get("ellmReport") or "")
        ).strip()

        if combined:
            story.append(Spacer(1, 10))
            story.append(Paragraph(
                "<b>Psychological Interpretation</b>",
                styles["ReportBody"]
            ))
            story.append(Paragraph(
                combined.replace("\n", "<br/>"),
                styles["ReportBody"]
            ))

        # ── DISCLAIMER ─────────────────────────
        story.append(Spacer(1, 14))
        story.append(Paragraph(
            "<i>This report is generated to support emotional awareness and early reflection. "
            "It is not intended to replace professional psychological assessment or diagnosis.</i>",
            ParagraphStyle("Disc", fontSize=8, textColor=colors.grey)
        ))

        pdf.build(story)
        buffer.seek(0)

        return send_file(
            buffer,
            as_attachment=True,
            download_name="HiddenTales_Report.pdf",
            mimetype="application/pdf"
        )

    except Exception as e:
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500


@app.route("/api/welcome/emotion-of-week", methods=["GET"])
def get_emotion_of_week():
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify(success=False), 400

    # get all children
    children = db.collection("children").where("userId", "==", user_id).stream()
    child_ids = [c.id for c in children]

    if not child_ids:
        return jsonify(success=True, data=None)

    # get random analysis
    analyses = []
    for cid in child_ids:
        docs = db.collection("analysis").where("childId", "==", cid).stream()
        analyses.extend([d.to_dict() | {"id": d.id} for d in docs])

    if not analyses:
        return jsonify(success=True, data=None)

    import random
    pick = random.choice(analyses)

    return jsonify(success=True, data={
        "imageUrl": pick.get("imageUrl"),
        "emotion": pick.get("emotion"),
        "report": (pick.get("t5Report") or "")[:250]  # short
    })
@app.route("/api/parent-feedback", methods=["POST"])
def submit_parent_feedback():
    try:
        data = request.get_json()

        user_id = data.get("userId")
        message = data.get("message")
        emotion = data.get("emotion", "general")
        child_id = data.get("childId")  # optional

        if not user_id or not message:
            return jsonify(success=False, message="Missing data"), 400

        db.collection("parent_feedback").add({
            "userId": user_id,
            "childId": child_id,
            "emotion": emotion,
            "message": message,
            "createdAt": firestore.SERVER_TIMESTAMP
        })

        return jsonify(success=True)

    except Exception as e:
        traceback.print_exc()
        return jsonify(success=False, message=str(e)), 500
    
@app.route("/api/parent-feedback", methods=["GET"])
def get_parent_feedback():
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify(success=False), 400

    docs = (
        db.collection("parent_feedback")
        .where("userId", "==", user_id)
        .order_by("createdAt", direction=firestore.Query.DESCENDING)
        .limit(10)
        .stream()
    )

    results = []
    for d in docs:
        data = d.to_dict()
        results.append({
            "id": d.id,
            "message": data.get("message"),
            "emotion": data.get("emotion"),
        })

    return jsonify(success=True, results=results)


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    print("🚀 HiddenTales Backend running at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)

