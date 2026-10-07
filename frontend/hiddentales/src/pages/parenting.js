// src/pages/parenting.js
import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import bgImg from "../assets/background.jpeg";
import familyImg from "../assets/parentingTips.png";
// ===============================
// EMOTION-SPECIFIC TIP IMAGES
// ===============================

// SAD
import sadComfort from "../assets/HiddenTales_parenting_tips_images_cropped/sadness_comfort_and_listen.png";
import sadFamily from "../assets/HiddenTales_parenting_tips_images_cropped/sadness_family_time.png";
import sadHope from "../assets/HiddenTales_parenting_tips_images_cropped/sadness_encourage_hope.png";

// FEAR
import fearCalm from "../assets/HiddenTales_parenting_tips_images_cropped/fear_calm_and_reassure.png";
import fearListen from "../assets/HiddenTales_parenting_tips_images_cropped/fear_listen_and_guide.png";
import fearAvoid from "../assets/HiddenTales_parenting_tips_images_cropped/fear_avoid_scaring.png";

// ANGER
import angerCalm from "../assets/HiddenTales_parenting_tips_images_cropped/anger_stay_calm_be_patient.png";
import angerPlay from "../assets/HiddenTales_parenting_tips_images_cropped/anger_structured_playtime.png";
import angerTeach from "../assets/HiddenTales_parenting_tips_images_cropped/anger_teach_good_manners.png";


