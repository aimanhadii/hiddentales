// src/pages/profile.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import bgImg from "../assets/background.jpeg";

export default function ProfilePage() {
  const navigate = useNavigate();

  // Basic local profile (no backend yet)
  const [username, setUsername] = useState("User");
  const [email, setEmail] = useState("user@email.com");

  const [editUsername, setEditUsername] = useState(false);
  const [editEmail, setEditEmail] = useState(false);

  const [draftUsername, setDraftUsername] = useState("");
  const [draftEmail, setDraftEmail] = useState("");

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  useEffect(() => {
    document.title = "HiddenTales – Profile";

    const savedName = (localStorage.getItem("username") || "").trim();
    const savedEmail = (localStorage.getItem("email") || "").trim();

    const finalName = savedName || "User";
    const finalEmail = savedEmail || "user@email.com";

    setUsername(finalName);
    setEmail(finalEmail);

    setDraftUsername(finalName);
    setDraftEmail(finalEmail);
  }, []);

  const initials = useMemo(() => {
    const parts = (username || "U").trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "U";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
  }, [username]);

  const pageFont = {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  };

  /* ---------- UI Bits (same aesthetic) ---------- */
  const GlassShell = ({ children, className = "" }) => (
    <div
      className={
        "rounded-[28px] bg-white/75 backdrop-blur-xl border border-black/5 " +
        "shadow-[0_18px_55px_rgba(0,0,0,0.09)] " +
        className
      }
    >
      {children}
    </div>
  );

  const PillBtn = ({ children, onClick, className = "", title }) => (
    <button
      onClick={onClick}
      title={title}
      className={
        "rounded-full px-6 py-3 font-semibold text-gray-900 " +
        "bg-gradient-to-b from-[#FFE89A] to-[#F4C847] " +
        "border border-black/10 shadow-[0_12px_28px_rgba(0,0,0,0.10)] " +
        "hover:brightness-[0.99] active:translate-y-[1px] transition " +
        className
      }
    >
      {children}
    </button>
  );

  const IconBtn = ({ onClick, title, children, className = "" }) => (
    <button
      onClick={onClick}
      title={title}
      className={
        "h-12 w-12 rounded-full bg-white/80 backdrop-blur border border-black/10 " +
        "shadow-[0_10px_25px_rgba(0,0,0,0.10)] grid place-items-center " +
        "hover:-translate-y-[1px] transition " +
        className
      }
    >
      {children}
    </button>
  );

  const SideItem = ({ icon, label, onClick, active = false, danger = false }) => (
    <button
      onClick={onClick}
      className={
        "w-full flex items-center gap-4 px-5 py-4 rounded-[22px] text-left border transition " +
        (danger
          ? "bg-white/75 border-black/10 hover:bg-red-50/80"
          : active
          ? "bg-black/5 border-black/10"
          : "bg-white/65 border-black/5 hover:bg-black/3")
      }
    >
      <div
        className={
          "h-11 w-11 rounded-[18px] grid place-items-center border shadow-sm " +
          (danger ? "bg-red-50 border-red-200" : "bg-white border-black/10")
        }
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className={"text-[18px] font-semibold " + (danger ? "text-red-700" : "text-slate-900")}>
          {label}
        </div>
        <div className="text-[13px] text-slate-500 mt-0.5">
          {danger ? "Sign out from this account" : "Open"}
        </div>
      </div>
    </button>
  );

  const Label = ({ children }) => (
    <div className="text-[13px] font-semibold text-slate-700 mb-2">{children}</div>
  );

  const Input = ({ value, onChange, placeholder, disabled, type = "text" }) => (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={
        "w-full rounded-full bg-white/90 px-5 py-3.5 border border-black/10 shadow-inner " +
        "focus:outline-none focus:ring-2 focus:ring-amber-400 " +
        (disabled ? "opacity-80" : "")
      }
    />
  );

  const SmallAction = ({ children, onClick }) => (
    <button
      onClick={onClick}
      className="rounded-full px-4 py-2 text-[13px] font-bold bg-[#57B7FF] text-black shadow hover:brightness-[0.98] active:translate-y-[1px] transition"
    >
      {children}
    </button>
  );

  /* ---------- Actions ---------- */
  const saveUsername = () => {
    const val = (draftUsername || "").trim();
    if (!val) return alert("Username cannot be empty.");
    setUsername(val);
    localStorage.setItem("username", val);
    setEditUsername(false);
  };

  const saveEmail = () => {
    const val = (draftEmail || "").trim();
    if (!val) return alert("Email cannot be empty.");
    if (!/^\S+@\S+\.\S+$/.test(val)) return alert("Please enter a valid email.");
    setEmail(val);
    localStorage.setItem("email", val);
    setEditEmail(false);
  };

  const changePassword = () => {
    if (!oldPw || !newPw || !confirmPw) return alert("Please fill all password fields.");
    if (newPw.length < 6) return alert("New password must be at least 6 characters.");
    if (newPw !== confirmPw) return alert("Confirm password does not match.");
    // No backend yet — placeholder
    setOldPw("");
    setNewPw("");
    setConfirmPw("");
    alert("Password change saved (demo). Connect this to your backend/Firebase later.");
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen text-slate-900 relative overflow-x-hidden" style={pageFont}>
      {/* Background (same as your other pages) */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-center bg-cover opacity-30"
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-white/55" />

      <div className="relative z-10">
        {/* Top bar (same “premium” header) */}
        <header className="sticky top-0 z-40">
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-4">
            <div className="rounded-[22px] bg-white/75 backdrop-blur-xl border border-black/5 shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
              <div className="px-5 sm:px-6 py-4 flex items-center justify-between">
                <div className="text-[26px] sm:text-[30px] font-semibold tracking-tight">
                  HiddenTales
                </div>

                <div className="flex items-center gap-3">
                  <PillBtn onClick={() => navigate("/welcome")}>Home</PillBtn>
                  <PillBtn onClick={() => navigate(-1)}>Back</PillBtn>

                  <IconBtn
                    title="You are here"
                    onClick={() => {}}
                    className="cursor-default"
                  >
                    <div className="h-9 w-9 rounded-full bg-black text-amber-200 grid place-items-center font-extrabold">
                      {initials}
                    </div>
                  </IconBtn>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-8 pb-12">
          <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] items-start">
            {/* Sidebar */}
            <GlassShell className="p-0 overflow-hidden">
              <div className="p-6 sm:p-7">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-black text-amber-200 grid place-items-center font-extrabold text-[18px] shadow">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[20px] font-extrabold tracking-tight truncate">
                      {username}
                    </div>
                    <div className="text-[13px] text-slate-600 truncate">{email}</div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <SideItem
                    active
                    label="Manage Account"
                    onClick={() => {}}
                    icon={
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                        <path
                          d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12Z"
                          stroke="black"
                          strokeWidth="2"
                        />
                        <path
                          d="M4.5 20c1.7-3.4 5-5 7.5-5s5.8 1.6 7.5 5"
                          stroke="black"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    }
                  />

                  <SideItem
                    label="Child Folder"
                    onClick={() => navigate("/folders")}
                    icon={
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                        <path
                          d="M4 19V8a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
                          stroke="black"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    }
                  />

                  <SideItem
  label="Contact Us"
  onClick={() => alert("To contact the HiddenTales team, please use the links in the project README.")}
  icon={
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path
        d="M4 6h16v12H4V6Z"
        stroke="black"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m4 7 8 6 8-6"
        stroke="black"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  }
  className="w-full flex items-center gap-4 px-5 py-4 rounded-[22px] text-left border transition 
  bg-white/75 backdrop-blur-xl border-black/10 shadow-[0_12px_28px_rgba(0,0,0,0.10)] 
  hover:bg-white/80 hover:brightness-[0.95] active:translate-y-[1px] transition-all"
/>



                  <SideItem
                    danger
                    label="Log Out"
                    onClick={logout}
                    icon={
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                        <path
                          d="M10 7V6a2 2 0 0 1 2-2h7v16h-7a2 2 0 0 1-2-2v-1"
                          stroke="black"
                          strokeWidth="2"
                        />
                        <path
                          d="M4 12h9"
                          stroke="black"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="m7 9-3 3 3 3"
                          stroke="black"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    }
                  />
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => navigate("/welcome")}
                    className="w-full rounded-[22px] bg-amber-100/60 border border-black/5 p-4 text-left hover:bg-amber-100/80 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-[18px] bg-white border border-black/10 grid place-items-center shadow-sm">
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                          <path
                            d="M4 11.5 12 4l8 7.5V20H4v-8.5Z"
                            stroke="black"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[18px] font-semibold">Homepage</div>
                        <div className="text-[13px] text-slate-600">Back to Welcome</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </GlassShell>

            {/* Main card */}
            <GlassShell className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[28px] sm:text-[32px] font-extrabold tracking-tight">
                    Manage Account
                  </div>
                  <div className="mt-2 text-[14px] text-slate-600">
                    Keep your details updated. (Demo UI — connect to backend later)
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-black text-amber-200 grid place-items-center font-extrabold">
                    {initials}
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-6">
                {/* Username */}
                <div>
                  <Label>Username</Label>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <Input
                        value={draftUsername}
                        onChange={(e) => setDraftUsername(e.target.value)}
                        placeholder="Enter username"
                        disabled={!editUsername}
                      />
                    </div>

                    {!editUsername ? (
                      <SmallAction onClick={() => setEditUsername(true)}>Change</SmallAction>
                    ) : (
                      <div className="flex gap-2">
                        <SmallAction onClick={saveUsername}>Save</SmallAction>
                        <button
                          onClick={() => {
                            setDraftUsername(username);
                            setEditUsername(false);
                          }}
                          className="rounded-full px-4 py-2 text-[13px] font-bold bg-black/10 text-black shadow hover:bg-black/15 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label>Email</Label>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <Input
                        value={draftEmail}
                        onChange={(e) => setDraftEmail(e.target.value)}
                        placeholder="Enter email"
                        disabled={!editEmail}
                        type="email"
                      />
                    </div>

                    {!editEmail ? (
                      <SmallAction onClick={() => setEditEmail(true)}>Change</SmallAction>
                    ) : (
                      <div className="flex gap-2">
                        <SmallAction onClick={saveEmail}>Save</SmallAction>
                        <button
                          onClick={() => {
                            setDraftEmail(email);
                            setEditEmail(false);
                          }}
                          className="rounded-full px-4 py-2 text-[13px] font-bold bg-black/10 text-black shadow hover:bg-black/15 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-[1px] bg-black/5" />

                {/* Reset password */}
                <div>
                  <div className="text-[18px] font-extrabold tracking-tight text-slate-900">
                    Reset Password
                  </div>
                  <div className="mt-1 text-[13px] text-slate-600">
                    Demo only. Later connect to Firebase/Auth.
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label>Old Password</Label>
                      <Input
                        value={oldPw}
                        onChange={(e) => setOldPw(e.target.value)}
                        placeholder="••••••••"
                        type="password"
                      />
                    </div>

                    <div>
                      <Label>New Password</Label>
                      <Input
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="••••••••"
                        type="password"
                      />
                    </div>

                    <div>
                      <Label>Confirm New Password</Label>
                      <Input
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="••••••••"
                        type="password"
                      />
                    </div>

                    <div className="sm:col-span-2 flex gap-3 flex-wrap pt-2">
                      <PillBtn onClick={changePassword} className="px-7 py-3 text-[16px]">
                        Change Password
                      </PillBtn>

                      <button
                        onClick={() => {
                          setOldPw("");
                          setNewPw("");
                          setConfirmPw("");
                        }}
                        className="rounded-full px-7 py-3 text-[16px] font-semibold bg-white/70 border border-black/10 shadow hover:bg-white/85 transition"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="mt-2 rounded-[26px] bg-amber-100/55 border border-black/5 p-6">
                  <div className="text-[16px] font-extrabold tracking-tight">Quick Actions</div>
                  <div className="mt-4 flex gap-3 flex-wrap">
                    <PillBtn onClick={() => navigate("/folders")} className="px-6 py-3 text-[16px]">
                      Go to Child Folder
                    </PillBtn>
                    <button
                      onClick={logout}
                      className="rounded-full px-6 py-3 text-[16px] font-semibold bg-white/70 border border-red-200 text-red-700 shadow hover:bg-red-50/80 transition"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              </div>
            </GlassShell>
          </div>
        </main>
      </div>
    </div>
  );
}
