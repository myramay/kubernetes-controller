import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedGradientBackground from "../components/ui/animated-gradient-background";

export default function Home() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={S.page}>
      <AnimatedGradientBackground
        Breathing={true}
        gradientColors={["#0c0b16", "#3b1f6e", "#8b5cf6", "#7c3aed", "#4c1d95", "#1e1b4b", "#0c0b16"]}
        gradientStops={[20, 38, 52, 64, 75, 88, 100]}
        breathingRange={4}
        animationSpeed={0.015}
        startingGap={120}
      />

      <div style={{ ...S.content, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>

        <div style={S.badge}>Digital safety for immigrants</div>

        <h1 style={S.headline}>
          Your first step
          <br />
          <span style={S.accent}>starts here.</span>
        </h1>

        <p style={S.sub}>
          Entry Point helps immigrants navigate life in the US —
          from your first checklist to protecting your digital safety.
        </p>

        <div style={S.buttons}>
          <button
            style={S.btnPrimary}
            onClick={() => navigate("/onboarding")}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(139,92,246,0.55)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(139,92,246,0.4)"; }}
          >
            Get Started
          </button>
          <button
            style={S.btnSecondary}
            onClick={() => navigate("/safety")}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(139,92,246,0.1)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Check My Safety
          </button>
        </div>

        <div style={S.pills}>
          {["Personalized checklist", "Breach checker", "Scam detector"].map((pill) => (
            <div key={pill} style={S.pill}>{pill}</div>
          ))}
        </div>
      </div>

      <p style={S.disclaimer}>Free · No account required · 15 languages supported</p>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: "transparent",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    position: "relative", overflow: "hidden",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    padding: "40px 24px",
  },
  blob1: {
    position: "fixed", borderRadius: "50%", filter: "blur(110px)", pointerEvents: "none",
    width: 560, height: 560,
    background: "radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)",
    top: -120, left: -120,
    animation: "floatBlob 8s ease-in-out infinite",
  },
  blob2: {
    position: "fixed", borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none",
    width: 480, height: 480,
    background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
    bottom: -100, right: -100,
    animation: "floatBlob 10s ease-in-out infinite reverse",
  },
  blob3: {
    position: "fixed", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none",
    width: 320, height: 320,
    background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)",
    top: "40%", right: "5%",
    animation: "floatBlob 12s ease-in-out infinite",
  },
  content: {
    position: "relative", zIndex: 1,
    textAlign: "center", maxWidth: "720px",
  },
  badge: {
    display: "inline-block",
    background: "rgba(139,92,246,0.15)",
    border: "1px solid rgba(139,92,246,0.35)",
    color: "#c4b5fd", borderRadius: "999px",
    padding: "6px 20px", fontSize: "13px",
    fontWeight: "400", letterSpacing: "0.06em",
    marginBottom: "32px",
  },
  headline: {
    fontSize: "clamp(42px, 7vw, 80px)",
    fontWeight: "300", color: "#f0ecff",
    lineHeight: 1.08, margin: "0 0 16px 0",
    letterSpacing: "-0.02em",
  },
  accent: {
    background: "linear-gradient(135deg, #8b5cf6 0%, #10b981 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  sub: {
    fontSize: "clamp(16px, 2vw, 19px)",
    color: "#8b8ba7",
    lineHeight: 1.75, margin: "0 0 48px 0",
  },
  buttons: {
    display: "flex", gap: "14px",
    justifyContent: "center", flexWrap: "wrap",
    marginBottom: "52px",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    color: "#fff", border: "none",
    borderRadius: "14px", padding: "16px 40px",
    fontSize: "17px", fontWeight: "400",
    cursor: "pointer",
    boxShadow: "0 4px 24px rgba(139,92,246,0.4)",
    transition: "transform 0.2s, box-shadow 0.2s",
    letterSpacing: "0.02em",
  },
  btnSecondary: {
    background: "transparent",
    color: "#c4b5fd",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "14px", padding: "16px 40px",
    fontSize: "17px", fontWeight: "400",
    cursor: "pointer",
    transition: "transform 0.2s, background 0.2s, border-color 0.2s",
    letterSpacing: "0.02em",
  },
  pills: {
    display: "flex", gap: "10px",
    justifyContent: "center", flexWrap: "wrap",
  },
  pill: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#8b8ba7", borderRadius: "999px",
    padding: "8px 20px", fontSize: "13px",
    fontWeight: "500", letterSpacing: "0.02em",
  },
  disclaimer: {
    position: "absolute", bottom: "28px",
    color: "#4a4768", fontSize: "12px",
    letterSpacing: "0.04em", zIndex: 1,
  },
};
