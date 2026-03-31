import { useState } from "react";

const URGENCY_CONFIG = {
  immediate: { label: "Do Today",    color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)" },
  soon:      { label: "This Week",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  when_ready:{ label: "When Ready",  color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)" },
};

const URGENCY_LABELS = {
  immediate: {
    en: "Do Today", es: "Hoy", zh: "今天做", vi: "Làm ngay", ar: "اليوم", fr: "Aujourd'hui",
    pt: "Hoje", hi: "आज करें", ru: "Сегодня",
  },
  soon: {
    en: "This Week", es: "Esta semana", zh: "本周", vi: "Tuần này", ar: "هذا الأسبوع", fr: "Cette semaine",
    pt: "Esta semana", hi: "इस हफ्ते", ru: "На этой неделе",
  },
  when_ready: {
    en: "When Ready", es: "Cuando estés listo", zh: "准备好时", vi: "Khi sẵn sàng", ar: "عند الاستعداد", fr: "Quand vous êtes prêt",
    pt: "Quando estiver pronto", hi: "तैयार होने पर", ru: "Когда готовы",
  },
};

const DISCLAIMER = {
  en: "AI-generated. Always verify at uscis.gov. Not legal advice.",
  es: "Generado por IA. Verifica en uscis.gov. No es asesoramiento legal.",
  zh: "AI生成。请在uscis.gov核实。非法律建议。",
  vi: "Do AI tạo ra. Luôn xác minh tại uscis.gov. Không phải lời khuyên pháp lý.",
  ar: "مُنشأ بالذكاء الاصطناعي. تحقق دائماً على uscis.gov. ليس استشارة قانونية.",
  fr: "Généré par IA. Vérifiez sur uscis.gov. Pas un conseil juridique.",
  pt: "Gerado por IA. Verifique sempre em uscis.gov. Não é aconselhamento jurídico.",
  hi: "AI द्वारा निर्मित। हमेशा uscis.gov पर सत्यापित करें। यह कानूनी सलाह नहीं है।",
  ru: "Создано ИИ. Всегда проверяйте на uscis.gov. Не является юридической консультацией.",
};

const OFFICIAL_LINK_LABEL = {
  en: "Official resource", es: "Recurso oficial", zh: "官方资源", vi: "Tài nguyên chính thức",
  ar: "مصدر رسمي", fr: "Ressource officielle", pt: "Recurso oficial", hi: "आधिकारिक संसाधन", ru: "Официальный ресурс",
};

export default function Checklist({ steps = [], language = "en" }) {
  const [checked, setChecked] = useState({});
  const toggle = (i) => setChecked((c) => ({ ...c, [i]: !c[i] }));

  const order = ["immediate", "soon", "when_ready"];
  const sorted = [...steps].sort((a, b) => order.indexOf(a.urgency) - order.indexOf(b.urgency));

  const disclaimer = DISCLAIMER[language] || DISCLAIMER.en;
  const officialLbl = OFFICIAL_LINK_LABEL[language] || OFFICIAL_LINK_LABEL.en;

  if (!steps.length) return null;

  return (
    <div style={S.wrap}>
      <div style={S.disclaimer}>{disclaimer}</div>
      <div style={S.list}>
        {sorted.map((step, i) => {
          const cfg = URGENCY_CONFIG[step.urgency] || URGENCY_CONFIG.when_ready;
          const urgLabel = (URGENCY_LABELS[step.urgency] || {})[language] || cfg.label;
          const done = !!checked[i];
          return (
            <div key={i} style={{ ...S.item, opacity: done ? 0.5 : 1, borderColor: done ? "rgba(139,92,246,0.08)" : cfg.border }}>
              <div style={S.itemTop}>
                <span style={{ ...S.badge, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  {urgLabel}
                </span>
                <button
                  style={{ ...S.checkBtn, ...(done ? S.checkBtnDone : {}) }}
                  onClick={() => toggle(i)}
                  aria-label={done ? "Mark incomplete" : "Mark complete"}
                >
                  {done ? "✓" : ""}
                </button>
              </div>
              <h3 style={{ ...S.title, textDecoration: done ? "line-through" : "none" }}>
                {step.step_title}
              </h3>
              <p style={S.desc}>{step.description}</p>
              {step.official_link && (
                <a href={step.official_link} target="_blank" rel="noopener noreferrer" style={S.link}>
                  {officialLbl} →
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const S = {
  wrap: { width: "100%", fontFamily: "'Inter', system-ui, sans-serif" },
  disclaimer: {
    background: "rgba(245,158,11,0.08)",
    border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: "12px", padding: "12px 16px",
    color: "#fbbf24", fontSize: "12px",
    fontWeight: "500", marginBottom: "16px",
    lineHeight: 1.5, letterSpacing: "0.01em",
  },
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  item: {
    background: "rgba(20,18,40,0.8)",
    border: "1px solid",
    borderRadius: "16px", padding: "18px 20px",
    transition: "opacity 0.3s, border-color 0.3s",
  },
  itemTop: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "10px",
  },
  badge: {
    fontSize: "11px", fontWeight: "700",
    letterSpacing: "0.05em", textTransform: "uppercase",
    borderRadius: "999px", padding: "4px 10px",
  },
  checkBtn: {
    width: "26px", height: "26px",
    border: "2px solid rgba(139,92,246,0.25)",
    borderRadius: "50%", background: "transparent",
    cursor: "pointer", fontSize: "13px",
    color: "#fff", display: "flex",
    alignItems: "center", justifyContent: "center",
    transition: "background 0.2s, border-color 0.2s",
    fontWeight: "700",
  },
  checkBtnDone: { background: "#10b981", borderColor: "#10b981" },
  title: {
    color: "#f0ecff", fontSize: "15px",
    fontWeight: "600",
    margin: "0 0 6px 0", lineHeight: 1.35,
    letterSpacing: "-0.01em",
  },
  desc: { color: "#8b8ba7", fontSize: "13px", lineHeight: 1.6, margin: "0 0 10px 0" },
  link: {
    color: "#a78bfa", fontSize: "13px",
    textDecoration: "none", fontWeight: "600",
  },
};
