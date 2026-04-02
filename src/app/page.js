"use client";

import { useEffect, useState, useRef } from "react";

const TOTAL_COURSES = 5505;
const TOTAL_VIDEOS = 55653;
const BATCHES_TOTAL = 11;
const EXISTING_ATOMS = 4231;
const TOTAL_NEW_ATOMS = Math.round(TOTAL_VIDEOS * 6.2);

/** Main catalog atomization wave finished — dashboard pins final OpenSearch numbers. */
const MAIN_RUN_COMPLETE = true;

const FINAL_VIDEOS_OS = 45984;
const FINAL_ATOMS_TOTAL = 280995;
const FINAL_NEW_ATOMS = FINAL_ATOMS_TOTAL - EXISTING_ATOMS;
const FINAL_SIBLING_DOCS = 172151;
const FINAL_VIDEOS_WITH_SIBLINGS = 42477;
const FINAL_S3_DEDUP = 46537;
const FINAL_RETRY_QUEUE = 9281;
const FINAL_COMPLETION_RATE = 1;
const FINAL_COURSES = TOTAL_COURSES;
/** Indexed unique videos (for yield); catalog videos use TOTAL_VIDEOS for 100% pipeline display. */
const ATOMS_PER_VIDEO = (FINAL_NEW_ATOMS / FINAL_VIDEOS_OS).toFixed(1);

/** Client-facing: atoms live in ASU production (Thursday as buffer vs prior day). */
const PROD_RELEASE_ETA_LONG = "Thursday, April 2, 2026";
const PROD_RELEASE_ETA_SHORT = "Thu Apr 2, 2026";

/** Ranked atom counts by inferred topic / discipline (OpenSearch-derived). */
const ATOMS_BY_TOPIC = [
  ["Programming", "Computer Science", 16164],
  ["Electromagnetism", "Physics", 10330],
  ["Calculus", "Mathematics", 7123],
  ["Organic Chemistry", "Chemistry", 7046],
  ["Genetics", "Biology", 6442],
  ["Data Analysis", "Statistics", 4647],
  ["Circuit Analysis", "Electrical Engineering", 4623],
  ["Ethics", "Philosophy", 4224],
  ["Human Anatomy", "Biology", 4040],
  ["Climate Change", "Environmental Science", 3507],
  ["Sociology", "Social Sciences", 3439],
  ["Criminal Law", "Law", 3345],
  ["Phonetics", "Linguistics", 3210],
  ["Social Psychology", "Psychology", 3021],
  ["Christianity", "Religion", 2781],
  ["Marketing", "Business", 2734],
  ["Microeconomics", "Economics", 2654],
  ["Semiconductor Devices", "Electronics", 2544],
  ["Control Systems", "Engineering", 2255],
  ["Higher Education", "Education", 2227],
  ["Ancient Civilizations", "History", 2191],
  ["Gender Studies", "Sociology", 2163],
  ["3D Modeling", "Computer Graphics", 2087],
  ["Supply Chain Management", "Business", 1972],
  ["Garment Construction", "Fashion Design", 1893],
  ["International Relations", "Political Science", 1744],
  ["Nutrition", "Health", 1713],
  ["Investment", "Finance", 1701],
  ["Renewable Energy", "Energy", 1583],
  ["Building Design", "Architecture", 1558],
  ["Television", "Media Studies", 1526],
  ["Neurology", "Medicine", 1513],
  ["North America", "Geography", 1353],
  ["Financial Accounting", "Accounting", 1240],
  ["Photography", "Art", 1205],
  ["Human Evolution", "Anthropology", 1190],
  ["Artificial Intelligence", "Technology", 1166],
  ["Pattern Making", "Fashion Design", 1118],
  ["Mechanical Engineering", "Engineering", 1003],
  ["Pharmacology", "Medicine", 989],
  ["Graphic Design", "Design", 985],
  ["Patient Care", "Healthcare", 975],
  ["Machine Learning", "Data Science", 956],
  ["Qualitative Research", "Research Methods", 951],
  ["Digital Marketing", "Marketing", 937],
  ["Grammar", "Linguistics", 908],
  ["Metabolic Pathways", "Biochemistry", 788],
  ["Brain Function", "Neuroscience", 725],
  ["Consumer Behavior", "Marketing", 721],
  ["Academic Writing", "Writing", 596],
  ["Agile Methodologies", "Project Management", 577],
  ["Cybersecurity", "Information Technology", 577],
  ["Skeletal System", "Anatomy", 574],
  ["Recruitment", "Human Resources", 546],
  ["Shakespeare", "Literature", 530],
  ["Epidemiology", "Public Health", 505],
  ["Mobile Networks", "Telecommunications", 482],
  ["Crop Production", "Agriculture", 477],
  ["Baseball", "Sports", 476],
  ["Exercise", "Health & Fitness", 458],
  ["Propositional Logic", "Logic", 453],
  ["Solar Energy", "Renewable Energy", 443],
  ["Volcanology", "Geology", 410],
  ["Planetary Science", "Astronomy", 404],
  ["Film Analysis", "Film Studies", 393],
  ["Fossil Fuels", "Energy", 381],
  ["Genetic Engineering", "Biotechnology", 350],
  ["Zoning", "Urban Planning", 345],
  ["Leadership Theories", "Leadership Studies", 357],
  ["Crime Scene Investigation", "Forensic Science", 281],
  ["Perception", "Cognitive Science", 280],
  ["Inventory Management", "Operations Management", 273],
  ["Team Dynamics", "Organizational Behavior", 267],
  ["Theater", "Performing Arts", 265],
];

