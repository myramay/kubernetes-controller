import { useState } from "react";
import Navbar from "../components/Navbar";
import LanguageSelector from "../components/LanguageSelector";
import OnboardingForm from "../components/OnboardingForm";

const CONTINUE_LABEL = {
  en: "Continue", es: "Continuar", zh: "继续", tl: "Magpatuloy",
  vi: "Tiếp tục", ar: "متابعة", fr: "Continuer", ko: "계속",
  ru: "Продолжить", ht: "Kontinye", hi: "आगे बढ़ें",
  pt: "Continuar", uk: "Продовжити", am: "ቀጥል", so: "Sii wad",
};

const SELECT_HEADING = {
  en: "Choose your language",
  es: "Elige tu idioma",
  zh: "选择您的语言",
  tl: "Piliin ang iyong wika",
  vi: "Chọn ngôn ngữ của bạn",
  ar: "اختر لغتك",
  fr: "Choisissez votre langue",
  ko: "언어를 선택하세요",
  ru: "Выберите язык",
  ht: "Chwazi lang ou",
  hi: "अपनी भाषा चुनें",
  pt: "Escolha seu idioma",
  uk: "Оберіть мову",
  am: "ቋንቋዎን ይምረጡ",
  so: "Dooro luqaddaada",
};

export default function Onboarding() {
  const [language, setLanguage] = useState(() => localStorage.getItem("ep_lang") || "en");
  const [langChosen, setLangChosen] = useState(false);

  const handleLangChange = (code) => {
    setLanguage(code);
    localStorage.setItem("ep_lang", code);
  };

  const handleContinue = () => {
    localStorage.setItem("ep_lang", language);
    setLangChosen(true);
  };

  return (
    <div style={S.page}>
      <div style={S.blob1} />
      <div style={S.blob2} />
      <div style={S.blob3} />
      <Navbar language={language} />

      <div style={S.content}>
        {!langChosen ? (
          <div style={S.langScreen}>
            <div style={S.badge}>Entry Point</div>
            <h1 style={S.heading}>Your guide starts here.</h1>
            <p style={S.sub}>{SELECT_HEADING[language] || SELECT_HEADING.en}</p>
            <LanguageSelector language={language} onChange={handleLangChange} />
            <button
              style={S.btnPrimary}
              onClick={handleContinue}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(139,92,246,0.55)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(139,92,246,0.4)"; }}
            >
              {CONTINUE_LABEL[language] || "Continue"}
            </button>
          </div>
        ) : (
          <OnboardingForm language={language} />
        )}
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: "#0c0b16",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    position: "relative", overflow: "hidden",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    padding: "80px 24px 48px",
  },
  blob1: {
    position: "fixed", borderRadius: "50%", filter: "blur(110px)", pointerEvents: "none",
    width: 520, height: 520,
    background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)",
    top: -100, left: -100,
  },
  blob2: {
    position: "fixed", borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none",
    width: 420, height: 420,
    background: "radial-gradient(circle, rgba(16,185,129,0.13) 0%, transparent 70%)",
    bottom: -80, right: -80,
  },
  blob3: {
    position: "fixed", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none",
    width: 300, height: 300,
    background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
    top: "50%", right: "8%",
  },
  content: {
    position: "relative", zIndex: 1,
    width: "100%", maxWidth: "600px",
    display: "flex", flexDirection: "column", alignItems: "center",
    animation: "fadeIn 0.4s ease",
  },
  langScreen: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "24px",
    textAlign: "center", width: "100%",
  },
  badge: {
    display: "inline-block",
    background: "rgba(139,92,246,0.15)",
    border: "1px solid rgba(139,92,246,0.35)",
    color: "#c4b5fd", borderRadius: "999px",
    padding: "6px 20px", fontSize: "13px",
    fontWeight: "600", letterSpacing: "0.04em",
  },
  heading: {
    fontSize: "clamp(28px, 5vw, 44px)",
    fontWeight: "800", color: "#f0ecff",
    margin: 0, lineHeight: 1.15,
    letterSpacing: "-0.025em",
  },
  sub: {
    fontSize: "15px", color: "#8b8ba7",
    lineHeight: 1.6, margin: 0,
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    color: "#fff", border: "none",
    borderRadius: "14px", padding: "15px 44px",
    fontSize: "16px", fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 24px rgba(139,92,246,0.4)",
    transition: "transform 0.2s, box-shadow 0.2s",
    letterSpacing: "-0.01em",
    marginTop: "4px",
  },
};
