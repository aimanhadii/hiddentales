import React from "react";
import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/home";
import WelcomePage from "./pages/welcome";
import FoldersPage from "./pages/folders";
import UploadPage from "./pages/upload";
import ParentingPage from "./pages/parenting";
import ProfilePage from "./pages/profile";
import PsychologistPage from "./pages/psychologist";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />        {/* ✅ homepage */}
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/folders" element={<FoldersPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/parenting" element={<ParentingPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/psychologist" element={<PsychologistPage />} />

      {/* safety */}
      <Route path="*" element={<div>Page not found</div>} />
    </Routes>
  );
}
