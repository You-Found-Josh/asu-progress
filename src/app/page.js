"use client";

import { useEffect, useState, useRef } from "react";

const TOTAL_COURSES = 5505;
const INGESTED_COURSES = 1650;
const PERCENT = Math.round((INGESTED_COURSES / TOTAL_COURSES) * 100);

const TOTAL_VIDEOS = 56802;
const PROCESSED_VIDEOS = 17000;

const EXISTING_ATOMS = 4231;
const NEW_ATOMS = 88000;
const TOTAL_ATOMS = EXISTING_ATOMS + NEW_ATOMS;

const BATCHES_COMPLETE = 4;
const BATCHES_TOTAL = 11;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function AnimatedNumber({ target, duration = 2200, prefix = "", suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const steps = 70;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setVal(Math.round(easeOutCubic(step / steps) * target));
      if (step >= steps) clearInterval(timer);
    }, interval);
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
  const [barWidth, setBarWidth] = useState(0);
  const [videoBarWidth, setVideoBarWidth] = useState(0);
  const [logLines, setLogLines] = useState([]);
  const logRef = useRef(null);

  const logs = [
    { t: "atomic-ingest v2.4.1 — initializing pipeline", d: 300, c: "dim" },
    { t: `scanning ${TOTAL_COURSES.toLocaleString()} courses across ASU catalog`, d: 800, c: "dim" },
    { t: `discovered ${TOTAL_VIDEOS.toLocaleString()} unique video content objects`, d: 1300, c: "dim" },
    { t: "connecting to vector store ··· pgvector @ asu-prod-east", d: 1800, c: "dim" },
    { t: "connection established", d: 2200, c: "gold" },
    { t: "batch 1/11 ████████████████████ 4,231 atoms", d: 2700, c: "done" },
    { t: "batch 2/11 ████████████████████ 26,400 atoms", d: 3100, c: "done" },
    { t: "batch 3/11 ████████████████████ 58,700 atoms", d: 3500, c: "done" },
    { t: "batch 4/11 ████████████████████ 88,000 atoms", d: 3900, c: "done" },
    { t: "batch 5/11 ░░░░░░░░░░░░░░░░░░░░ queued", d: 4400, c: "pending" },
    { t: `${TOTAL_ATOMS.toLocaleString()} atoms indexed — awaiting next batch window`, d: 4900, c: "gold" },
  ];

  useEffect(() => {
    setTimeout(() => {
      setBarWidth(PERCENT);
      setVideoBarWidth(Math.round((PROCESSED_VIDEOS / TOTAL_VIDEOS) * 100));
    }, 400);

    logs.forEach((log) => {
      setTimeout(() => {
        setLogLines((prev) => [...prev, log]);
      }, log.d);
    });
  }, []);

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
        {/* Subtle radial glow */}
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
                background: "#FFC627",
                animation: "pulse-glow 2s ease-in-out infinite",
              }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: 2,
                color: "#FFC627",
                opacity: 0.9,
              }}>INGESTING</span>
            </div>
          </div>

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
                <AnimatedNumber target={PERCENT} suffix="%" duration={2000} />
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
                  {/* Animated stripes */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,198,39,0.07) 8px, rgba(255,198,39,0.07) 16px)",
                    backgroundSize: "40px 40px",
                    animation: "stripe-march 1s linear infinite",
                  }} />
                  {/* Leading edge glow */}
                  <div style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 80,
                    background: "linear-gradient(90deg, transparent, rgba(255,198,39,0.12))",
                  }} />
                  {/* Shimmer */}
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
                <AnimatedNumber target={INGESTED_COURSES} /> of {TOTAL_COURSES.toLocaleString()} courses
              </span>
              <span>batch {BATCHES_COMPLETE} of {BATCHES_TOTAL}</span>
              <span>ETA Mar 31 2026</span>
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
                <AnimatedNumber target={TOTAL_ATOMS} />
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
                }}>+{NEW_ATOMS.toLocaleString()} new</span>
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
                <AnimatedNumber target={PROCESSED_VIDEOS} />
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
                ~5.2 atoms per video (avg yield)
              </div>
            </div>
          </div>

          {/* Terminal */}
          <div
            ref={logRef}
            style={{
              background: "#0A080D",
              border: "1px solid rgba(140,29,64,0.12)",
              borderRadius: 8,
              padding: "14px 16px",
              maxHeight: 175,
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
              const isDone = i < BATCHES_COMPLETE;
              const isNext = i === BATCHES_COMPLETE;
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
                    background: isDone
                      ? "rgba(140,29,64,0.18)"
                      : isNext
                      ? "rgba(255,198,39,0.05)"
                      : "rgba(255,255,255,0.015)",
                    color: isDone
                      ? "#C4A44A"
                      : isNext
                      ? "#4D4459"
                      : "#1F1A28",
                    border: isDone
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