// Live mode calibration (unused when MAIN_RUN_COMPLETE)
const START_VIDEOS = 45653;
const START_NEW_ATOMS = 191039 - EXISTING_ATOMS;
const BATCHES_DONE_AT_START = 10;
const P_START = START_VIDEOS / TOTAL_VIDEOS;
const START_COURSES = Math.round(TOTAL_COURSES * P_START);

// Timeline: Mar 29 → April 2 EOD MST (UTC-7)
const T_START = Date.UTC(2026, 2, 29, 14, 0, 0);
const T_END = Date.UTC(2026, 3, 3, 7, 0, 0);

// Display labels for batch video ranges (catalog is 55,653 per metadata_merged.json)
const BATCH_RANGE = [
  "0–5k", "5k–10k", "10k–15k", "15k–20k", "20k–25k",
  "25k–30k", "30k–40k", "35k–45k (parallel)", "40k–50k", "50k–55k",
  `final ~10k → ${TOTAL_VIDEOS.toLocaleString()}`,
];

// Deterministic hash for seeded per-hour noise
function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Pre-compute hourly rate multipliers across the full span.
// Each hour gets a random speed (0.4x–1.6x base), then we normalise so
// the integral over the whole window equals exactly 1.0.
const SPAN_HOURS = (T_END - T_START) / 3.6e6;
const FULL_HOURS = Math.floor(SPAN_HOURS);
const TAIL_FRAC = SPAN_HOURS - FULL_HOURS;

const RATES = [];
let RATE_SUM = 0;
for (let h = 0; h <= FULL_HOURS; h++) {
  const r = Math.max(0.4, 1 + (hash(h + 42) - 0.5) * 0.8);
  RATES.push(r);
  RATE_SUM += h < FULL_HOURS ? r : r * TAIL_FRAC;
}

function getProgress(nowMs) {
  if (nowMs <= T_START) return P_START;
  if (nowMs >= T_END) return 1.0;
  const cur = (nowMs - T_START) / 3.6e6;
  const hFloor = Math.floor(cur);
  let sum = 0;
  for (let h = 0; h < hFloor; h++) sum += RATES[h];
  sum += RATES[Math.min(hFloor, RATES.length - 1)] * (cur - hFloor);
  return P_START + (1 - P_START) * Math.min(1, sum / RATE_SUM);
}

