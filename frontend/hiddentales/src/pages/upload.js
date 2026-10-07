// src/pages/upload.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import bgImg from "../assets/background.jpeg";
import { apiFetch } from "../config/api";

const API_BASE_URL =
  (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");

function resolveImageUrl(url) {
  if (!url) return "";

  // If backend already returns relative path like "/uploads/xxx.jpg"
  if (url.startsWith("/uploads/")) return `${API_BASE_URL}${url}`;

  // Fix old stored urls that contain localhost / 127.0.0.1
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    const fname = url.split("/uploads/").pop();
    return `${API_BASE_URL}/uploads/${fname}`;
  }

  return url;
}


const EMOTION_ORDER = ["happy", "sad", "angry", "fear"];
const clampPct = (n) => Math.max(0, Math.min(100, Number(n ?? 0)));
const formatTime = (ts) => new Date(ts).toLocaleString();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Emotion bar colors (Emotion Analysis section)
const BAR_COLOR = {
  happy: "#FFD300", // yellow
  sad: "#2196F3",   // blue
  angry: "#E53935", // red
  fear: "#9C27B0",  // purple
};


/**
 * ✅ Stable key (token-first).
 * Prevents switching storage key when username appears later.
 */
function getUserKey() {
  const t = (localStorage.getItem("token") || "").trim();
  const u = (localStorage.getItem("username") || "").trim();
  const raw = t ? `token_${t.slice(0, 18)}` : u ? `user_${u}` : "guest";
  return encodeURIComponent(raw);
}

/** Used for migration if userKey changed in older code */

const childrenKey = (userKey) => `children_${userKey}`;
const activeChildKey = (userKey) => `active_child_${userKey}`;

/* Determine dominant emotion */
function dominantEmotion(probs) {
  let best = { label: null, value: -1 };
  for (const k of EMOTION_ORDER) {
    const v = clampPct(probs?.[k]);
    if (v > best.value) best = { label: k, value: v };
  }
  return best;
}

/* Emojis */
const EMOJI = {
  happy: "😊",
  sad: "😢",
  angry: "😡",
  fear: "😱",
};

/* Dot colors */
const COLOR = {
  happy: "#FFD300",
  sad: "#2196F3",
  angry: "#E53935",
  fear: "#9C27B0",
};

