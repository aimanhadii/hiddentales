// src/pages/welcome.js

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import bgImg from "../assets/background.jpeg";
import logoImg from "../assets/logo.jpeg";
import { apiFetch } from "../config/api";




/**
 * Premium Aesthetic Notes (Tailwind-only, no extra libs):
 * - Soft doodle background (your bgImg) + white wash
 * - Glass cards: bg-white/75 + backdrop-blur + subtle border + soft shadow
 * - Accent: warm amber pills for buttons
 * - Consistent max width + spacing so it feels "designed"
 */
const API_BASE_URL =
  (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");

function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("/uploads/")) return `${API_BASE_URL}${url}`;
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    const fname = url.split("/uploads/").pop();
    return `${API_BASE_URL}/uploads/${fname}`;
  }
  return url;
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("there");
  const [feedback, setFeedback] = useState("");
  const [emotionTag, setEmotionTag] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [carouselDrawings, setCarouselDrawings] = useState([]);
  const [emotionOfWeek, setEmotionOfWeek] = useState(null);
  const [parentFeedbacks, setParentFeedbacks] = useState([]);




  useEffect(() => {
    document.title = "HiddenTales – Welcome";
    const saved = (localStorage.getItem("username") || "").trim();
    if (saved) setName(saved);
  }, []);
  useEffect(() => {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

apiFetch(`/api/welcome/drawings?userId=${userId}`)
  .then((res) => res.json())
  .then((data) => {
    if (data.success) {
      setCarouselDrawings(data.drawings || []);
    }
  });

}, []);