export default function ParentingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const emotion = location.state?.emotion || "sad";

  const [step, setStep] = useState("intro");
  const [active, setActive] = useState(null);

  /* ─────────────────────────────
     EMOTION-SPECIFIC TIPS
  ───────────────────────────── */

  const sadTips = [
    {
      id: "sad-1",
      title: "Validate Your Child’s Sadness",
      img: sadComfort,
      body: (
        <>
          <p className="italic text-sm font-semibold text-gray-700">
            Qur’an — Yusuf (12:18)
          </p>
          <p className="text-[15px] leading-7">
            Prophet Yaʿqub (عليه السلام) expressed deep grief with patience.
            Sadness is a real emotion and should not be dismissed.
          </p>
          <p className="text-[15px] leading-7">
            Say gently: <b>“It’s okay to feel sad. Tell me what happened.”</b>
          </p>
        </>
      ),
      sources: [
        {
          title: "Validating Sadness in Children (QS Yusuf)",
          url: "https://dx.doi.org/10.24235/sicee.v1i0.14539",
        },
        {
          title: "Kindness & Respect in Prophetic Parenting",
          url: "https://jurnal.stituwjombang.ac.id/index.php/UrwatulWutsqo",
        },
      ],
    },
    {
      id: "sad-2",
      title: "Increase Family Presence",
      img: sadFamily,
      body: (
        <p className="text-[15px] leading-7">
          Quality time, shared meals, and gentle conversations help children feel
          emotionally supported and valued.
        </p>
      ),
      sources: [
        {
          title: "Family Involvement & Emotional Resilience",
          url: "https://dx.doi.org/10.24235/sicee.v1i0.14539",
        },
      ],
    },
    {
      id: "sad-3",
      title: "Teach Gentle Resilience",
      img: sadHope,
      body: (
        <p className="text-[15px] leading-7">
          Encourage small steps forward: <i>“Let’s try again tomorrow.”</i>
          This builds resilience without pressure.
        </p>
      ),
      sources: [
        {
          title: "Positive Adaptation & Child Resilience",
          url: "https://dx.doi.org/10.24235/sicee.v1i0.14539",
        },
      ],
    },
  ];

  const fearTips = [
    {
      id: "fear-1",
      title: "Create Emotional Safety",
      img: fearCalm,
      body: (
        <>
          <p className="italic text-sm font-semibold text-gray-700">
            Qur’an — 106:4
          </p>
          <p className="text-[15px] leading-7">
            Allah gives security from fear. Reassure your child with calm presence,
            eye contact, and gentle physical comfort.
          </p>
        </>
      ),
      sources: [
        {
          title: "Islamic Parenting & Compassion (Rahmah)",
          url: "https://jurnal.stituwjombang.ac.id/index.php/UrwatulWutsqo",
        },
      ],
    },
    {
      id: "fear-2",
      title: "Listen Before Correcting",
      img: fearListen,
      body: (
        <p className="text-[15px] leading-7">
          Ask softly: <b>“What made you scared?”</b>
          Listening first reduces fear and builds trust.
        </p>
      ),
      sources: [
        {
          title: "Secure Attachment & Emotional Safety",
          url: "https://dx.doi.org/10.24235/sicee.v1i0.14539",
        },
      ],
    },
    {
      id: "fear-3",
      title: "Teach Tawakkul Gradually",
      img: fearAvoid,
      body: (
        <p className="text-[15px] leading-7">
          Introduce short duʿā’ and simple remembrance so the child feels protected
          by Allah, not pressured.
        </p>
      ),
      sources: [
        {
          title: "Avoid Fear-Based Parenting",
          url: "https://saudijournals.com/media/articles/SJHSS-43-180-188-c.pdf",
        },
      ],
    },
  ];

  const angryTips = [
    {
      id: "angry-1",
      title: "Regulate Yourself First",
      img: angerCalm,
      body: (
        <>
          <p className="italic text-sm font-semibold text-gray-700">
            Hadith — Bukhari
          </p>
          <p className="text-[15px] leading-7">
            “Do not become angry.” Pause, breathe, and calm yourself before
            responding to the child.
          </p>
        </>
      ),
      sources: [
        {
          title: "Parental Emotional Regulation & Modelling",
          url: "https://dx.doi.org/10.24235/sicee.v1i0.14539",
        },
      ],
    },
    {
      id: "angry-2",
      title: "Set Calm & Clear Boundaries",
      img: angerPlay,
      body: (
        <p className="text-[15px] leading-7">
          Anger often comes from unmet needs. Use predictable routines and clear,
          calm rules instead of shouting or punishment.
        </p>
      ),
      sources: [
        {
          title: "Avoid Harsh Punishment in Islamic Parenting",
          url: "https://saudijournals.com/media/articles/SJHSS-43-180-188-c.pdf",
        },
      ],
    },
    {
      id: "angry-3",
      title: "Teach Akhlaq by Example",
      img: angerTeach,
      body: (
        <p className="text-[15px] leading-7">
          Children imitate adults. Model patience, apologies, and respectful
          communication.
        </p>
      ),
      sources: [
        {
          title: "Akhlaq as the Greatest Gift to Children",
          url: "https://jurnal.stituwjombang.ac.id/index.php/UrwatulWutsqo",
        },
      ],
    },
  ];

  const cards = useMemo(() => {
    if (emotion === "fear") return fearTips;
    if (emotion === "angry") return angryTips;
    return sadTips;
  }, [emotion]);

  const emotionLabel =
    emotion === "fear" ? "fear" : emotion === "angry" ? "angry" : "sad";

  return (
    <div className="min-h-screen text-gray-900 relative overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-center bg-cover opacity-30"
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-white/55" />

      <div className="fixed top-5 right-5 z-40">
        <PillButton onClick={() => navigate(-1)} variant="primary">
          ✕ Close
        </PillButton>
      </div>

      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <StepCard
              badge="Parenting Tips"
              title="Parenting starts with understanding"
              subtitle="Use your child’s drawings as a window into their emotions."
              image={familyImg}
              primaryText="Let’s Dive In →"
              onPrimary={() => setStep("start")}
            />
          )}

          {step === "start" && (
            <StepCard
              badge="Before We Begin"
              title="A gentle reminder"
              subtitle="Every child expresses emotions differently. These tips are guidance, not a medical diagnosis."
              image={familyImg}
              primaryText="Continue →"
              secondaryText="Back"
              onPrimary={() => setStep("tips")}
              onSecondary={() => setStep("intro")}
            />
          )}

          {step === "tips" && (
            <motion.div className="w-full max-w-6xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow">
                  🧠 <span className="font-semibold">Parenting Tips</span>
                </div>
                <h1 className="mt-4 text-3xl sm:text-4xl font-semibold">
                  When your child feels {emotionLabel}
                </h1>
                <p className="mt-2 text-gray-600">
                  Emotion-specific guidance you can apply today.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {cards.map((c) => (
                  <TipExpandableCard
                    key={c.id}
                    id={c.id}
                    title={c.title}
                    img={c.img}
                    active={active}
                    setActive={setActive}
                  >
                    {c.body}

                    {c.sources && (
                      <div className="mt-4 pt-4 border-t border-amber-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          Sources & References
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {c.sources.map((s, i) => (
                            <a
                              key={i}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="
                                inline-flex items-center
                                rounded-full
                                bg-amber-200/60
                                px-3 py-1
                                text-amber-900
                                text-xs
                                font-medium
                                hover:bg-amber-300/70
                                transition
                              "
                            >
                              {s.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </TipExpandableCard>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ───────── UI COMPONENTS ───────── */

function PillButton({ children, onClick, variant = "ghost" }) {
  const base = "rounded-full px-6 py-3 text-sm font-semibold transition";
  const styles =
    variant === "primary"
      ? "bg-amber-300 shadow hover:brightness-95"
      : "bg-white/70 border";
  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function StepCard(props) {
  return (
    <motion.div className="w-full max-w-3xl">
      <div className="rounded-[36px] bg-white/80 p-10 text-center shadow">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-200/70 px-4 py-2 text-sm font-semibold">
          🌼 {props.badge}
        </div>
        <img src={props.image} alt="Family" className="mx-auto w-[200px] mt-6" />
        <h1 className="mt-6 text-3xl font-semibold">{props.title}</h1>
        <p className="mt-4 text-gray-600">{props.subtitle}</p>
        <div className="mt-8 flex justify-center gap-3">
          {props.secondaryText && (
            <PillButton onClick={props.onSecondary}>
              {props.secondaryText}
            </PillButton>
          )}
          <PillButton onClick={props.onPrimary} variant="primary">
            {props.primaryText}
          </PillButton>
        </div>
      </div>
    </motion.div>
  );
}

function TipExpandableCard({ id, title, img, active, setActive, children }) {
  const isActive = active === id;
  return (
    <motion.div layout className="w-full">
      <button
        onClick={() => setActive(isActive ? null : id)}
        className="w-full text-left"
      >
        <div className="rounded-[28px] bg-white/75 border shadow overflow-hidden">
          <img src={img} alt={title}  className="w-full h-[210px] object-contain bg-amber-50" />
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-200 grid place-items-center">
                💛
              </div>
              <div className="font-semibold">{title}</div>
              <div className="ml-auto text-sm text-gray-600">
                {isActive ? "Tap to collapse" : "Tap to expand"}
              </div>
            </div>

            <AnimatePresence>
              {isActive && (
                <motion.div className="mt-5 bg-amber-100/60 p-5 rounded-2xl">
                  {children}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </button>
    </motion.div>
  );
}
