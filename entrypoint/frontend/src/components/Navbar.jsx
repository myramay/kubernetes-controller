import { useNavigate, useLocation } from "react-router-dom";

const NAV_LABELS = {
  en: { onboarding: "Get Started", safety: "Safety Tools" },
  es: { onboarding: "Comenzar", safety: "Seguridad" },
  zh: { onboarding: "开始", safety: "安全工具" },
  tl: { onboarding: "Magsimula", safety: "Kaligtasan" },
  vi: { onboarding: "Bắt đầu", safety: "An toàn" },
  ar: { onboarding: "ابدأ", safety: "أدوات الأمان" },
  fr: { onboarding: "Commencer", safety: "Sécurité" },
  ko: { onboarding: "시작하기", safety: "안전 도구" },
  ru: { onboarding: "Начать", safety: "Безопасность" },
  ht: { onboarding: "Kòmanse", safety: "Sekirite" },
  hi: { onboarding: "शुरू करें", safety: "सुरक्षा" },
  pt: { onboarding: "Começar", safety: "Segurança" },
  uk: { onboarding: "Почати", safety: "Безпека" },
  am: { onboarding: "ጀምር", safety: "ደህንነት" },
  so: { onboarding: "Bilow", safety: "Amni" },
};

export default function Navbar({ language = "en" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const t = NAV_LABELS[language] || NAV_LABELS.en;
  const isActive = (path) => location.pathname === path;

  return (
    <nav style={S.nav}>
      <div style={S.inner}>
        <button style={S.logo} onClick={() => navigate("/")}>
          Entry Point
        </button>
        <div style={S.links}>
          <button
            style={{ ...S.link, ...(isActive("/onboarding") ? S.linkActive : {}) }}
            onClick={() => navigate("/onboarding")}
          >
            {t.onboarding}
          </button>
          <button
            style={{ ...S.link, ...(isActive("/safety") ? S.linkActive : {}) }}
            onClick={() => navigate("/safety")}
          >
            {t.safety}
          </button>
        </div>
      </div>
    </nav>
  );
}

const S = {
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    background: "rgba(12,11,22,0.85)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(139,92,246,0.12)",
  },
  inner: {
    maxWidth: "1040px", margin: "0 auto",
    padding: "0 24px", height: "62px",
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    background: "none", border: "none",
    color: "#f0ecff", fontSize: "17px",
    fontWeight: "800", cursor: "pointer",
    letterSpacing: "-0.02em",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  links: { display: "flex", gap: "4px" },
  link: {
    background: "none", border: "none",
    color: "#8b8ba7", fontSize: "14px",
    fontWeight: "500",
    fontFamily: "'Inter', system-ui, sans-serif",
    cursor: "pointer",
    padding: "8px 14px", borderRadius: "10px",
    transition: "color 0.2s, background 0.2s",
  },
  linkActive: {
    color: "#c4b5fd",
    background: "rgba(139,92,246,0.12)",
  },
};
