// src/pages/psychologist.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import bgImg from "../assets/background.jpeg";

export default function PsychologistPage() {
  const navigate = useNavigate();

  const supports = [
    {
      id: 1,
      name: "Talian Kasih",
      description:
        "24/7 Malaysian government helpline for emotional distress, family and child support.",
      actionType: "call",
      actionLabel: "Call 15999",
      actionValue: "tel:15999",
      icon: "📞",
    },
    {
      id: 2,
      name: "Buddy Bear Childline",
      description:
        "Child-friendly emotional support service for children and adolescents.",
      actionType: "call",
      actionLabel: "Call Childline 15999",
      actionValue: "tel:15999",
      icon: "🧸",
    },
    {
      id: 3,
      name: "Befrienders",
      description:
        "Emotional support and suicide prevention for individuals in distress.",
      actionType: "call",
      actionLabel: "Call 03-7627 2929",
      actionValue: "tel:0376272929",
      icon: "💬",
    },
    {
      id: 4,
      name: "Selangor Mental Health Association (SMHA)",
      description:
        "Provides professional counselling, therapy, and mental health education.",
      actionType: "link",
      actionLabel: "Visit Website",
      actionValue: "https://www.smha.org.my",
      icon: "🧠",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-center bg-cover opacity-30"
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-white/55" />
      <div className="fixed inset-0 z-0 pointer-events-none bg-black/25" />

      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-xl w-full max-w-4xl rounded-[36px] p-8 sm:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.25)] relative"
        >
          {/* Close */}
          <button
            onClick={() => navigate("/welcome")}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-amber-300 flex items-center justify-center font-bold text-lg hover:brightness-95"
          >
            ✕
          </button>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-semibold mb-4">
            Professional Mental Health Support
          </h1>

          <p className="text-gray-600 mb-8">
            If your child shows signs of emotional distress, these trusted
            organisations in Malaysia provide confidential and professional
            support.
          </p>

          {/* Support List */}
          <div className="space-y-6">
            {supports.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02 }}
                className="bg-amber-300 rounded-[28px] px-6 py-5 shadow-md"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-black rounded-full grid place-items-center">
                    <span className="text-amber-300 text-2xl">{item.icon}</span>
                  </div>

                  <div className="flex-1">
                    <div className="text-xl font-bold">{item.name}</div>
                    <div className="text-sm text-gray-800 mt-1">
                      {item.description}
                    </div>
                  </div>

                  {item.actionType === "call" ? (
  <div className="flex flex-col items-end">
    <a
      href={item.actionValue}
      className="px-5 py-2 rounded-full bg-black text-amber-300 font-semibold hover:bg-gray-900 transition"
    >
      {item.actionLabel}
    </a>
    <span className="mt-1 text-xs text-gray-700">
      (Mobile devices only)
    </span>
  </div>
) : (
  <a
    href={item.actionValue}
    target="_blank"
    rel="noopener noreferrer"
    className="px-5 py-2 rounded-full bg-black text-amber-300 font-semibold hover:bg-gray-900 transition"
  >
    {item.actionLabel}
  </a>
)}

                </div>
              </motion.div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="mt-8 bg-gray-100 rounded-2xl p-5 text-sm text-gray-700">
            ⚠️ <strong>Disclaimer:</strong> HiddenTales does not replace
            professional diagnosis or therapy. These services are external
            organisations providing professional mental health support.
          </div>
        </motion.div>
      </main>
    </div>
  );
}
