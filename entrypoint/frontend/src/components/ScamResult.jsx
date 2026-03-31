const LEVEL_CONFIG = {
  low:      { label: "LIKELY SAFE",    color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.3)" },
  medium:   { label: "SUSPICIOUS",     color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  high:     { label: "HIGH RISK",      color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.35)" },
  critical: { label: "SCAM DETECTED",  color: "#dc2626", bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.45)" },
};

const LABELS = {
  en: { score: "Risk Score", redFlags: "Red Flags", immigrantFlags: "Immigrant-Specific Warnings", action: "What To Do" },
  es: { score: "Puntuación de riesgo", redFlags: "Señales de alerta", immigrantFlags: "Alertas para inmigrantes", action: "Qué hacer" },
  zh: { score: "风险评分", redFlags: "危险信号", immigrantFlags: "针对移民的警告", action: "该怎么做" },
  vi: { score: "Điểm rủi ro", redFlags: "Dấu hiệu cảnh báo", immigrantFlags: "Cảnh báo dành riêng cho người nhập cư", action: "Phải làm gì" },
  ar: { score: "درجة المخاطرة", redFlags: "العلامات التحذيرية", immigrantFlags: "تحذيرات خاصة بالمهاجرين", action: "ماذا تفعل" },
  fr: { score: "Score de risque", redFlags: "Signaux d'alarme", immigrantFlags: "Avertissements spécifiques aux immigrants", action: "Que faire" },
  pt: { score: "Pontuação de risco", redFlags: "Sinais de alerta", immigrantFlags: "Avisos específicos para imigrantes", action: "O que fazer" },
  hi: { score: "जोखिम स्कोर", redFlags: "खतरे के संकेत", immigrantFlags: "अप्रवासी-विशेष चेतावनियां", action: "क्या करें" },
  ru: { score: "Оценка риска", redFlags: "Тревожные сигналы", immigrantFlags: "Предупреждения для иммигрантов", action: "Что делать" },
};

export default function ScamResult({ result, language = "en" }) {
  if (!result) return null;

  const cfg = LEVEL_CONFIG[result.risk_level] || LEVEL_CONFIG.medium;
  const t = LABELS[language] || LABELS.en;

  return (
    <div style={{ ...S.wrap, borderColor: cfg.border }}>
      <div style={{ ...S.banner, background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}>
        <div style={{ ...S.levelDot, background: cfg.color }} />
        <div>
          <div style={{ ...S.level, color: cfg.color }}>{cfg.label}</div>
          <div style={S.scoreRow}>
            <span style={S.scoreLabel}>{t.score}:</span>
            <span style={{ ...S.scoreNum, color: cfg.color }}>{result.risk_score}/100</span>
          </div>
        </div>
      </div>

      <div style={S.body}>
        {result.red_flags?.length > 0 && (
          <div style={S.section}>
            <div style={S.sectionTitle}>{t.redFlags}</div>
            <ul style={S.list}>
              {result.red_flags.map((f, i) => (
                <li key={i} style={S.flagItem}>
                  <span style={S.dot} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.immigrant_flags?.length > 0 && (
          <div style={S.section}>
            <div style={{ ...S.sectionTitle, color: "#fca5a5" }}>{t.immigrantFlags}</div>
            <ul style={S.list}>
              {result.immigrant_flags.map((f, i) => (
                <li key={i} style={{ ...S.flagItem, color: "#fca5a5" }}>
                  <span style={{ ...S.dot, background: "#ef4444" }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.recommended_action && (
          <div style={S.actionBox}>
            <div style={S.sectionTitle}>{t.action}</div>
            <p style={S.action}>{result.recommended_action}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  wrap: { border: "1px solid", borderRadius: "18px", overflow: "hidden", marginTop: "4px", fontFamily: "'Inter', system-ui, sans-serif" },
  banner: { display: "flex", alignItems: "center", gap: "14px", padding: "18px 20px" },
  levelDot: { width: "14px", height: "14px", minWidth: "14px", borderRadius: "50%" },
  level: { fontSize: "16px", fontWeight: "800", letterSpacing: "0.04em" },
  scoreRow: { display: "flex", gap: "8px", alignItems: "center", marginTop: "3px" },
  scoreLabel: { color: "#8b8ba7", fontSize: "12px", fontWeight: "500" },
  scoreNum: { fontSize: "16px", fontWeight: "700" },
  body: { padding: "18px 20px", display: "flex", flexDirection: "column", gap: "16px" },
  section: {},
  sectionTitle: {
    color: "#8b8ba7", fontSize: "11px",
    fontWeight: "700", letterSpacing: "0.07em",
    textTransform: "uppercase", marginBottom: "8px",
  },
  list: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" },
  flagItem: { display: "flex", alignItems: "flex-start", gap: "8px", color: "#c4b5fd", fontSize: "13px", lineHeight: 1.5, fontWeight: "500" },
  dot: { width: "6px", height: "6px", minWidth: "6px", borderRadius: "50%", background: "#f59e0b", marginTop: "6px" },
  actionBox: {
    background: "rgba(139,92,246,0.07)",
    border: "1px solid rgba(139,92,246,0.15)",
    borderRadius: "12px", padding: "14px 16px",
  },
  action: { color: "#f0ecff", fontSize: "13px", lineHeight: 1.65, margin: 0, fontWeight: "500" },
};