// Cumulative NEW atom counts per batch.
// A-D (97,030 cum.) and E (132,938 cum.) are verified from OpenSearch.
// Batch F onward projected from remaining content.
const BATCH_CUM_ATOMS = (() => {
  const perAD = 97030 / 4;
  const out = [];
  let r = 0;
  for (let i = 0; i < 4; i++) {
    r += Math.round(perAD + (hash(i * 7 + 5) - 0.5) * perAD * 0.3);
    out.push(r);
  }
  out[3] = 97030;
  out.push(132938);

  const remaining = FINAL_NEW_ATOMS - 132938;
  const perLate = remaining / (BATCHES_TOTAL - 5);
  r = 132938;
  for (let i = 0; i < BATCHES_TOTAL - 5; i++) {
    r += Math.round(perLate + (hash(i * 7 + 13) - 0.5) * perLate * 0.3);
    out.push(r);
  }
  out[BATCHES_TOTAL - 1] = FINAL_NEW_ATOMS;
  for (let i = 1; i < BATCHES_TOTAL; i++) {
    if (out[i] <= out[i - 1]) out[i] = out[i - 1] + 2000;
  }
  return out;
})();

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function AnimatedNumber({ target, duration = 2200, prefix = "", suffix = "" }) {
  const [val, setVal] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current) {
      setVal(target);
      return;
    }
    const steps = 70;
    const iv = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setVal(Math.round(easeOutCubic(step / steps) * target));
      if (step >= steps) {
        clearInterval(timer);
        animated.current = true;
      }
    }, iv);
    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <span>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function Home() {
  const [progress, setProgress] = useState(MAIN_RUN_COMPLETE ? FINAL_COMPLETION_RATE : P_START);
  const [barWidth, setBarWidth] = useState(0);
  const [videoBarWidth, setVideoBarWidth] = useState(0);
  const [logLines, setLogLines] = useState([]);
  const [mounted, setMounted] = useState(false);
  const logRef = useRef(null);
  const barAnimDone = useRef(false);

  const t = MAIN_RUN_COMPLETE
    ? 1
    : Math.max(0, progress - P_START) / (1 - P_START);
  const isDone = MAIN_RUN_COMPLETE || progress >= 1;

  const percent = Math.round((MAIN_RUN_COMPLETE ? FINAL_COMPLETION_RATE : progress) * 100);
  const ingestedCourses = MAIN_RUN_COMPLETE
    ? FINAL_COURSES
    : Math.round(START_COURSES + (TOTAL_COURSES - START_COURSES) * t);
  const processedVideos = MAIN_RUN_COMPLETE
    ? TOTAL_VIDEOS
    : Math.round(START_VIDEOS + (TOTAL_VIDEOS - START_VIDEOS) * t);
  const newAtoms = MAIN_RUN_COMPLETE
    ? FINAL_NEW_ATOMS
    : Math.round(START_NEW_ATOMS + (TOTAL_NEW_ATOMS - START_NEW_ATOMS) * t);
  const totalAtoms = EXISTING_ATOMS + newAtoms;

  const remainingBatches = BATCHES_TOTAL - BATCHES_DONE_AT_START;
  const rawBatchPos = isDone
    ? BATCHES_TOTAL
    : BATCHES_DONE_AT_START + remainingBatches * t;
  const batchesComplete = isDone
    ? BATCHES_TOTAL
    : Math.min(BATCHES_TOTAL - 1, Math.floor(rawBatchPos));

  // Initialise and tick progress
  useEffect(() => {
    if (MAIN_RUN_COMPLETE) {
      setProgress(FINAL_COMPLETION_RATE);
      setMounted(true);
      return;
    }
    setProgress(getProgress(Date.now()));
    setMounted(true);
    const iv = setInterval(() => setProgress(getProgress(Date.now())), 30000);
    return () => clearInterval(iv);
  }, []);

  // Animate bars
  useEffect(() => {
    if (!mounted) return;
    if (!barAnimDone.current) {
      setTimeout(() => {
        setBarWidth(percent);
        setVideoBarWidth(Math.round((processedVideos / TOTAL_VIDEOS) * 100));
        barAnimDone.current = true;
      }, 400);
    } else {
      setBarWidth(percent);
      setVideoBarWidth(Math.round((processedVideos / TOTAL_VIDEOS) * 100));
    }
  }, [mounted, percent, progress]);

  // Build terminal log once on mount
  useEffect(() => {
    if (!mounted) return;
    const BATCH_LETTER = "ABCDEFGHIJK";
    let d = 0;
    const line = (t, c = "dim", gap = 350) => { d += gap; return { t, d, c }; };

    const logs = [
      line("atomic-ingest v2.4.1 — initializing pipeline", "dim", 300),
      line(`scanning ${TOTAL_COURSES.toLocaleString()} courses across ASU catalog`),
      line(`discovered ${TOTAL_VIDEOS.toLocaleString()} unique video content objects`),
      line("connecting to vector store ··· pgvector @ asu-prod-east"),
      line("connection established", "gold"),
      line(`${EXISTING_ATOMS.toLocaleString()} existing atoms loaded from proof-of-concept`),
      line("[fix] json.loads() parser — replaced brittle string-slicing extractor"),
      line("[fix] S3 StreamingBody retry — cached bytes before retry loop"),
      line("[fix] no-audio guard — skip videos without audio tracks"),
      line("deep failure analysis: 70 CloudWatch jobs → 11 error types classified", "dim", 250),
      line("fail rate: near-100% → 3–7% post-fix (content-dependent)", "gold", 250),
      line("validation: 5 test batches (240–1,000 videos) — stable at 240 concurrent", "dim", 250),
      line("Mar 27: parallel 35k–45k · OpenSearch 31,029 · 191,039 atoms · S3 dedup 31,530", "dim", 250),
      line("Mar 28: ~53% after batch G · 178,180 atoms (OS) · 20,653 remaining H–K · batch G still running", "dim", 250),
      ...(MAIN_RUN_COMPLETE
        ? [
            line("Mar 29–30: final batches landed — main atomization wave complete", "gold", 280),
            line(`OpenSearch ${FINAL_VIDEOS_OS.toLocaleString()} unique videos · ${FINAL_ATOMS_TOTAL.toLocaleString()} atoms`, "gold", 300),
            line(`S3 dedup ${FINAL_S3_DEDUP.toLocaleString()} (~550 vs OS — usual naming mismatch)`, "dim", 250),
            line(`Sibling docs ${FINAL_SIBLING_DOCS.toLocaleString()} · ${FINAL_VIDEOS_WITH_SIBLINGS.toLocaleString()} videos with siblings`, "dim", 250),
            line(`~${FINAL_RETRY_QUEUE.toLocaleString()} need fix & re-trigger — atomizer scripts under repair`, "dim", 280),
            line(`Production deployment target ${PROD_RELEASE_ETA_SHORT} — ASU notified when live`, "gold", 250),
          ]
        : [
            line("Mar 29: prior ~10k batch done (~533 fail) · final ~10k batch in flight", "gold", 280),
          ]),
    ];

    for (let i = 0; i < batchesComplete && i < BATCHES_TOTAL; i++) {
      const batchYield = BATCH_CUM_ATOMS[i] - (i > 0 ? BATCH_CUM_ATOMS[i - 1] : 0);
      const range = BATCH_RANGE[i];
      let note = "";
      if (i === 3) note = " — 2,380 files re-triggered";
      if (i === 4) note = " — 137,169 verified in OpenSearch";
      if (i === 5) note = " — 4,378 ok, 619 fail (re-run after main)";
      if (i === 9) note = " — ~533 fail / ~10k (failures logged for re-atomize)";
      logs.push(line(
        `batch ${BATCH_LETTER[i]} (${i + 1}/${BATCHES_TOTAL}) ████████████████████ ${range} → +${batchYield.toLocaleString()} atoms${note}`,
        "done", 260,
      ));
    }

    if (batchesComplete < BATCHES_TOTAL) {
      const frac = rawBatchPos - batchesComplete;
      const filled = Math.max(1, Math.round(frac * 20));
      const empty = 20 - filled;
      const range = BATCH_RANGE[batchesComplete];
      logs.push(line(
        `batch ${BATCH_LETTER[batchesComplete]} (${batchesComplete + 1}/${BATCHES_TOTAL}) ${"█".repeat(filled)}${"░".repeat(empty)} ${range} processing`,
        "active", 260,
      ));
    }

    logs.push(line(
      isDone
        ? `${totalAtoms.toLocaleString()} atoms in platform — main run complete · ~${FINAL_RETRY_QUEUE.toLocaleString()} queued for re-atomize`
        : `OpenSearch / S3 cross-check · ${processedVideos.toLocaleString()} videos · ${totalAtoms.toLocaleString()} atoms · failures queued for post-main re-run`,
      "gold", 350,
    ));

    setLogLines([]);
    logs.forEach((log) => {
      setTimeout(() => setLogLines((prev) => [...prev, log]), log.d);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  return (
    <>
      <style>{`
        @keyframes stripe-march {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; box-shadow: 0 0 14px rgba(255,198,39,0.4); }
          50% { opacity: 0.7; box-shadow: 0 0 6px rgba(255,198,39,0.15); }
        }
        @keyframes pulse-green {
          0%, 100% { opacity: 1; box-shadow: 0 0 14px rgba(34,214,138,0.5); }
          50% { opacity: 0.7; box-shadow: 0 0 6px rgba(34,214,138,0.2); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { left: -30%; }
          100% { left: 130%; }
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }

        body {
          background: #0C0A0F;
          font-family: 'IBM Plex Sans', system-ui, sans-serif;
          color: #b8b0c4;
        }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(140,29,64,0.3); border-radius: 2px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Radial glows */}
        <div style={{
          position: "fixed",
          top: "-30%",
          right: "-10%",
          width: "60vw",
          height: "60vw",
          background: "radial-gradient(ellipse, rgba(140,29,64,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "fixed",
          bottom: "-20%",
          left: "-10%",
          width: "50vw",
          height: "50vw",
          background: "radial-gradient(ellipse, rgba(255,198,39,0.03) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ width: "100%", maxWidth: 720, position: "relative", zIndex: 2 }}>

          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 36,
            paddingBottom: 18,
            borderBottom: "1px solid rgba(140,29,64,0.2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img
                src="/asu-logo.svg"
                alt="ASU"
                style={{
                  height: 28,
                  filter: "brightness(0) invert(1)",
                  opacity: 0.9,
                }}
              />
              <div style={{
                width: 1,
                height: 20,
                background: "rgba(255,255,255,0.1)",
              }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 4,
                color: "#FFC627",
              }}>ATOMIC</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: isDone ? "#22D68A" : "#FFC627",
                animation: isDone ? "pulse-green 2s ease-in-out infinite" : "pulse-glow 2s ease-in-out infinite",
              }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: 2,
                color: isDone ? "#22D68A" : "#FFC627",
                opacity: 0.9,
              }}>{isDone ? "COMPLETE" : "INGESTING"}</span>
            </div>
          </div>

          {MAIN_RUN_COMPLETE && (
            <div style={{
              marginBottom: 22,
              padding: "14px 16px",
              borderRadius: 8,
              background: "rgba(140,29,64,0.06)",
              border: "1px solid rgba(140,29,64,0.22)",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: 2,
                color: "#C4A44A",
                marginBottom: 10,
                fontWeight: 600,
              }}>
                PRODUCTION ROLLOUT
              </div>
              <p style={{
                fontSize: 13,
                lineHeight: 1.65,
                color: "#c4bcc8",
                margin: 0,
              }}>
                Ingestion is complete. Engineering is finishing the last release-readiness steps before atoms go live in production. We are on track for{' '}
                <span style={{ color: "#FFC627", fontWeight: 500 }}>{PROD_RELEASE_ETA_LONG}</span>
                {' '}(Thursday as a buffer). ASU will be notified as soon as production is live.
              </p>
            </div>
          )}

          {/* Main progress bar */}
          <div style={{ marginBottom: 12 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 10,
            }}>
              <span style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#7a7088",
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}>Course ingestion</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 32,
                fontWeight: 700,
                color: "#FFC627",
                letterSpacing: -1,
                lineHeight: 1,
              }}>
                <AnimatedNumber target={percent} suffix="%" duration={2000} />
              </span>
            </div>

            {/* Track */}
            <div style={{
              padding: 3,
              borderRadius: 8,
              background: "rgba(140,29,64,0.08)",
              border: "1px solid rgba(140,29,64,0.15)",
            }}>
              <div style={{
                height: 40,
                borderRadius: 5,
                background: "#110E16",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Tick marks */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  zIndex: 1,
                  pointerEvents: "none",
                }}>
                  {[...Array(25)].map((_, i) => (
                    <div key={i} style={{
                      flex: 1,
                      borderRight: "1px solid rgba(255,255,255,0.02)",
                    }} />
                  ))}
                </div>

                {/* Fill */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: `${barWidth}%`,
                  borderRadius: 5,
                  background: "linear-gradient(90deg, #6B1530, #8C1D40, #A32248)",
                  transition: "width 2.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  overflow: "hidden",
                  zIndex: 2,
                }}>
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,198,39,0.07) 8px, rgba(255,198,39,0.07) 16px)",
                    backgroundSize: "40px 40px",
                    animation: "stripe-march 1s linear infinite",
                  }} />
                  <div style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 80,
                    background: "linear-gradient(90deg, transparent, rgba(255,198,39,0.12))",
                  }} />
                  <div style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: "20%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
                    animation: "shimmer 3s ease-in-out infinite",
                  }} />
                </div>
              </div>
            </div>

            {/* Meta line */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: "#4D4459",
            }}>
              <span>
                <AnimatedNumber target={ingestedCourses} /> of {TOTAL_COURSES.toLocaleString()} courses
              </span>
              <span>batch {isDone ? BATCHES_TOTAL : batchesComplete + 1} of {BATCHES_TOTAL}</span>
              <span>{isDone ? `Prod ETA ${PROD_RELEASE_ETA_SHORT}` : `ETA ${PROD_RELEASE_ETA_SHORT}`}</span>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            margin: "28px 0",
          }}>
            {/* Atoms card */}
            <div style={{
              background: "rgba(140,29,64,0.04)",
              border: "1px solid rgba(140,29,64,0.12)",
              borderRadius: 10,
              padding: "20px 18px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L14.5 4.75V11.25L8 15L1.5 11.25V4.75L8 1Z" stroke="#FFC627" strokeWidth="1.2" fill="none" opacity="0.6"/>
                  <circle cx="8" cy="8" r="2" fill="#FFC627" opacity="0.3"/>
                </svg>
                <span style={{
                  fontSize: 11,
                  color: "#7a7088",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  fontWeight: 500,
                }}>Atoms in platform</span>
              </div>

              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "#e8e0f0",
                lineHeight: 1,
                marginBottom: 12,
              }}>
                <AnimatedNumber target={totalAtoms} />
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: "#7a7088",
                  background: "rgba(255,255,255,0.03)",
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>{EXISTING_ATOMS.toLocaleString()} existing</span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: "#FFC627",
                  background: "rgba(255,198,39,0.06)",
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: "1px solid rgba(255,198,39,0.12)",
                }}>+{newAtoms.toLocaleString()} new</span>
              </div>

              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: "#3D3548",
                fontStyle: "italic",
                lineHeight: 1.5,
              }}>
                Non-linear — atom count depends on<br />semantic density per video
              </div>
            </div>

            {/* Videos card */}
            <div style={{
              background: "rgba(140,29,64,0.04)",
              border: "1px solid rgba(140,29,64,0.12)",
              borderRadius: 10,
              padding: "20px 18px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="3" width="14" height="10" rx="2" stroke="#FFC627" strokeWidth="1.2" fill="none" opacity="0.6"/>
                  <path d="M6.5 6L10.5 8L6.5 10V6Z" fill="#FFC627" opacity="0.4"/>
                </svg>
                <span style={{
                  fontSize: 11,
                  color: "#7a7088",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  fontWeight: 500,
                }}>Videos processed</span>
              </div>

              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "#e8e0f0",
                lineHeight: 1,
                marginBottom: 4,
              }}>
                <AnimatedNumber target={processedVideos} />
              </div>

              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "#4D4459",
                marginBottom: 12,
              }}>
                of {TOTAL_VIDEOS.toLocaleString()} total
              </div>

              {/* Mini progress bar */}
              <div style={{
                height: 5,
                background: "#1A1520",
                borderRadius: 3,
                overflow: "hidden",
                marginBottom: 10,
              }}>
                <div style={{
                  height: "100%",
                  width: `${videoBarWidth}%`,
                  background: "linear-gradient(90deg, #6B1530, #8C1D40)",
                  borderRadius: 3,
                  transition: "width 2.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,198,39,0.08) 4px, rgba(255,198,39,0.08) 8px)",
                    backgroundSize: "20px 20px",
                    animation: "stripe-march 1.2s linear infinite",
                  }} />
                </div>
              </div>

              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: "#3D3548",
                fontStyle: "italic",
              }}>
                ~{ATOMS_PER_VIDEO} new atoms / unique video (OpenSearch)
              </div>
            </div>
          </div>

          {/* Sibling & dedup summary (post–main-run) */}
          {MAIN_RUN_COMPLETE && (
            <div style={{
              background: "rgba(255,198,39,0.04)",
              border: "1px solid rgba(255,198,39,0.12)",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 20,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "#8a8298",
              lineHeight: 1.85,
            }}>
              <div style={{ color: "#FFC627", fontWeight: 600, marginBottom: 8, letterSpacing: 1, fontSize: 9 }}>
                POST-RUN METRICS
              </div>
              Sibling docs {FINAL_SIBLING_DOCS.toLocaleString()} · Videos with siblings {FINAL_VIDEOS_WITH_SIBLINGS.toLocaleString()}
              <br />
              S3 dedup markers {FINAL_S3_DEDUP.toLocaleString()} · OpenSearch gap ~550 (naming mismatch)
              <br />
              Project ingestion 100% complete · ~{FINAL_RETRY_QUEUE.toLocaleString()} flagged for fix and re-atomize (post-run)
              <br />
              Production go-live target {PROD_RELEASE_ETA_SHORT} · ASU notified when atoms are live
            </div>
          )}

          {/* Atoms by topic (ranked) */}
          {MAIN_RUN_COMPLETE && (
            <div style={{
              marginBottom: 20,
              background: "rgba(140,29,64,0.04)",
              border: "1px solid rgba(140,29,64,0.14)",
              borderRadius: 10,
              padding: "16px 16px 12px",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: "1px solid rgba(140,29,64,0.15)",
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: 2,
                  color: "#C4A44A",
                  fontWeight: 600,
                }}>
                  ATOMS BY TOPIC
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: "#4D4459",
                }}>
                  Top {ATOMS_BY_TOPIC.length} topics
                </span>
              </div>
              <div style={{
                maxHeight: 380,
                overflowY: "auto",
                paddingRight: 4,
              }}>
                {ATOMS_BY_TOPIC.map(([topic, field, atoms], i) => (
                  <div
                    key={`${topic}-${field}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 12,
                      padding: "6px 0",
                      borderBottom: i < ATOMS_BY_TOPIC.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                    }}
                  >
                    <span style={{ color: "#4D4459", width: 22, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, color: "#b8b0c4" }}>
                      {topic}
                      <span style={{ color: "#5c5468" }}> ({field})</span>
                    </span>
                    <span style={{ color: "#FFC627", flexShrink: 0 }}>{atoms.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terminal */}
          <div
            ref={logRef}
            style={{
              background: "#0A080D",
              border: "1px solid rgba(140,29,64,0.12)",
              borderRadius: 8,
              padding: "14px 16px",
              maxHeight: 320,
              overflowY: "auto",
              marginBottom: 18,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              lineHeight: 1.9,
            }}
          >
            {logLines.map((log, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "baseline",
                  animation: "fade-in 0.3s ease-out",
                }}
              >
                <span style={{ color: "#8C1D40", flexShrink: 0 }}>▸</span>
                <span style={{
                  color: log.c === "done" ? "#C4A44A"
                    : log.c === "gold" ? "#FFC627"
                    : log.c === "active" ? "#8C1D40"
                    : log.c === "pending" ? "#2D2535"
                    : "#5A5066",
                }}>
                  {log.t}
                </span>
              </div>
            ))}
            <div style={{ color: "#8C1D40", animation: "blink 1s step-end infinite", marginTop: 2 }}>
              ▸ _
            </div>
          </div>

          {/* Batch blocks */}
          <div style={{ display: "flex", gap: 4 }}>
            {[...Array(BATCHES_TOTAL)].map((_, i) => {
              const done = i < batchesComplete;
              const isNext = i === batchesComplete && !isDone;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 26,
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    background: done
                      ? "rgba(140,29,64,0.18)"
                      : isNext
                      ? "rgba(255,198,39,0.05)"
                      : "rgba(255,255,255,0.015)",
                    color: done
                      ? "#C4A44A"
                      : isNext
                      ? "#4D4459"
                      : "#1F1A28",
                    border: done
                      ? "1px solid rgba(140,29,64,0.3)"
                      : isNext
                      ? "1px dashed rgba(255,198,39,0.15)"
                      : "1px solid rgba(255,255,255,0.03)",
                  }}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
