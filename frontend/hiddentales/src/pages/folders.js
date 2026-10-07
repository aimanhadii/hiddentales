
// src/pages/folders.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bgImg from "../assets/background.jpeg";
import { apiFetch } from "../config/api";


export default function FoldersPage() {


  useEffect(() => {
    async function loadChildren() {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        const res = await apiFetch(
        `/api/children?userId=${userId}` 
      );
        const data = await res.json();

        if (res.ok) {
          setChildren(data.children);
        }
      } catch {
        console.error("Failed to load children");
      }
    }

    loadChildren();
  }, []);


  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [children, setChildren] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [childToDelete, setChildToDelete] = useState(null);



  // Lock body scroll when modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (showForm) document.body.style.overflow = "hidden";
    else document.body.style.overflow = prev || "";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [showForm]);

  const removeChild = async () => {
  if (!childToDelete) return;

  try {
    const res = await apiFetch(`/api/children/${childToDelete}`, {
    method: "DELETE",
});



    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Delete failed");
    }

    setChildren((prev) => prev.filter((c) => c.id !== childToDelete));
  } catch (err) {
    alert("Failed to delete child. Please try again.");
  } finally {
    setShowDeleteConfirm(false);
    setChildToDelete(null);
  }
};




  return (
    <div className="relative min-h-screen text-gray-900 overflow-x-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-center bg-cover opacity-55"
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-white/60" />

      {/* Top bar */}
      <header className="sticky top-0 z-30">
        <div className="backdrop-blur-xl bg-white/55 border-b border-black/5">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-[26px] font-semibold tracking-tight">HiddenTales</div>
              <div className="hidden sm:block text-sm text-gray-600">
                Child folders & profiles
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="rounded-full px-5 py-2.5 font-semibold bg-[#F6D24A]
                           shadow-[0_8px_0_rgba(0,0,0,0.12)]
                           hover:translate-y-0.5 hover:shadow-[0_6px_0_rgba(0,0,0,0.12)]
                           active:translate-y-1 active:shadow-[0_4px_0_rgba(0,0,0,0.12)]
                           transition"
                title="Add child"
              >
                + Add Child
              </button>

              <button
                onClick={() => navigate(-1)}
                className="rounded-full px-5 py-2.5 font-semibold bg-white/80
                           border border-black/10 shadow-sm hover:bg-white transition"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Your child profiles
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Create a folder for each child. Upload drawings inside their folder to track
            emotions and generate reports.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-7 md:grid-cols-2">
          {children.map((c) => (
            <ChildCard
              key={c.id}
              child={c}
              onOpen={() => {
                navigate("/upload", { state: { child: c } });
              }}
              onDelete={() => {
              setChildToDelete(c.id);
              setShowDeleteConfirm(true);
            }}
            />
          ))}

          <button
            onClick={() => setShowForm(true)}
            className="group rounded-[26px] p-6 sm:p-7 text-left
                       bg-white/70 backdrop-blur-xl border border-black/10
                       shadow-[0_16px_40px_rgba(0,0,0,0.08)]
                       hover:shadow-[0_18px_50px_rgba(0,0,0,0.10)]
                       transition overflow-hidden relative"
          >
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition">
              <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[#F6D24A]/35 blur-2xl" />
              <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-black/5 blur-2xl" />
            </div>

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">Add a new child</div>
                <div
                  className="h-12 w-12 rounded-full bg-[#F6D24A] grid place-items-center
                             shadow-[0_8px_0_rgba(0,0,0,0.12)]
                             group-hover:translate-y-0.5 group-hover:shadow-[0_6px_0_rgba(0,0,0,0.12)]
                             transition"
                >
                  <span className="text-3xl leading-none">+</span>
                </div>
              </div>

              <p className="mt-3 text-gray-600">
                Save their name, age, gender and optional photo.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                Create profile
                <span className="inline-block translate-x-0 group-hover:translate-x-1 transition">
                  →
                </span>
              </div>
            </div>
          </button>
        </div>

        {children.length === 0 && (
          <div className="mt-10 rounded-[26px] bg-white/70 backdrop-blur-xl border border-black/10 p-8 text-center">
            <div className="text-2xl font-semibold">No child profiles yet</div>
            <p className="mt-2 text-gray-600">
              Click <b>+ Add Child</b> to create the first folder.
            </p>
          </div>
        )}
      </main>

      <ChildForm
      open={showForm}
      onClose={() => setShowForm(false)}
      onCreate={(child) => {
        setChildren((prev) => [child, ...prev]);
        setShowForm(false);

        setSuccessMsg(`🎉 ${child.name}’s folder is ready!`);

        setTimeout(() => {
          setSuccessMsg("");
        }, 2500);
      }}
    />
      {successMsg && (
  <div
    className="fixed inset-0 z-50
               flex items-center justify-center
               bg-black/20 backdrop-blur-sm"
  >
    <div
      className="rounded-2xl bg-[#F6D24A]
                 px-6 py-4 font-semibold text-gray-900 text-lg
                 shadow-[0_20px_50px_rgba(0,0,0,0.35)]
                 animate-fade-in"
    >
      {successMsg}
    </div>
  </div>
)}
{/* ⬇️⬇️⬇️ PASTE DELETE CONFIRM MODAL EXACTLY HERE ⬇️⬇️⬇️ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div
            className="relative w-full max-w-md rounded-[28px]
                       bg-white/85 backdrop-blur-xl
                       border border-black/10
                       shadow-[0_24px_70px_rgba(0,0,0,0.25)]
                       p-7"
          >
            <div className="h-2 w-full rounded-t-[28px] bg-[#F6D24A] absolute top-0 left-0" />


            <h3 className="text-2xl font-semibold tracking-tight">
              Delete child folder?
            </h3>

            <p className="mt-3 text-gray-700">
              This will permanently remove the child profile and
              <b> all related drawings and reports</b>.
              <br />
              This action cannot be undone. Please make sure before continuing.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setChildToDelete(null);
                }}
                className="rounded-full px-5 py-2.5
                           bg-white/80 border border-black/10
                           font-semibold hover:bg-white transition"
              >
                Cancel
              </button>

         <button
            onClick={removeChild}
            className="rounded-full px-5 py-2.5
                      bg-[#F6D24A] text-gray-900 font-semibold
                      shadow-[0_8px_0_rgba(0,0,0,0.12)]
                      hover:translate-y-0.5 hover:shadow-[0_6px_0_rgba(0,0,0,0.12)]
                      active:translate-y-1 active:shadow-[0_4px_0_rgba(0,0,0,0.12)]
                      transition"
          >
            Yes, delete
          </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

}

function ChildCard({ child, onOpen, onDelete }) {
  return (
    <div
      className="rounded-[26px] p-6 sm:p-7
                 bg-white/70 backdrop-blur-xl border border-black/10
                 shadow-[0_16px_40px_rgba(0,0,0,0.08)]
                 hover:shadow-[0_18px_50px_rgba(0,0,0,0.10)]
                 transition relative overflow-hidden"
    >
      <div className="absolute -top-28 -right-28 h-60 w-60 rounded-full bg-[#F6D24A]/30 blur-2xl pointer-events-none" />

      <button
          title="Delete folder"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-4 right-4 z-20
                    h-9 w-9 rounded-full
                    bg-white/95 border border-black/10 shadow-sm
                    grid place-items-center
                    hover:bg-white transition
                    after:absolute after:-inset-2 after:content-['']"
        >
          ✕
        </button>
        <div
          onClick={onOpen}
          className="w-full text-left relative cursor-pointer"
        >

        <div className="flex items-center gap-5">
          <div
            className="h-16 w-16 sm:h-[76px] sm:w-[76px] rounded-2xl overflow-hidden
                       bg-white border border-black/10 shadow-sm shrink-0 grid place-items-center"
          >
            {child.photo ? (
              <img src={child.photo} alt={child.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl">🙂</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Child profile
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xl sm:text-2xl font-semibold truncate">
                    {child.name}
                  </span>

                  {(child.age || child.gender) && (
                    <span
                      className="rounded-full px-3 py-1 text-sm
                                bg-white/70 border border-black/10
                                text-gray-700"
                    >
                      {child.age ?? "-"} • {child.gender ?? "-"}
                    </span>
                  )}
                </div>

              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <div className="text-gray-600 text-sm">
                Open to upload drawings & view analysis
              </div>

              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2
                           bg-[#F6D24A]
                           shadow-[0_8px_0_rgba(0,0,0,0.12)]
                           hover:translate-y-0.5 hover:shadow-[0_6px_0_rgba(0,0,0,0.12)]
                           active:translate-y-1 active:shadow-[0_4px_0_rgba(0,0,0,0.12)]
                           transition font-semibold"
              >
                Open <span>→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function ChildForm({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setAge("");
      setGender("");
      setPhotoPreview("");
      setErr("");
    }
  }, [open]);

const canSubmit = name.trim() !== "";

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

 const submit = async (e) => {
  e.preventDefault();
  setErr("");

  if (!name.trim()) {
    setErr("Name is required.");
    return;
  }
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setErr("Not logged in.");
      return;
    }

    const res = await apiFetch(`/api/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        name: name.trim(),
        age: age ? Number(age) : null,
        gender: gender || null,
        photo: photoPreview || "",
      }),
    });


    const data = await res.json();
    if (!res.ok) {
      setErr(data.message || "Failed to save child.");
      return;
    }

    // IMPORTANT: use Firestore childId
    onCreate?.({
      id: data.childId,
      name: name.trim(),
      age,
      gender,
      photo: photoPreview || "",
    });

  } catch (err) {
    setErr("Server not reachable.");
  }
};

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition ${
        open ? "visible" : "invisible"
      }`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-xl rounded-[28px] bg-white/85 backdrop-blur-xl
                    border border-black/10 shadow-[0_24px_70px_rgba(0,0,0,0.25)]
                    transition-all ${open ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-2 w-full rounded-t-[28px] bg-[#F6D24A]" />

        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-5 top-5 h-10 w-10 rounded-full
                     bg-white/80 border border-black/10 shadow-sm
                     grid place-items-center hover:bg-white transition"
        >
          ✕
        </button>

        <div className="p-7 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#F6D24A]/70 grid place-items-center">
              <span className="text-2xl">👧</span>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Create child profile
              </h2>
              <p className="mt-1 text-gray-600">
                Add details to create a folder for drawings and reports.
              </p>
            </div>
          </div>

          {err && (
            <div className="mt-5 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {err}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Name">
                <input
                  type="text"
                  className="w-full rounded-2xl bg-white/90 border border-black/10
                             px-4 py-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#F6D24A]"
                  placeholder="Child name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field label="Age">
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-2xl bg-white/90 border border-black/10
                             px-4 py-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#F6D24A]"
                  placeholder="e.g. 7"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Gender">
              <select
                className="w-full rounded-2xl bg-white/90 border border-black/10
                           px-4 py-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#F6D24A]"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select…</option>
                <option>Boy</option>
                <option>Girl</option>
                <option>Prefer not to say</option>
              </select>
            </Field>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white/70 p-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Profile picture (optional)</div>
                <div className="text-sm text-gray-600">Helps you recognize the folder faster.</div>
              </div>

              <div className="flex items-center gap-3">
                <label className="cursor-pointer rounded-full bg-white px-4 py-2 border border-black/10 shadow-sm hover:bg-white/90 transition">
                  <span className="font-semibold">Choose</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </label>

                <div className="h-12 w-12 rounded-2xl overflow-hidden bg-white border border-black/10 grid place-items-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl text-gray-400">👤</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-2xl py-3.5 font-semibold text-lg
                         bg-[#F6D24A] disabled:opacity-60 disabled:cursor-not-allowed
                         shadow-[0_10px_0_rgba(0,0,0,0.12)]
                         hover:translate-y-0.5 hover:shadow-[0_8px_0_rgba(0,0,0,0.12)]
                         active:translate-y-1 active:shadow-[0_6px_0_rgba(0,0,0,0.12)]
                         transition"
            >
              Confirm
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl py-3.5 font-semibold text-gray-800
                         bg-white/80 border border-black/10 hover:bg-white transition"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-gray-800">{label}</div>
      {children}
    </label>
  );
}