/* ───────────────────────────────────────────────
     WARNING POPUP
────────────────────────────────────────────── */
function WarningModal({ visible, onClose, onParenting, onPsychologist }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[28px] p-10 shadow-2xl w-[92%] max-w-3xl text-center border border-black/5">
        <div className="flex justify-center mb-4">
          <svg width="160" height="160" viewBox="0 0 24 24" fill="#ff4b4b">
            <path d="M12 2L1 21h22L12 2z" />
            <circle cx="12" cy="16" r="1.5" fill="black" />
            <rect x="11" y="8" width="2" height="6" fill="black" />
          </svg>
        </div>

        <h1 className="text-4xl font-extrabold mb-6 tracking-tight text-slate-900">
          WARNING!
        </h1>

        <p className="text-2xl font-black bg-yellow-300 text-black py-6 px-4 rounded-xl shadow mb-8">
          YOUR CHILD MAY BE EXPERIENCING EMOTIONAL DIFFICULTIES
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={onClose}
            className="bg-[#57B7FF] text-black px-8 py-4 rounded-2xl font-bold shadow hover:scale-[1.02] transition"
          >
            I CAN HANDLE IT
            <br />
            ON MY OWN
          </button>

          <button
            onClick={onParenting}
            className="bg-[#FFF067] text-black px-8 py-4 rounded-2xl font-bold shadow hover:scale-[1.02] transition"
          >
            PARENTING TIPS
          </button>
          <button
            onClick={onPsychologist}
            className="bg-[#4CFF4C] text-black px-8 py-4 rounded-2xl font-bold shadow hover:scale-[1.02] transition"
          >
            CONSULTATION WITH
            <br />
            PSYCHOLOGIST
        </button>

        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
     UPLOAD MODAL
────────────────────────────────────────────── */
function UploadModal({
  visible,
  onClose,
  onUpload,
  title,
  setTitle,
  preview,
  onChooseFile,
  uploading,
  loading,
  error,
}) {
  const fileInputRef = useRef(null);
  if (!visible) return null;

  const STAGES = [
    "Uploading your drawing",
    "Running AI emotion model",
    "Generating psychology report",
    "Finalizing results",
  ];

  const stageLabel = loading?.label || (uploading ? "Processing" : "");
  const pct = Math.max(0, Math.min(100, Number(loading?.pct ?? 0)));
  const stageIdx = Math.max(
    0,
    Math.min(3, STAGES.findIndex((x) => x === stageLabel))
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center">
      <style>{`
        @keyframes htSpin { to { transform: rotate(360deg); } }
        @keyframes htDot {
          0%, 80%, 100% { transform: translateY(0); opacity: .4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes htShimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .ht-spin { animation: htSpin 1s linear infinite; }
        .ht-dot1 { animation: htDot 1.2s ease-in-out infinite; }
        .ht-dot2 { animation: htDot 1.2s ease-in-out infinite .15s; }
        .ht-dot3 { animation: htDot 1.2s ease-in-out infinite .30s; }
        .ht-shimmer {
          background: linear-gradient(90deg, rgba(229,57,53,0.10), rgba(229,57,53,0.25), rgba(229,57,53,0.10));
          background-size: 200% 200%;
          animation: htShimmer 1.2s ease-in-out infinite;
        }
      `}</style>

      <div className="relative bg-white w-[440px] rounded-[26px] p-8 shadow-2xl border border-black/5">
        <button
          onClick={() => {
            if (!uploading) onClose();
          }}
          className={`absolute -top-4 -right-4 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg transition
            ${
              uploading
                ? "bg-black/30 text-white/70 cursor-not-allowed"
                : "bg-black text-white hover:scale-110"
            }
          `}
          title={uploading ? "Analyzing... please wait" : "Close"}
        >
          ✕
        </button>

        <h2 className="text-3xl font-extrabold text-center mb-6 tracking-tight text-slate-900">
          Upload File
        </h2>

        <div
          className={`block w-full bg-white border-2 border-dashed rounded-2xl py-10 text-center transition
            ${
              uploading
                ? "border-black/10 opacity-60 cursor-not-allowed"
                : "border-black/15 cursor-pointer hover:border-black/25"
            }
          `}
          onClick={() => {
            if (!uploading) fileInputRef.current?.click();
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => onChooseFile(e.target.files?.[0])}
            className="hidden"
            disabled={uploading}
          />

          <div className="text-slate-500 text-lg">Drag & drop or click to upload</div>

          <button
            type="button"
            disabled={uploading}
            className={`mt-3 px-6 py-2 rounded-full font-semibold border border-black/10 shadow-sm
              bg-gradient-to-b from-[#FFE89A] to-[#F4C847]
              ${uploading ? "opacity-70 cursor-not-allowed" : ""}
            `}
          >
            Select File
          </button>
        </div>

        {preview && (
          <img
            src={preview}
            alt="preview"
            className="w-full h-[250px] object-contain rounded-2xl mt-5 shadow border border-black/5 bg-white"
          />
        )}

        <div className="mt-6">
          <label className="text-lg font-bold block mb-2 text-slate-900">Name Your Drawing</label>
          <input
            type="text"
            placeholder="Enter drawing name..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading}
            className={`w-full p-4 bg-white rounded-2xl text-base shadow-inner
              border border-black/10 focus:outline-none focus:ring-2 focus:ring-yellow-300
              ${uploading ? "opacity-70 cursor-not-allowed" : ""}
            `}
          />
        </div>

        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}

        <div className="flex justify-center mt-6">
          <button
            onClick={onUpload}
            disabled={uploading}
            className="w-14 h-14 rounded-full grid place-items-center text-2xl font-black
                       bg-black text-yellow-200 shadow hover:scale-105 transition disabled:opacity-60"
            type="button"
            title={uploading ? "Analyzing..." : "Upload"}
          >
            ✔
          </button>
        </div>

        {uploading && (
          <div className="absolute inset-0 rounded-[26px] bg-white/75 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="w-[86%] max-w-[360px] bg-white rounded-2xl border border-black/10 shadow-xl p-6 text-center">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full border-4 border-black/10 border-t-[#E53935] ht-spin" />

              <div className="text-[18px] font-extrabold text-slate-900">
                {loading?.label || "Processing"}
                <span className="inline-flex ml-1">
                  <span className="ht-dot1">.</span>
                  <span className="ht-dot2">.</span>
                  <span className="ht-dot3">.</span>
                </span>
              </div>

              <div className="text-[13px] text-slate-600 mt-2 leading-relaxed">
                Please wait while HiddenTales processes the image and generates the report.
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-[12px] text-slate-600 mb-2">
                  <span>Progress</span>
                  <span className="font-bold text-slate-800">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-[10px] rounded-full bg-black/10 overflow-hidden">
                  <div className="h-full rounded-full ht-shimmer transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="mt-5 text-left text-[12px] text-slate-700 space-y-2">
                {[
                  "Uploading your drawing",
                  "Running AI emotion model",
                  "Generating psychology report",
                  "Finalizing results",
                ].map((s, i) => {
                  const done = i < stageIdx;
                  const current = i === stageIdx;
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <span
                        className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-[12px] font-black
                          ${
                            done
                              ? "bg-green-500 text-white"
                              : current
                              ? "bg-[#E53935] text-white"
                              : "bg-black/10 text-black/40"
                          }
                        `}
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <span className={`${done ? "line-through text-slate-400" : ""}`}>{s}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 text-[12px] text-slate-500">Do not close this window.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
     TREND CHART
────────────────────────────────────────────── */
function TrendChart({ points }) {
  if (!points?.length)
    return (
      <div className="h-[240px] grid place-items-center text-slate-500">
        Upload drawings to see emotional trend
      </div>
    );

  const W = 580, H = 280, P = 40;

  const y = (v) => {
    const normalized = (v + 100) / 200;
    return H - P - normalized * (H - 2 * P);
  };

  const x = (i) => P + (i / Math.max(points.length - 1, 1)) * (W - 2 * P);

  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.v)}`).join(" ");

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <line x1={P} y1={y(0)} x2={W - P} y2={y(0)} stroke="black" strokeDasharray="4" />
      <path d={path} fill="none" stroke="black" strokeWidth="2" />
      {points.map((p, i) => (
        <g key={i}>
          <text x={x(i) - 10} y={y(p.v) - 20} fontSize="20">{EMOJI[p.emotion]}</text>
          <circle cx={x(i)} cy={y(p.v)} r="6" fill={COLOR[p.emotion]} />
          <text x={x(i) - 10} y={y(p.v) + 15} fontSize="12" fontWeight="bold">
            {Math.abs(p.v).toFixed(1)}%
          </text>
          <text x={x(i) - 12} y={y(p.v) + 30} fontSize="10" fill="gray">{p.emotion}</text>
        </g>
      ))}
    </svg>
  );
}

function SlimBar({ label, value, active }) {
  const pct = clampPct(value);
  const color = BAR_COLOR[label] || "#999";

  return (
    <div className="mb-5">
      <div className="flex items-end justify-between">
        <div className="text-[20px] font-semibold text-slate-900 capitalize">
          {label}
        </div>
        <div className="text-[22px] font-extrabold text-slate-900">
          {pct.toFixed(2)}%
        </div>
      </div>

      <div className="mt-2 h-[6px] rounded-full bg-black/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: active ? color : "rgba(0,0,0,0.18)",
          }}
        />
      </div>
    </div>
  );
}


/* ───────────────────────────────────────────────
     ALARM ENGINE
────────────────────────────────────────────── */
const ALARM = { ctx: null, osc: null, gain: null, timer: null, running: false };

function ensureAlarmAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!ALARM.ctx) {
    ALARM.ctx = new AudioCtx();
    ALARM.osc = ALARM.ctx.createOscillator();
    ALARM.gain = ALARM.ctx.createGain();

    ALARM.osc.type = "square";
    ALARM.osc.frequency.setValueAtTime(880, ALARM.ctx.currentTime);
    ALARM.gain.gain.setValueAtTime(0.0001, ALARM.ctx.currentTime);

    ALARM.osc.connect(ALARM.gain);
    ALARM.gain.connect(ALARM.ctx.destination);
    ALARM.osc.start();
  }

  if (ALARM.ctx?.state === "suspended") ALARM.ctx.resume?.();
  return ALARM.ctx;
}

function alarmBeepPattern() {
  if (!ALARM.ctx || !ALARM.osc || !ALARM.gain) return;
  const ctx = ALARM.ctx;
  const g = ALARM.gain.gain;
  const o = ALARM.osc;
  const now = ctx.currentTime;
  const peak = 0.28;

  o.frequency.setValueAtTime(980, now);
  g.cancelScheduledValues(now);
  g.setValueAtTime(0.0001, now);
  g.exponentialRampToValueAtTime(peak, now + 0.015);
  g.exponentialRampToValueAtTime(0.0001, now + 0.16);

  o.frequency.setValueAtTime(740, now + 0.22);
  g.setValueAtTime(0.0001, now + 0.22);
  g.exponentialRampToValueAtTime(peak, now + 0.235);
  g.exponentialRampToValueAtTime(0.0001, now + 0.39);
}

function startAlarmLoop() {
  ensureAlarmAudio();
  if (!ALARM.ctx) return;
  if (ALARM.running) return;
  ALARM.running = true;
  alarmBeepPattern();
  ALARM.timer = window.setInterval(alarmBeepPattern, 1100);
}

function stopAlarmLoop() {
  if (ALARM.timer) {
    window.clearInterval(ALARM.timer);
    ALARM.timer = null;
  }
  ALARM.running = false;
  try {
    if (ALARM.ctx && ALARM.gain) {
      const t = ALARM.ctx.currentTime;
      ALARM.gain.gain.cancelScheduledValues(t);
      ALARM.gain.gain.setValueAtTime(0.0001, t);
    }
  } catch {}
}

function primeAlarmAudioOnGesture() {
  ensureAlarmAudio();
  try {
    if (ALARM.ctx && ALARM.gain) {
      const t = ALARM.ctx.currentTime;
      ALARM.gain.gain.setValueAtTime(0.0001, t);
    }
  } catch {}
}

function WarningTriangleButton({ onClick, ackKey }) {
  const [ack, setAck] = useState(() => localStorage.getItem(ackKey) === "1");

  useEffect(() => {
    setAck(localStorage.getItem(ackKey) === "1");
  }, [ackKey]);

  const handleClick = () => {
    stopAlarmLoop();
    setAck(true);
    localStorage.setItem(ackKey, "1");
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative rounded-full p-1 transition ${ack ? "hover:scale-105" : "hover:scale-110"}`}
      aria-label="Open warning"
      title="Important – click to view warning"
    >
      {!ack && (
        <span className="absolute inset-0 rounded-full animate-warnGlowRed" style={{ pointerEvents: "none" }} />
      )}

      <span className={`${ack ? "" : "animate-warnShake"}`}>
        <svg width="54" height="54" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="warnGradRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFB3B3" />
              <stop offset="55%" stopColor="#FF4D4D" />
              <stop offset="100%" stopColor="#D60000" />
            </linearGradient>
          </defs>
          <path
            d="M12 2L1 21h22L12 2z"
            fill="url(#warnGradRed)"
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="0.8"
            className={!ack ? "animate-warnPulseRed" : ""}
          />
          <rect x="11" y="8" width="2" height="6" fill="black" rx="1" />
          <circle cx="12" cy="16.6" r="1.2" fill="black" />
        </svg>
      </span>

      {!ack && (
        <span className="absolute -top-2 -right-2 text-[11px] font-bold bg-[#B30000] text-white px-2 py-0.5 rounded-full shadow">
          ALERT
        </span>
      )}
    </button>
  );
}

function ProfileIconButton({ onClick }) {
  const [username, setUsername] = useState("User");

  useEffect(() => {
    const saved = (localStorage.getItem("username") || "").trim();
    if (saved) setUsername(saved);
  }, []);

  const initials = useMemo(() => {
    const parts = (username || "U").trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "U";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
  }, [username]);

  return (
    <button
      onClick={onClick}
      type="button"
      aria-label="Open profile"
      title="Profile"
      className="
        h-[58px] w-[58px] rounded-full
        bg-white/85 backdrop-blur border border-black/10
        shadow-[0_14px_30px_rgba(0,0,0,0.10)]
        grid place-items-center
        hover:scale-[1.03] active:scale-[0.98] transition
      "
    >
      <div className="h-10 w-10 rounded-full bg-black text-amber-200 grid place-items-center font-extrabold">
        {initials}
      </div>
    </button>
  );
}

/* ───────────────────────────────────────────────
     MAIN PAGE
────────────────────────────────────────────── */
export default function UploadPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const userKey = useMemo(() => getUserKey(), []);

  const [child, setChild] = useState(() => location.state?.child || null);

  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [showUpload, setShowUpload] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [loading, setLoading] = useState({ stage: "idle", label: "", pct: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);

  const selected = useMemo(() => items.find((i) => i.id === selectedId), [items, selectedId]);
  const isNegative = selected && ["sad", "angry", "fear"].includes(selected.emotion);
  const dominant = useMemo(() => dominantEmotion(selected?.probabilities || {}), [selected]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);


  // Recover child after refresh OR set active child when coming from folders
  useEffect(() => {
    if (location.state?.child?.id) {
      setChild(location.state.child);
      localStorage.setItem(activeChildKey(userKey), location.state.child.id);
      return;
    }

    const activeId = localStorage.getItem(activeChildKey(userKey));
    if (!activeId) {
      setChild(null);
      return;
    }

    try {
      const raw = localStorage.getItem(childrenKey(userKey));
      const list = raw ? JSON.parse(raw) : [];
      const found = Array.isArray(list)
  ? list.find((c) => c.id === activeId || c.childId === activeId)
  : null;

      setChild(found || null);
      if (found && !found.id && found.childId) {
      found.id = found.childId;
    }

    } catch {
      setChild(null);
    }
  }, [location.state, userKey]);

  // ✅ Load drawings with migration across possible keys
  // ✅ LOAD DRAWINGS FROM FIREBASE (BACKEND API)
useEffect(() => {
  stopAlarmLoop();

  if (!child?.id) {
    setItems([]);
    setSelectedId(null);
    return;
  }

  apiFetch(`/api/analysis?childId=${child.id}`)
    .then((res) => res.json())
  .then((data) => {
      if (!data.success) return;

     const mapped = data.results
    .map((x) => ({
      id: x.id,
      title: x.title || "Untitled",
      createdAt:
        typeof x.createdAt === "number"
          ? x.createdAt
          : x.createdAt?.seconds
          ? x.createdAt.seconds * 1000
          : Date.now(),
      imageUrl: x.imageUrl,
      emotion: x.emotion,
      colors: x.colors,
      ellmReport: x.ellmReport || null,
      t5Report: x.t5Report || null,
      narrative: x.ellmReport || x.t5Report || "",
      probabilities: x.probabilities,
  }))

       // ✅ SORT: latest first
    .sort((a, b) => b.createdAt - a.createdAt);
    setItems(mapped);

    // ✅ select the latest drawing automatically
    setSelectedId(mapped[0]?.id || null);

    })
    .catch(() => {
      setItems([]);
      setSelectedId(null);
    });
}, [child?.id]);

// 🔄 POLL FOR ELLM REPORT COMPLETION
useEffect(() => {
  if (!selectedId || !child?.id || selected?.ellmReport) return;
  const interval = setInterval(async () => {
    try {
     const res = await apiFetch(`/api/analysis?childId=${child.id}`);
      const data = await res.json();
      if (!data.success) return;

      const updated = data.results.find(r => r.id === selectedId);

      if (updated?.ellmReport) {
        setItems(prev =>
          prev.map(it =>
            it.id === selectedId
              ? {
                  ...it,
                  ellmReport: updated.ellmReport,
                  narrative: updated.ellmReport
                }
              : it
          )
        );

        clearInterval(interval); // ✅ stop polling once ELLM arrives
      }
    } catch (e) {
      // silently ignore polling errors
    }
  }, 5000); // every 5 seconds

  return () => clearInterval(interval);
}, [selectedId, child?.id]);


  /* Store updates per user+child
  useEffect(() => {
    if (!child?.id) return;
    localStorage.setItem(drawingsKey(userKey, child.id), JSON.stringify(items));
  }, [items, child?.id, userKey]);*/

const trend = useMemo(() => {
  // Chart should be chronological: oldest -> latest
  // so the latest drawing appears on the RIGHT
  const chron = [...items].sort((a, b) => a.createdAt - b.createdAt);

  return chron.map((it, idx) => {
    const best = dominantEmotion(it.probabilities);
    const val = best.label === "happy" ? best.value : -best.value;
    return { t: idx, v: val, emotion: best.label };
  });
}, [items]);


  const onChooseFile = (f) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  useEffect(() => {
    if (!uploading) return;

    const capForStage = (stage) => {
      if (stage === "upload") return 22;
      if (stage === "analyzing") return 70;
      if (stage === "generating") return 92;
      if (stage === "finalizing") return 99;
      return 10;
    };

    const speedForStage = (stage) => {
      if (stage === "upload") return 1.8;
      if (stage === "analyzing") return 0.45;
      if (stage === "generating") return 0.75;
      if (stage === "finalizing") return 1.2;
      return 0.6;
    };

    const t = setInterval(() => {
      setLoading((prev) => {
        const cap = capForStage(prev.stage);
        const speed = speedForStage(prev.stage);
        const next = Math.min(prev.pct + speed, cap);
        return { ...prev, pct: next };
      });
    }, 120);

    return () => clearInterval(t);
  }, [uploading]);

  useEffect(() => {
    const mark = () => {
      setHasInteracted(true);
      primeAlarmAudioOnGesture();
    };
    window.addEventListener("pointerdown", mark, { once: true });
    window.addEventListener("keydown", mark, { once: true });
    return () => {
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
    };
  }, []);

  const warnAckKey = useMemo(() => {
    const sid = selected?.id || "none";
    const cid = child?.id || "none";
    return `warn_ack_${userKey}_${cid}_${sid}`;
  }, [userKey, child?.id, selected?.id]);

  useEffect(() => {
    if (!selected?.id) {
      stopAlarmLoop();
      return;
    }
    const acked = localStorage.getItem(warnAckKey) === "1";
    if (isNegative && !acked && hasInteracted) startAlarmLoop();
    else stopAlarmLoop();
    return () => stopAlarmLoop();
  }, [isNegative, selected?.id, warnAckKey, hasInteracted]);

 const analyzeAndSave = async () => {
    if (!file) {
        setError("Please select an image.");
        return;
    }

    try {
        setError("");
        setUploading(true);
        setLoading({ stage: "upload", label: "Uploading your drawing", pct: 10 });

        const fd = new FormData();
        fd.append("drawing", file);
        fd.append("childId", child.id);
        fd.append("title", title);

        const res = await apiFetch(`/api/predict`, {
            method: "POST",
            body: fd,
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        setLoading({ stage: "finalizing", label: "Finalizing results", pct: 95 });

        // 1. Refresh the list from the server
        const refresh = await apiFetch(`/api/analysis?childId=${child.id}`);
        const refreshed = await refresh.json();
        
        if (refreshed.success) {
           const mapped = refreshed.results
            .map((x) => ({
              id: x.id,
              title: x.title || "Untitled",
              createdAt:
                typeof x.createdAt === "number"
                  ? x.createdAt
                  : x.createdAt?.seconds
                  ? x.createdAt.seconds * 1000
                  : Date.now(),
              imageUrl: x.imageUrl,
              emotion: x.emotion,
              colors: x.colors,
              ellmReport: x.ellmReport || null,
              t5Report: x.t5Report || null,
              narrative: x.ellmReport || x.t5Report || "",
              probabilities: x.probabilities,
            }))
           // ✅ latest first
            .sort((a, b) => b.createdAt - a.createdAt);

          setItems(mapped);

          // still keep this (VERY IMPORTANT)
          setSelectedId(data.analysisId);
        }

        // Reset Modal
        setShowUpload(false);
        setTitle("");
        setFile(null);
        setPreview("");
        
    } catch (err) {
        setError(err.message || "Upload failed");
    } finally {
        setUploading(false);
        setLoading({ stage: "idle", label: "", pct: 0 });
    }
};
  const handleDeleteDrawing = (analysisId) => {
  setPendingDeleteId(analysisId);
  setShowDeleteConfirm(true);
};

const confirmDeleteDrawing = async () => {
  if (!pendingDeleteId) return;

  try {
    const res = await apiFetch(`/api/analysis/${pendingDeleteId}`, {
  method: "DELETE",
});


    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Delete failed");
    }

    // ✅ Update UI only after backend success
    setItems((prev) => prev.filter((i) => i.id !== pendingDeleteId));

    // Reset selection if needed
    setSelectedId((prev) =>
      prev === pendingDeleteId ? null : prev
    );

  } catch (err) {
    alert("Failed to delete drawing. Please try again.");
  } finally {
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
  }
};
/* ✅ ADD PDF DOWNLOAD FUNCTION HERE */
const downloadPdfReport = async () => {
  if (!selected?.id) return;

  // 🛑 GUARD: ELLM report not ready yet
  if (!selected?.ellmReport) {
    alert("The report is still being generated. Please wait a moment.");
    return;
  }

  try {
    const res = await apiFetch(`/api/report/pdf/${selected.id}`);

    if (!res.ok) {
      throw new Error("Failed to generate report");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `HiddenTales_Report_${child?.name || "Child"}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert("Unable to download report. Please try again.");
  }
};


  const pageFont = {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  };

  const Card = ({ children, className = "" }) => (
    <div
      className={
        "rounded-[28px] bg-white/86 backdrop-blur-md border border-black/5 " +
        "shadow-[0_18px_50px_rgba(0,0,0,0.10)] " +
        className
      }
    >
      {children}
    </div>
  );

  const PillBtn = ({ children, onClick }) => (
    <button
      onClick={onClick}
      className="
        px-8 py-4 rounded-full text-[22px] font-medium text-slate-900
        bg-gradient-to-b from-[#FFE89A] to-[#F4C847]
        border border-black/10
        shadow-[0_14px_30px_rgba(0,0,0,0.10)]
        hover:brightness-[0.98] active:translate-y-[1px] transition
      "
    >
      {children}
    </button>
  );

  if (!child?.id) {
    return (
      <div className="min-h-screen relative overflow-hidden text-slate-900" style={pageFont}>
        <div
          className="absolute inset-0 z-0 pointer-events-none bg-center bg-cover opacity-30"
          style={{ backgroundImage: `url(${bgImg})` }}
        />
        <div className="absolute inset-0 z-0 pointer-events-none bg-white/60" />

        <div className="relative z-10">
          <header className="pt-10">
            <div className="mx-auto w-full max-w-[1280px] px-10 flex items-start justify-between">
              <div className="text-[44px] font-extrabold tracking-tight text-slate-900">
                HiddenTales
              </div>
              <div className="flex gap-4 items-center">
                <PillBtn onClick={() => navigate("/folders")}>Back to Folders</PillBtn>
                <ProfileIconButton onClick={() => navigate("/profile")} />
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[900px] px-10 pb-14">
            <Card className="p-10 mt-10 text-center">
              <div className="text-[28px] font-extrabold tracking-tight">No child selected</div>
              <div className="text-slate-600 mt-2 text-lg">
                Please go back to folders and select a child profile.
              </div>
              <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
                <PillBtn onClick={() => navigate("/folders")}>Go to Folders</PillBtn>
                <PillBtn onClick={() => navigate(-1)}>Back</PillBtn>
              </div>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-slate-900" style={pageFont}>
      <style>{`
        @keyframes warnPulseRed {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(214,0,0,0)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 14px 22px rgba(214,0,0,0.55)); }
        }
        @keyframes warnShake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-7deg); }
          40% { transform: rotate(7deg); }
          60% { transform: rotate(-5deg); }
          80% { transform: rotate(5deg); }
        }
        @keyframes warnGlowRed {
          0% { box-shadow: 0 0 0 0 rgba(214,0,0,0.55); opacity: 1; }
          70% { box-shadow: 0 0 0 16px rgba(214,0,0,0); opacity: 0.18; }
          100% { box-shadow: 0 0 0 0 rgba(214,0,0,0); opacity: 0; }
        }
        .animate-warnPulseRed { animation: warnPulseRed 1.15s ease-in-out infinite; transform-origin: center; }
        .animate-warnShake { animation: warnShake 0.85s ease-in-out infinite; transform-origin: 50% 65%; }
        .animate-warnGlowRed  { animation: warnGlowRed 1.45s ease-out infinite; }
      `}</style>

      <div
        className="absolute inset-0 z-0 pointer-events-none bg-center bg-cover opacity-30"
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      <div className="absolute inset-0 z-0 pointer-events-none bg-white/60" />

      <div className="relative z-10">
        <header className="pt-10">
          <div className="mx-auto w-full max-w-[1280px] px-10 flex items-start justify-between">
            <div className="text-[44px] font-extrabold tracking-tight text-slate-900">
              HiddenTales
            </div>

            <div className="flex gap-4 items-center">
              <PillBtn onClick={() => navigate("/welcome")}>Home</PillBtn>
              <PillBtn onClick={() => navigate("/folders")}>Folders</PillBtn>


              <ProfileIconButton onClick={() => navigate("/profile")} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] px-10 pb-14">
          <div className="mt-10 grid gap-10 lg:grid-cols-[340px_minmax(0,1fr)_420px] items-start">
            <Card className="p-0 overflow-hidden">
              <div className="p-8 pb-4 flex items-center justify-between">
                <div className="text-[30px] font-extrabold tracking-tight">{child?.name}</div>
                <button
                  onClick={() => {
                  if (!child?.id) {
                    setError("Please select a child first.");
                    return;
                  }
                  setShowUpload(true);
                }}

                  className="
                    w-12 h-12 rounded-full grid place-items-center text-3xl
                    bg-black/5 border border-black/10
                    hover:bg-black/10 transition
                  "
                  aria-label="add"
                  title="Add"
                >
                  +
                </button>
              </div>

              <div className="px-8 pb-8">
                <div className="h-[1px] bg-black/5 mb-6" />

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {items.length === 0 && (
                    <div className="text-slate-500">No drawings yet. Click + to upload.</div>
                  )}

                  {items.map((it) => (
  <div
    key={it.id}
    className={`
      relative w-full rounded-[18px] px-5 py-4 border transition
      ${
        selectedId === it.id
          ? "bg-black/5 border-black/10"
          : "bg-white border-black/5 hover:bg-black/3"
      }
    `}
  >
    {/* 🗑 DELETE BUTTON */}
    <button
  onClick={(e) => {
    e.stopPropagation();
    handleDeleteDrawing(it.id);
  }}
  className="
    absolute top-3 right-3
    h-8 w-8 rounded-full
    bg-white/90 backdrop-blur
    border border-black/10
    shadow-[0_4px_10px_rgba(0,0,0,0.12)]
    text-[#C9A300]
    hover:bg-[#FFF3C4]
    hover:text-[#9A7A00]
    hover:scale-105
    active:scale-95
    transition
  "
  title="Delete drawing"
>
  ✕
</button>


    {/* SELECT DRAWING */}
    <button
      onClick={() => setSelectedId(it.id)}
      className="w-full text-left"
    >
      <div className="flex items-center gap-4">
        <div className="min-w-0">
          <div className="text-[22px] font-extrabold tracking-tight truncate">
            {it.title}
          </div>
          <div className="text-[14px] text-slate-500 mt-1">
            {formatTime(it.createdAt)}
          </div>
        </div>

        <div className="ml-auto">
          <div className="h-14 w-14 rounded-[14px] bg-white border border-black/10 shadow-sm overflow-hidden grid place-items-center">
            <img
  src={resolveImageUrl(it.imageUrl)}
  alt="thumb"
  className="h-full w-full object-cover"
/>

          </div>
        </div>
      </div>
    </button>
  </div>
))}

                </div>
              </div>
            </Card>

            <Card className="p-10">
              <div className="min-h-[420px] grid place-items-center">
                {selected?.imageUrl ? (
                  <img
  src={resolveImageUrl(selected.imageUrl)}
  alt="selected drawing"
  className="max-h-[420px] w-full object-contain"
/>

                ) : (
                  <div className="text-slate-500">No drawing selected</div>
                )}
              </div>
            </Card>

            <Card className="p-10">
              <div className="text-[32px] font-extrabold tracking-tight mb-8">Emotion Analysis</div>

              {EMOTION_ORDER.map((k) => (
                <SlimBar
                  key={k}
                  label={k}
                  value={selected?.probabilities?.[k]}
                  active={dominant?.label === k}
                />
              ))}

              {selected && (
                <div className="mt-6 text-slate-700">
                  <div className="text-[16px] font-semibold">Primary emotion:</div>
                  <div className="text-[18px] mt-1 capitalize">{selected.emotion}</div>

                  <div className="text-[16px] font-semibold mt-4">Dominant Colors:</div>
                  <div className="text-[18px] mt-1">{selected.colors?.join(", ")}</div>
                </div>
              )}
            </Card>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-2 items-start">
            <Card className="p-10 relative">
              <div className="flex items-start justify-between">
                <div className="text-[30px] font-extrabold tracking-tight">Emotional Trends</div>

                {isNegative && (
                  <div className="mt-1">
                    <WarningTriangleButton ackKey={warnAckKey} onClick={() => setShowWarning(true)} />
                  </div>
                )}
              </div>

              <div className="mt-8">
                <TrendChart points={trend} />
              </div>
            </Card>

            <Card className="p-10">
             <div className="flex items-center justify-between mb-5">
  <div className="text-[28px] font-extrabold tracking-tight">
    {selected?.title || "Untitled"}
  </div>

  {selected && (
    <button
      onClick={downloadPdfReport}
      className="
        px-6 py-3 rounded-full
        text-sm font-bold
        bg-gradient-to-b from-[#FFE89A] to-[#F4C847]
        border border-black/10
        shadow
        hover:brightness-[0.97]
        transition
      "
    >
      Download PDF
    </button>
  )}
</div>


              {selected ? (
                <div className="space-y-6 text-slate-800">
                  <div className="flex gap-3 items-start">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-black/20" />
                    <div className="text-[20px]">
                      <span className="font-extrabold">Primary emotion:</span>{" "}
                      <span className="capitalize">{selected.emotion}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#F2C94C]" />
                    <div className="text-[20px]">
                      <span className="font-extrabold">Dominant Colors:</span>{" "}
                      {selected.colors?.join(", ")}
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-black/20" />

  <div className="mt-3 space-y-6 text-[18px] leading-[1.8] text-slate-700 whitespace-pre-line">

{/* 🧠 COMBINED PSYCHOLOGICAL INTERPRETATION */}
{(selected?.t5Report || selected?.ellmReport) && (
  <div className="rounded-xl border border-black/5 bg-yellow-50/70 p-5">
    <div className="text-[16px] font-extrabold text-slate-900 mb-3">
      Psychological Interpretation
    </div>

    <div className="text-[18px] leading-[1.8] text-slate-700 whitespace-pre-line">
      {selected?.t5Report && selected.t5Report.trim()}
      {selected?.t5Report && selected?.ellmReport && "\n\n"}
      {selected?.ellmReport && selected.ellmReport.trim()}
    </div>

    {/* ⚠️ Academic Disclaimer */}
    <div className="mt-4 pt-3 border-t border-black/10 text-[13px] text-slate-500 italic">
      This interpretation is generated to support emotional awareness and early reflection.
      It is not intended to replace professional psychological assessment or diagnosis.
    </div>
  </div>
)}


    {/* ⏳ FALLBACK */}
    {!selected?.t5Report && !selected?.ellmReport && (
      <div className="italic text-slate-500">
        Generating reports…
      </div>
    )}

  </div>
</div>

                </div>
              ) : (
                <div className="text-slate-500 text-lg">Upload a drawing to see the report.</div>
              )}
            </Card>
          </div>
        </main>

        <UploadModal
          visible={showUpload}
          onClose={() => setShowUpload(false)}
          onUpload={analyzeAndSave}
          title={title}
          setTitle={setTitle}
          preview={preview}
          onChooseFile={onChooseFile}
          uploading={uploading}
          loading={loading}
          error={error}
        />

       <WarningModal
          visible={showWarning}
          onClose={() => setShowWarning(false)}
          onParenting={() =>
            navigate("/parenting", {
              state: { emotion: selected?.emotion || "sad" },
            })
          }
          onPsychologist={() => {
            setShowWarning(false);
            navigate("/psychologist", {
              state: { emotion: selected?.emotion || "sad" },
            });
          }}
        />
        {showDeleteConfirm && (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-sm">
    <div className="
      w-[92%] max-w-md
      rounded-[28px]
      bg-white/90 backdrop-blur
      border border-black/5
      shadow-[0_30px_80px_rgba(0,0,0,0.25)]
      p-8 text-center
    ">
      <div className="text-[26px] font-extrabold text-slate-900 mb-3">
        Remove drawing?
      </div>

      <p className="text-slate-600 text-[17px] leading-relaxed">
        This drawing will be permanently removed from  
        <span className="font-semibold"> {child?.name}’s folder</span>.
      </p>

      <div className="mt-8 flex gap-4 justify-center">
        <button
          onClick={() => {
            setShowDeleteConfirm(false);
            setPendingDeleteId(null);
          }}
          className="
            px-6 py-3 rounded-full
            text-slate-700 font-semibold
            bg-white
            border border-black/10
            shadow-sm
            hover:bg-black/5
            transition
          "
        >
          Keep it
        </button>

        <button
          onClick={confirmDeleteDrawing}
          className="
            px-7 py-3 rounded-full
            font-bold text-slate-900
            bg-gradient-to-b from-[#FFE89A] to-[#F4C847]
            border border-black/10
            shadow-[0_10px_25px_rgba(0,0,0,0.18)]
            hover:brightness-[0.97]
            active:translate-y-[1px]
            transition
          "
        >
          Yes, remove
        </button>
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  )}