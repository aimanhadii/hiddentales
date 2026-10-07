// src/pages/dashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { CloudUpload, Download, Share2, Trash2, Pencil, Search, LogOut } from "lucide-react";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const API_BASE = "http://localhost:5000";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [emotionResult, setEmotionResult] = useState(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [username, setUsername] = useState(null);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (!storedUser) navigate("/login");
    else {
      setUsername(storedUser);
      const userHistory = localStorage.getItem(`emotionHistory_${storedUser}`);
      setHistory(userHistory ? JSON.parse(userHistory) : []);
    }
  }, [navigate]);

  useEffect(() => {
    if (username) {
      localStorage.setItem(`emotionHistory_${username}`, JSON.stringify(history));
    }
  }, [history, username]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("username");
      alert("Logged out successfully");
      navigate("/login");
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark", !isDarkMode);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // local preview
    const localPreview = URL.createObjectURL(file);
    setSelectedImage(localPreview);

    const formData = new FormData();
    formData.append("drawing", file);

    try {
      setIsAnalyzed(false);
      const res = await fetch(`${API_BASE}/api/predict`, { method: "POST", body: formData });

      let data, raw;
      try {
        data = await res.json();
      } catch {
        raw = await res.text();
      }
      if (!res.ok || !data?.success) {
        alert(data?.message || raw || "Prediction failed");
        return;
      }

      const newResult = {
      emotion: data.emotion,
      probabilities: data.probabilities,
      description: data.description,
      serverImageUrl: data.image_url, // ✅ use the full URL from backend
      scene: data.scene,
      date: new Date().toISOString(),
    };

      setEmotionResult(newResult);
      setHistory((prev) => [newResult, ...prev]);
      setIsAnalyzed(true);
    } catch (err) {
      alert("Network error: " + err.message);
      console.error(err);
    }
  };

  const handleHistoryClick = (item) => {
    setEmotionResult(item);
    setSelectedImage(item.serverImageUrl || selectedImage);
    setIsAnalyzed(true);
    document.getElementById("analysis-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteItem = (index) => {
    const updated = [...history];
    updated.splice(index, 1);
    setHistory(updated);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all history?")) setHistory([]);
  };

  const filteredHistory = history.filter(
    (item) =>
      item.emotion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(item.date).toLocaleString().toLowerCase().includes(searchTerm.toLowerCase())
  );
  const visibleHistory = filteredHistory.slice(0, visibleCount);
  const loadMore = () => setVisibleCount((prev) => prev + 6);

  const chartData =
    emotionResult &&
    emotionResult.probabilities && {
      labels: Object.keys(emotionResult.probabilities),
      datasets: [
        {
          label: "Emotion %",
          data: Object.values(emotionResult.probabilities),
          backgroundColor: isDarkMode
            ? ["#f87171", "#facc15", "#60a5fa", "#c084fc"]
            : ["#d97706", "#4b5563", "#2563eb", "#9333ea"],
          borderRadius: 8,
        },
      ],
    };

  const chartOptions = {
    indexAxis: "y",
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: { color: isDarkMode ? "#E0E7FF" : "#4B0082" },
        grid: { color: isDarkMode ? "#4C1D95" : "#E5E7EB" },
      },
      y: {
        ticks: { color: isDarkMode ? "#E0E7FF" : "#4B0082" },
        grid: { color: isDarkMode ? "#4C1D95" : "#E5E7EB" },
      },
    },
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
  };

  const parentTips = {
    happy:
      "Celebrate your child's positive feelings by encouraging more creative expression. Ask them to share the story behind their drawing.",
    sad: "Offer comfort and a safe space to talk. Gently ask questions like 'Tell me about this part' to help them open up.",
    fear: "Support your child by reassuring them they are safe. Explore together what might be causing worry in the drawing.",
    angry:
      "Help your child label their emotions. You might say, 'It looks like something upset you. Want to talk about it?'",
  };
  const emotionEmojis = { happy: "😊", sad: "😢", fear: "😨", angry: "😠" };

  return (
    <div className={`min-h-screen font-[Inter] px-8 py-6 ${isDarkMode ? "bg-indigo-950 text-indigo-50" : "bg-white text-gray-800"}`}>
      <div className="flex justify-between items-center mb-6 border-b pb-4 border-purple-200 dark:border-purple-800">
        <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-300 flex items-center gap-2">
          <span className="text-4xl">🎨</span> Hidden Tales
        </h1>
        <div className="flex gap-4">
          <button
            onClick={toggleDarkMode}
            className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 ${
              isDarkMode ? "bg-purple-800 text-yellow-200" : "bg-purple-100 text-purple-800"
            }`}
          >
            {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center text-sm px-3 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 gap-1 dark:bg-red-900/50 dark:text-red-200"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-purple-800/80 p-4 rounded-3xl shadow-lg border border-gray-200 dark:border-purple-700/50">
            <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-100 mb-3 flex items-center gap-2">
              <span className="text-xl">🖼️</span> My Gallery
            </h2>
            <ul className="space-y-2">
              {history.slice(0, 3).map((item, index) => (
                <li
                  key={index}
                  className="text-gray-700 dark:text-purple-100 text-sm bg-gray-50 dark:bg-purple-900/50 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-purple-700/50 cursor-pointer"
                  onClick={() => handleHistoryClick(item)}
                >
                  <span className="text-lg">{emotionEmojis[item.emotion]}</span>
                  <span className="capitalize">{item.emotion}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-300 ml-auto">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </li>
              ))}
              {history.length === 0 && (
                <li className="text-sm text-gray-500 dark:text-gray-400 italic">No drawings yet</li>
              )}
            </ul>
          </div>

          <div className="bg-white dark:bg-purple-800/80 p-4 rounded-3xl shadow-lg border border-gray-200 dark:border-purple-700/50">
            <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-100 mb-3 flex items-center gap-2">
              <span className="text-xl">📤</span> Upload New
            </h2>
            <label
              htmlFor="upload-file"
              className={`border-2 border-dashed ${
                isDarkMode ? "border-purple-500 hover:bg-purple-900/30" : "border-purple-300 hover:bg-purple-50"
              } rounded-2xl flex flex-col items-center justify-center py-8 cursor-pointer transition-colors`}
            >
              <CloudUpload className={`w-10 h-10 ${isDarkMode ? "text-purple-300" : "text-purple-500"} mb-2`} />
              <span className="text-sm text-gray-500 dark:text-gray-300">Drag & drop or click to upload</span>
              <span className="text-sm font-semibold mt-1 text-purple-700 dark:text-purple-300">Select File</span>
              <input id="upload-file" type="file" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div id="analysis-section" className="md:col-span-3 bg-white dark:bg-purple-800/80 p-6 rounded-3xl shadow-lg border border-gray-200 dark:border-purple-700/50">
          {selectedImage && isAnalyzed && emotionResult ? (
            <>
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-purple-700 dark:text-purple-100 flex items-center gap-2">
                  <span className="text-2xl">🔍</span> Drawing Analysis
                </h2>
                <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1 dark:bg-green-900/50 dark:text-green-200">
                  <span className="text-sm">✓</span> Analyzed
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="relative">
                  <img
                    src={emotionResult.serverImageUrl || selectedImage}
                    alt="Uploaded"
                    className="w-full sm:w-64 h-48 rounded-2xl object-cover border-2 border-purple-200 dark:border-purple-700 shadow"
                  />
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-purple-700 px-4 py-1 rounded-full border border-purple-200 dark:border-purple-600 shadow-sm">
                    <span className="text-lg">{emotionEmojis[emotionResult.emotion]}</span>
                    <span className="ml-2 font-medium capitalize">{emotionResult.emotion}</span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="mt-2 bg-purple-50/60 dark:bg-purple-900/30 p-3 rounded-xl">
                    <div className="text-sm font-semibold text-purple-700 dark:text-purple-200 mb-1">Description</div>
                    <p className="text-sm leading-6 text-gray-800 dark:text-gray-100">{emotionResult.description}</p>
                    {emotionResult.scene && (
                      <div className="mt-2 text-xs opacity-80">
                        <strong>Scene facts:</strong> caption = “{emotionResult.scene.caption}”, colors ={" "}
                        {(emotionResult.scene.colors || []).join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-3 sm:mt-4">
                    <a
                      href={emotionResult.serverImageUrl || selectedImage}
                      download
                      className="bg-purple-100 hover:bg-purple-200 dark:bg-purple-700 dark:hover:bg-purple-600 px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors"
                    >
                      <Download size={16} /> Download
                    </a>
                    <button className="bg-purple-100 hover:bg-purple-200 dark:bg-purple-700 dark:hover:bg-purple-600 px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors">
                      <Share2 size={16} /> Share
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-100 mb-3 flex items-center gap-2">
                  <span className="text-xl">📊</span> Emotion Analysis
                </h3>
                <div className="w-full h-48 bg-gray-50 dark:bg-purple-900/30 p-4 rounded-2xl">
                  {chartData && <Bar data={chartData} options={chartOptions} />}
                </div>
              </div>

              <div className="mt-6 bg-amber-100/70 dark:bg-amber-900/30 border-l-4 border-amber-400 dark:border-amber-600 p-4 rounded-2xl">
                <h4 className="text-md font-semibold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-2">
                  <span className="text-lg">👪</span> Parent Tip
                </h4>
                <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
                  {(
                    {
                      happy:
                        "Celebrate your child's positive feelings by encouraging more creative expression. Ask them to share the story behind their drawing.",
                      sad:
                        "Offer comfort and a safe space to talk. Gently ask questions like 'Tell me about this part' to help them open up.",
                      fear:
                        "Support your child by reassuring them they are safe. Explore together what might be causing worry in the drawing.",
                      angry:
                        "Help your child label their emotions. You might say, 'It looks like something upset you. Want to talk about it?'",
                    }[emotionResult.emotion?.toLowerCase()?.trim()] || "No tip available."
                  )}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">🎨</div>
              <p className="text-gray-500 dark:text-gray-400 italic">
                Upload a drawing to see the magic of emotion analysis!
              </p>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-100 flex items-center gap-2">
              <span className="text-xl">📅</span> Emotion History
            </h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                <input
                  type="text"
                  placeholder="Search emotion or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 pl-10 text-sm bg-white dark:bg-purple-900/50 text-gray-800 dark:text-gray-200 w-full"
                />
              </div>
              <button
                onClick={handleClearAll}
                className="text-sm px-3 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleHistory.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-purple-800/80 rounded-2xl shadow p-4 border border-gray-200 dark:border-purple-700/50 hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  <img
                    src={item.serverImageUrl || item.imageUrl}
                    alt={`History ${index}`}
                    className="w-full h-32 object-cover rounded-xl cursor-pointer border border-purple-200 dark:border-purple-700"
                    onClick={() => handleHistoryClick(item)}
                  />
                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-purple-900/90 px-2 py-1 rounded-full text-xs">
                    {({ happy: "😊", sad: "😢", fear: "😨", angry: "😠" }[item.emotion])} {item.emotion}
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <span>📅</span> {new Date(item.date).toLocaleString()}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    className="flex-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-700 dark:hover:bg-purple-600 px-3 py-1 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors"
                    onClick={() => handleHistoryClick(item)}
                  >
                    <Pencil size={12} /> View Details
                  </button>
                  <button
                    className="bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-800/50 px-3 py-1 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors"
                    onClick={() => handleDeleteItem(index)}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {visibleHistory.length < filteredHistory.length && (
            <div className="mt-8 text-center">
              <button onClick={loadMore} className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-md">
                Load More Drawings
              </button>
            </div>
          )}
        </div>
      )}

      <footer className="mt-12 border-t border-gray-200 dark:border-purple-800 pt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
        <p className="flex items-center justify-center gap-2">
          <span className="text-purple-600 dark:text-purple-400">Hidden Tales</span> — Helping parents understand
          children's emotions through art
        </p>
        <div className="mt-2 text-xs">© {new Date().getFullYear()} Hidden Tales. All rights reserved.</div>
      </footer>
    </div>
  );
}
