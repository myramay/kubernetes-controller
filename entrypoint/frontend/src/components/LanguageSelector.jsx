export const LANGUAGES = [
  { code: "en", native: "English" },
  { code: "es", native: "Español" },
  { code: "zh", native: "中文" },
  { code: "tl", native: "Filipino" },
  { code: "vi", native: "Tiếng Việt" },
  { code: "ar", native: "العربية" },
  { code: "fr", native: "Français" },
  { code: "ko", native: "한국어" },
  { code: "ru", native: "Русский" },
  { code: "ht", native: "Kreyòl" },
  { code: "hi", native: "हिन्दी" },
  { code: "pt", native: "Português" },
  { code: "uk", native: "Українська" },
  { code: "am", native: "አማርኛ" },
  { code: "so", native: "Soomaali" },
];

export default function LanguageSelector({ language, onChange }) {
  return (
    <div style={S.grid}>
      {LANGUAGES.map(({ code, native }) => {
        const active = language === code;
        return (
          <button
            key={code}
            style={{
              ...S.btn,
              ...(active ? S.active : S.inactive),
            }}
            onClick={() => onChange(code)}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; e.currentTarget.style.color = "#c4b5fd"; e.currentTarget.style.background = "rgba(139,92,246,0.07)"; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#8b8ba7"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; } }}
          >
            {native}
          </button>
        );
      })}
    </div>
  );
}

const S = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    width: "100%",
    maxWidth: "480px",
  },
  btn: {
    border: "1px solid",
    borderRadius: "12px",
    padding: "13px 10px",
    fontSize: "14px",
    fontWeight: "500",
    fontFamily: "'Inter', system-ui, sans-serif",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s, border-color 0.15s, transform 0.1s",
    textAlign: "center",
    lineHeight: 1.2,
    letterSpacing: "-0.01em",
  },
  active: {
    background: "rgba(139,92,246,0.18)",
    borderColor: "rgba(139,92,246,0.55)",
    color: "#c4b5fd",
    fontWeight: "600",
  },
  inactive: {
    background: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.08)",
    color: "#8b8ba7",
  },
};
