// src/pages/home.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import heroImg from "../assets/Screenshot 2025-10-16 223834.png";
import bgImg from "../assets/background.jpeg";
import { apiFetch } from "../config/api";
/* ============================================================
   HOME PAGE
============================================================ */
export default function HomePage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("login"); // login | signup | success

  useEffect(() => {
    document.title = "HiddenTales – Discover Your Child Emotion";
  }, []);

  // ESC to close modal
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setShowModal(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // lock scroll when modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (showModal) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [showModal]);

  const openLogin = () => {
    setMode("login");
    setShowModal(true);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden text-slate-900">
      {/* Background */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      <div className="absolute inset-0 -z-10 bg-white/60" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="text-[32px] font-extrabold tracking-tight">
            HiddenTales
          </div>

          <button
            onClick={openLogin}
            className="rounded-full px-7 py-3 font-semibold
                       bg-gradient-to-b from-amber-200 to-amber-300
                       shadow-[0_10px_0_#eab308]
                       active:translate-y-[2px]"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* HERO */}
      <main className="h-full">
        <div className="mx-auto flex h-full max-w-7xl items-center px-6 pt-20">
          <div className="w-full rounded-[28px] bg-white/70 backdrop-blur
                          shadow-[0_30px_80px_rgba(0,0,0,0.12)]">
            <div className="grid gap-12 px-10 py-12 lg:grid-cols-2">
              {/* Text */}
              <div>
                <h1 className="text-5xl font-extrabold leading-tight">
                  Discover Your Child’s Emotions
                </h1>
                <p className="mt-4 text-lg text-slate-600">
                  Upload your child’s artwork and let AI analyze their emotions.
                </p>

                <button
                  onClick={openLogin}
                  className="mt-8 rounded-full px-7 py-3 font-semibold
                             bg-gradient-to-b from-amber-200 to-amber-300
                             shadow-[0_10px_0_#eab308]"
                >
                  Get Started
                </button>
              </div>

              {/* Image */}
              <div className="flex justify-center">
                <img
                  src={heroImg}
                  alt="Emotions"
                  className="max-h-[52vh] object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-[26px]
                       bg-amber-300 p-8 shadow-xl"
          >
            {mode !== "success" && (
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-4 top-4 text-xl font-bold"
              >
                ✕
              </button>
            )}

            <h2 className="mb-6 text-3xl font-extrabold">
              {mode === "login" && "Log In"}
              {mode === "signup" && "Sign Up"}
            </h2>

            {mode === "login" && (
              <LoginForm
                onSuccess={() => setMode("success")}
                onGoSignup={() => setMode("signup")}
              />
            )}

            {mode === "signup" && (
              <SignupForm
                onSuccess={() => setMode("login")}
                onGoLogin={() => setMode("login")}
              />
            )}

            {mode === "success" && (
              <SuccessPanel
                onContinue={() => {
                  setShowModal(false);
                  navigate("/welcome");
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   LOGIN FORM
============================================================ */
function LoginForm({ onSuccess, onGoSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!email || !password) {
      setErr("Please fill in both fields.");
      return;
    }

    try {
      const res = await apiFetch(`/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Login failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("userId", data.userId); // 🔥 ADD THIS LINE


      onSuccess();
    } catch {
      setErr("Server not reachable.");
    }
  };

  return (
    <>
      {err && <div className="mb-3 text-red-700">{err}</div>}

      <form onSubmit={submit} className="space-y-4">
        <input
          placeholder="Email"
          className="w-full rounded-xl px-4 py-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-xl px-4 py-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full rounded-full bg-black py-3 text-amber-200">
          Log In
        </button>
      </form>

      <div className="mt-4 text-center">
        Don’t have an account?{" "}
        <button onClick={onGoSignup} className="font-semibold underline">
          Sign Up
        </button>
      </div>
    </>
  );
}

/* ============================================================
   SIGNUP FORM
============================================================ */
function SignupForm({ onSuccess, onGoLogin }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!email || !username || !password || !confirm) {
      setErr("All fields are required.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    try {
     const res = await apiFetch(`/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });


      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Signup failed.");
        return;
      }

      onSuccess();
    } catch {
      setErr("Server not reachable.");
    }
  };

  return (
    <>
      {err && <div className="mb-3 text-red-700">{err}</div>}

      <form onSubmit={submit} className="space-y-4">
        <input
          placeholder="Email"
          className="w-full rounded-xl px-4 py-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Username"
          className="w-full rounded-xl px-4 py-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-xl px-4 py-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full rounded-xl px-4 py-3"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button className="w-full rounded-full bg-black py-3 text-amber-200">
          Sign Up
        </button>
      </form>

      <div className="mt-4 text-center">
        Already have an account?{" "}
        <button onClick={onGoLogin} className="font-semibold underline">
          Log In
        </button>
      </div>
    </>
  );
}

/* ============================================================
   SUCCESS PANEL
============================================================ */
function SuccessPanel({ onContinue }) {
  return (
    <div className="text-center">
      <h3 className="mb-6 text-3xl font-extrabold">Login Successful</h3>
      <button
        onClick={onContinue}
        className="rounded-full bg-black px-8 py-3 text-amber-200"
      >
        Continue
      </button>
    </div>
  );
}
