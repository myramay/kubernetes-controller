import { useState } from "react";

const RISK_CONFIG = {
  low:      { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.3)" },
  medium:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  high:     { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.35)" },
  critical: { color: "#dc2626", bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.4)" },
};

const LABELS = {
  en: {
    clean: "No breaches found.",
    cleanSub: "Your email was not found in any known data breaches.",
    found: (n) => `Found in ${n} breach${n === 1 ? "" : "es"}`,
    summary: "What happened",
    breaches: "Breached services",
    steps: "Action steps",
    dataExposed: "Data exposed",
  },
  es: {
    clean: "No se encontraron filtraciones.",
    cleanSub: "Tu correo no aparece en ninguna filtración de datos conocida.",
    found: (n) => `Encontrado en ${n} filtración${n === 1 ? "" : "es"}`,
    summary: "Qué ocurrió",
    breaches: "Servicios afectados",
    steps: "Pasos a seguir",
    dataExposed: "Datos expuestos",
  },
  zh: {
    clean: "未发现任何泄露。",
    cleanSub: "您的电子邮件未在任何已知数据泄露中被发现。",
    found: (n) => `在 ${n} 次泄露中发现`,
    summary: "发生了什么",
    breaches: "泄露的服务",
    steps: "行动步骤",
    dataExposed: "泄露的数据",
  },
  vi: {
    clean: "Không tìm thấy vi phạm nào.",
    cleanSub: "Email của bạn không được tìm thấy trong bất kỳ vi phạm dữ liệu nào.",
    found: (n) => `Tìm thấy trong ${n} vi phạm`,
    summary: "Điều gì đã xảy ra",
    breaches: "Dịch vụ bị vi phạm",
    steps: "Các bước hành động",
    dataExposed: "Dữ liệu bị lộ",
  },
  ar: {
    clean: "لم يتم العثور على أي اختراق.",
    cleanSub: "لم يُعثر على بريدك الإلكتروني في أي اختراق بيانات معروف.",
    found: (n) => `وُجد في ${n} اختراق`,
    summary: "ما الذي حدث",
    breaches: "الخدمات المخترقة",
    steps: "خطوات العمل",
    dataExposed: "البيانات المكشوفة",
  },
  fr: {
    clean: "Aucune violation trouvée.",
    cleanSub: "Votre e-mail n'a pas été trouvé dans des violations de données connues.",
    found: (n) => `Trouvé dans ${n} violation${n === 1 ? "" : "s"}`,
    summary: "Ce qui s'est passé",
    breaches: "Services compromis",
    steps: "Étapes à suivre",
    dataExposed: "Données exposées",
  },
  pt: {
    clean: "Nenhuma violação encontrada.",
    cleanSub: "Seu e-mail não foi encontrado em nenhuma violação de dados conhecida.",
    found: (n) => `Encontrado em ${n} violação${n === 1 ? "" : "ões"}`,
    summary: "O que aconteceu",
    breaches: "Serviços comprometidos",
    steps: "Passos de ação",
    dataExposed: "Dados expostos",
  },
  hi: {
    clean: "कोई उल्लंघन नहीं मिला।",
    cleanSub: "आपका ईमेल किसी भी ज्ञात डेटा उल्लंघन में नहीं पाया गया।",
    found: (n) => `${n} उल्लंघन में पाया गया`,
    summary: "क्या हुआ",
    breaches: "उल्लंघन किए गए सेवाएं",
    steps: "कार्य कदम",
    dataExposed: "उजागर डेटा",
  },
  ru: {
    clean: "Утечек не обнаружено.",
    cleanSub: "Ваш email не найден ни в одной известной утечке данных.",
    found: (n) => `Найден в ${n} утечке${n === 1 ? "" : "ах"}`,
    summary: "Что произошло",
    breaches: "Скомпрометированные сервисы",
    steps: "Шаги действий",
    dataExposed: "Раскрытые данные",
  },
};