// 🔹 Emotion of the Week fetch
useEffect(() => {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  apiFetch(`/api/welcome/emotion-of-week?userId=${userId}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        setEmotionOfWeek(data.data);
      }
    })
    .catch(() => setEmotionOfWeek(null));
}, []);

useEffect(() => {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

 apiFetch(`/api/parent-feedback?userId=${userId}`)
  .then((res) => res.json())
  .then((data) => {
    if (data.success) {
      setParentFeedbacks(data.results);
    }
  })
  .catch((err) => console.error("Failed to load feedback", err));
}, []);

  // 🔹 Submit parent feedback
  const submitFeedback = async () => {
  const userId = localStorage.getItem("userId");
  if (!userId || !feedback.trim()) return;

  setSubmitting(true);

  try {
    await apiFetch(`/api/parent-feedback`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId, message: feedback, emotion: emotionTag }),
});


    // ✅ ADD THIS BLOCK (LIVE UI UPDATE)
    setParentFeedbacks((prev) => [
      {
        id: Date.now(),          // temporary ID for React key
        message: feedback,
        emotion: emotionTag,
      },
      ...prev,
    ]);

    // ✅ then clear input
    setFeedback("");
    setEmotionTag("general");

  } catch (err) {
    console.error("Failed to submit feedback", err);
  }

  setSubmitting(false);
};



  return (
    <div className="min-h-screen text-gray-900 relative overflow-x-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-center bg-cover opacity-30"
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-white/55" />

      <div className="relative z-10">
        {/* Top bar */}
        <header className="sticky top-0 z-40">
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-4">
            <div className="rounded-[22px] bg-white/75 backdrop-blur-xl border border-black/5 shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
              <div className="px-5 sm:px-6 py-4 flex items-center justify-between">
                <div className="text-[26px] sm:text-[30px] font-semibold tracking-tight">
                  HiddenTales
                </div>

                {/* ✅ Profile Icon matches Profile page (initials circle) */}
                <div className="flex items-center gap-3">
                  <ProfileIconButton onClick={() => navigate("/profile")} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 pt-6 pb-4">
          <div className="rounded-[28px] bg-white/70 backdrop-blur-xl border border-black/5 shadow-[0_18px_55px_rgba(0,0,0,0.09)] overflow-hidden">
        <div className="px-6 sm:px-10 py-10 sm:py-12 text-center">

  {/* Welcome text FIRST */}
  <h1 className="text-[34px] sm:text-[44px] md:text-[52px] leading-[1.08] font-semibold tracking-tight text-gray-900">
    Welcome , <span className="font-bold">{name}</span>
  </h1>

  {/* Logo BIGGER than welcome */}
  <img
    src={logoImg}
    alt="HiddenTales Logo"
    className="
      mx-auto mt-6 mb-6
      h-44 sm:h-52 md:h-56
      object-contain
      drop-shadow-sm
    "
  />

  {/* Quote */}
  <p className="mt-2 text-[16px] sm:text-[18px] text-gray-600">
    “Every drawing tells a story. Every feeling makes a memory.”
  </p>

  {/* Feature cards */}
  <div className="mt-10 grid gap-5 md:grid-cols-2">
    <FeatureCard
      title="Emotion Detection"
      subtitle="View folders, analyze emotions, and track trends."
      icon="🙂"
      onClick={() => navigate("/folders")}
    />

    <FeatureCard
      title="Psychologist Consultation"
      subtitle="Connect with professionals for guidance and support."
      icon="🩺"
      onClick={() => navigate("/psychologist")}
    />
  </div>
            </div>
          </div>
        </section>

        {/* Drawing Carousel */}
        <section className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-6">
          <div className="rounded-[28px] bg-amber-100/55 border border-black/5 shadow-[0_14px_40px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="px-6 sm:px-10 py-8">
              <h2 className="text-center text-[26px] sm:text-[30px] font-semibold tracking-tight">
                Drawing Carousel
              </h2>
              <div className="mt-6 flex gap-5 overflow-x-auto pb-3 pr-1 snap-x snap-mandatory">
  {carouselDrawings.length === 0 && (
    <div className="text-gray-500">
      No drawings uploaded yet.
    </div>
  )}

  {carouselDrawings.map((d) => (
    <div
      key={d.id}
      className="snap-start min-w-[280px] sm:min-w-[360px] h-[190px]
                 rounded-[26px] bg-white/80 backdrop-blur
                 border border-black/5
                 shadow-[0_12px_30px_rgba(0,0,0,0.08)]
                 overflow-hidden"
    >
     <img
      src={resolveImageUrl(d.imageUrl)}

      alt="child drawing"
      loading="lazy"
      className="w-full h-full object-cover bg-white
                transition-opacity duration-500 opacity-0"
      onLoad={(e) => (e.currentTarget.style.opacity = 1)}
      onError={(e) => {
        e.currentTarget.style.opacity = 1;
        e.currentTarget.src = "/placeholder.png"; // optional
      }}
    />
    </div>
  ))}
</div>

            </div>
          </div>
        </section>

        {/* Emotion of the Week */}
        <section className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-6">
          <div className="rounded-[28px] bg-white/70 backdrop-blur-xl border border-black/5 shadow-[0_18px_55px_rgba(0,0,0,0.09)] overflow-hidden">
            <div className="px-6 sm:px-10 py-10">
              <h2 className="text-center text-[26px] sm:text-[30px] font-semibold tracking-tight">
                Emotion of the Week
              </h2>

              <div className="mt-8 grid md:grid-cols-2 gap-6 items-stretch">
               <GlassCard className="h-[260px] overflow-hidden">
  {emotionOfWeek ? (
    <img
      src={resolveImageUrl(emotionOfWeek.imageUrl)}
      alt="Emotion of the week"
      className="w-full h-full object-contain bg-white"
      loading="lazy"
    />
  ) : (
    <div className="h-full grid place-items-center text-gray-400">
      No data yet
    </div>
  )}
</GlassCard>


                <GlassCard>
  {emotionOfWeek ? (
    <>
      <div className="inline-flex items-center gap-2 mb-3">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="font-semibold text-gray-900 capitalize">
          {emotionOfWeek.emotion}
        </span>
      </div>

      <p className="text-[16px] sm:text-[18px] leading-8 text-gray-700">
        {emotionOfWeek.report}
      </p>
    </>
  ) : (
    <p className="text-gray-400">No insight available.</p>
  )}
</GlassCard>

              </div>
            </div>
          </div>
        </section>

        {/* Parent’s Corner */}
        <section className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-6 pb-12">
          <div className="rounded-[28px] bg-white/70 backdrop-blur-xl border border-black/5 shadow-[0_18px_55px_rgba(0,0,0,0.09)] overflow-hidden">
            <div className="px-6 sm:px-10 py-10">
              <h2 className="text-center text-[26px] sm:text-[30px] font-semibold tracking-tight">
                Parent’s Corner
              </h2>

              <div className="mt-8 grid md:grid-cols-2 gap-6 items-stretch">
             <GlassCard className="flex flex-col">
  <p className="text-[18px] sm:text-[20px] font-semibold text-gray-900">
    Anything you want to say?
  </p>

  <form
    className="mt-4"
    onSubmit={(e) => {
      e.preventDefault();
      submitFeedback();
    }}
  >
    <input
      type="text"
      value={feedback}
      onChange={(e) => setFeedback(e.target.value)}
      placeholder="Write here…"
      className="w-full rounded-full bg-white/90 px-5 py-3.5
                 border border-black/10 shadow-inner
                 focus:outline-none focus:ring-2 focus:ring-amber-400"
    />

    <div className="mt-4 flex gap-3 items-center flex-wrap">
      <select
        value={emotionTag}
        onChange={(e) => setEmotionTag(e.target.value)}
        className="rounded-full px-4 py-2 bg-white border border-black/10 text-sm"
      >
        <option value="general">General</option>
        <option value="happy">Happy</option>
        <option value="sad">Sad</option>
        <option value="angry">Angry</option>
        <option value="fear">Fear</option>
      </select>

      <button
        type="submit"
        disabled={submitting}
        className="ml-auto rounded-full bg-amber-400 px-6 py-2
                   font-semibold text-black
                   hover:bg-amber-500 transition
                   disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Save Reflection"}
      </button>
    </div>
  </form>

  <p className="mt-2 text-sm text-gray-600">
    Tip: write a small reflection after each upload.
  </p>
</GlassCard>


                <GlassCard className="grid place-items-center text-gray-500">
                  (parent illustration)
                </GlassCard>
              </div>

              {/* Tips */}
              <div className="mt-10 grid md:grid-cols-3 gap-6">
               {parentFeedbacks.length === 0 && (
                  <p className="text-gray-400 text-sm">No reflections yet.</p>
                )}

                {parentFeedbacks.map((f) => (
                  <TipCard
                    key={f.id}
                    text={f.message}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- UI Bits ---------- */

/* ✅ UPDATED: Profile icon same style as Profile page (initials) */
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
      className="
        h-12 w-12 rounded-full
        bg-white/85 backdrop-blur border border-black/10
        shadow-[0_10px_24px_rgba(0,0,0,0.10)]
        grid place-items-center
        hover:scale-[1.03] active:scale-[0.98] transition
      "
      aria-label="Open profile"
      title="Profile"
      type="button"
    >
      <div className="h-9 w-9 rounded-full bg-black text-amber-200 grid place-items-center font-extrabold text-[13px]">
        {initials}
      </div>
    </button>
  );
}

function GlassCard({ className = "", children }) {
  return (
    <div
      className={`rounded-[26px] bg-white/75 backdrop-blur-xl border border-black/5
                  shadow-[0_12px_30px_rgba(0,0,0,0.08)] p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function FeatureCard({ title, subtitle, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-[26px] bg-white/75 backdrop-blur-xl border border-black/5
                 shadow-[0_12px_30px_rgba(0,0,0,0.08)] p-6
                 hover:-translate-y-0.5 transition"
    >
      <div className="flex items-center gap-4">
        <div className="text-4xl">{icon}</div>

        <div className="min-w-0">
          <div className="text-[20px] sm:text-[22px] font-semibold text-gray-900">
            {title}
          </div>
          <div className="mt-1 text-sm sm:text-[15px] text-gray-600">{subtitle}</div>
        </div>

        <div className="ml-auto">
          <div
            className="h-12 w-12 rounded-full bg-gray-900 grid place-items-center
                       group-hover:scale-105 transition"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
              <path d="M7 12h10" stroke="#FDE68A" strokeWidth="2.8" strokeLinecap="round" />
              <path
                d="M13 8l4 4-4 4"
                stroke="#FDE68A"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
}

function TipCard({ text }) {
  return (
    <div className="rounded-[26px] bg-white/75 backdrop-blur-xl border border-black/5 shadow-[0_12px_30px_rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <div className="font-semibold text-gray-900">Anonymous</div>
      </div>

      <div className="mt-3 text-gray-700 leading-7">
        <span className="text-2xl mr-1 align-top">“</span>
        {text}
        <span className="text-2xl ml-1 align-top">”</span>
      </div>
    </div>
  );
}