export default function BreachResult({ result, language = "en" }) {
  const [done, setDone] = useState({});
  if (!result) return null;

  const t = LABELS[language] || LABELS.en;

  if (result.breaches_found === 0) {
    return (
      <div style={{ ...S.wrap, borderColor: RISK_CONFIG.low.border }}>
        <div style={{ ...S.banner, background: RISK_CONFIG.low.bg }}>
          <div style={{ ...S.levelDot, background: RISK_CONFIG.low.color }} />
          <div>
            <div style={{ ...S.level, color: RISK_CONFIG.low.color }}>{t.clean}</div>
            <div style={S.cleanSub}>{t.cleanSub}</div>
          </div>
        </div>
      </div>
    );
  }

  const cfg = RISK_CONFIG[result.risk_level] || RISK_CONFIG.medium;

  return (
    <div style={{ ...S.wrap, borderColor: cfg.border }}>
      <div style={{ ...S.banner, background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}>
        <div style={{ ...S.levelDot, background: cfg.color }} />
        <div style={{ ...S.level, color: cfg.color }}>{t.found(result.breaches_found)}</div>
      </div>

      <div style={S.body}>
        {result.plain_language_summary && (
          <div style={S.section}>
            <div style={S.sectionTitle}>{t.summary}</div>
            <p style={S.summaryText}>{result.plain_language_summary}</p>
          </div>
        )}

        {result.breaches?.length > 0 && (
          <div style={S.section}>
            <div style={S.sectionTitle}>{t.breaches}</div>
            <div style={S.breachList}>
              {result.breaches.map((b, i) => (
                <div key={i} style={S.breachCard}>
                  <div style={S.breachName}>{b.name}</div>
                  <div style={S.breachDate}>{b.date}</div>
                  {b.data_classes?.length > 0 && (
                    <div style={S.dataTags}>
                      {b.data_classes.slice(0, 5).map((d, j) => (
                        <span key={j} style={S.dataTag}>{d}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {result.action_steps?.length > 0 && (
          <div style={S.section}>
            <div style={S.sectionTitle}>{t.steps}</div>
            <div style={S.stepList}>
              {result.action_steps.map((step, i) => (
                <button
                  key={i}
                  style={{ ...S.stepItem, ...(done[i] ? S.stepDone : {}) }}
                  onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                >
                  <span style={{ ...S.stepCheck, ...(done[i] ? S.stepCheckDone : {}) }}>
                    {done[i] ? "✓" : ""}
                  </span>
                  <span style={{ textDecoration: done[i] ? "line-through" : "none", color: done[i] ? "#4a4768" : "#c4b5fd" }}>
                    {step}
                  </span>
                </button>
              ))}
            </div>
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
  level: { fontSize: "16px", fontWeight: "800", letterSpacing: "0.02em" },
  cleanSub: { color: "#8b8ba7", fontSize: "13px", marginTop: "4px", fontWeight: "500" },
  body: { padding: "18px 20px", display: "flex", flexDirection: "column", gap: "18px" },
  section: {},
  sectionTitle: {
    color: "#8b8ba7", fontSize: "11px",
    fontWeight: "700", letterSpacing: "0.07em",
    textTransform: "uppercase", marginBottom: "10px",
  },
  summaryText: { color: "#c4b5fd", fontSize: "13px", lineHeight: 1.7, margin: 0, fontWeight: "500" },
  breachList: { display: "flex", flexDirection: "column", gap: "8px" },
  breachCard: {
    background: "rgba(139,92,246,0.07)",
    border: "1px solid rgba(139,92,246,0.15)",
    borderRadius: "12px", padding: "12px 14px",
  },
  breachName: { color: "#f0ecff", fontSize: "14px", fontWeight: "700", marginBottom: "2px" },
  breachDate: { color: "#4a4768", fontSize: "12px", fontWeight: "500", marginBottom: "8px" },
  dataTags: { display: "flex", flexWrap: "wrap", gap: "6px" },
  dataTag: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#fca5a5", fontSize: "11px",
    fontWeight: "600", borderRadius: "999px",
    padding: "2px 8px",
  },
  stepList: { display: "flex", flexDirection: "column", gap: "8px" },
  stepItem: {
    display: "flex", alignItems: "flex-start", gap: "10px",
    background: "rgba(139,92,246,0.06)",
    border: "1px solid rgba(139,92,246,0.12)",
    borderRadius: "12px", padding: "12px 14px",
    cursor: "pointer", textAlign: "left",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: "13px", fontWeight: "500",
    transition: "opacity 0.2s",
  },
  stepDone: { opacity: 0.45 },
  stepCheck: {
    width: "20px", height: "20px", minWidth: "20px",
    border: "2px solid rgba(139,92,246,0.3)",
    borderRadius: "50%", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontSize: "11px", color: "#fff", fontWeight: "700",
    transition: "background 0.2s",
  },
  stepCheckDone: { background: "#10b981", borderColor: "#10b981" },
};
