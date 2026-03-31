const HEADINGS = {
  en: "Free resources for you",
  es: "Recursos gratuitos para ti",
  zh: "为您提供的免费资源",
  vi: "Tài nguyên miễn phí cho bạn",
  ar: "موارد مجانية لك",
  fr: "Ressources gratuites pour vous",
  pt: "Recursos gratuitos para você",
  hi: "आपके लिए मुफ्त संसाधन",
  ru: "Бесплатные ресурсы для вас",
  ko: "무료 리소스",
  tl: "Libreng mga mapagkukunan para sa iyo",
  uk: "Безкоштовні ресурси для вас",
  ht: "Resous gratis pou ou",
  am: "ለእርስዎ ነፃ ሀብቶች",
  so: "Kheyraadka bilaashka ah ee kuu ah",
};

const VISIT_LABEL = {
  en: "Visit resource",
  es: "Visitar recurso",
  zh: "访问资源",
  vi: "Truy cập tài nguyên",
  ar: "زيارة المورد",
  fr: "Visiter la ressource",
  pt: "Visitar recurso",
  hi: "संसाधन देखें",
  ru: "Посетить ресурс",
};

export default function ResourceList({ resources = [], language = "en" }) {
  if (!resources.length) return null;

  const heading = HEADINGS[language] || HEADINGS.en;
  const visitLbl = VISIT_LABEL[language] || VISIT_LABEL.en;

  return (
    <div style={S.wrap}>
      <h3 style={S.heading}>{heading}</h3>
      <div style={S.grid}>
        {resources.map((r, i) => (
          <div key={i} style={S.card}>
            <div style={S.cardTop}>
              <span style={S.type}>{r.resource_type}</span>
              <span style={S.freeBadge}>FREE</span>
            </div>
            <p style={S.why}>{r.why_it_matters}</p>
            {r.official_link && (
              <a
                href={r.official_link}
                target="_blank"
                rel="noopener noreferrer"
                style={S.link}
              >
                {visitLbl} →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const S = {
  wrap: { width: "100%", fontFamily: "'Inter', system-ui, sans-serif" },
  heading: {
    color: "#f0ecff", fontSize: "18px",
    fontWeight: "700", margin: "0 0 16px 0",
    letterSpacing: "-0.01em",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "10px",
  },
  card: {
    background: "rgba(20,18,40,0.8)",
    border: "1px solid rgba(139,92,246,0.15)",
    borderRadius: "16px", padding: "18px 20px",
    display: "flex", flexDirection: "column", gap: "8px",
    transition: "border-color 0.2s",
  },
  cardTop: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center",
  },
  type: {
    color: "#c4b5fd", fontSize: "14px",
    fontWeight: "600",
  },
  freeBadge: {
    background: "rgba(16,185,129,0.12)",
    border: "1px solid rgba(16,185,129,0.28)",
    color: "#34d399", fontSize: "10px",
    fontWeight: "700", letterSpacing: "0.07em",
    borderRadius: "999px", padding: "2px 8px",
  },
  why: {
    color: "#8b8ba7", fontSize: "13px",
    lineHeight: 1.6, margin: 0, flex: 1,
    fontWeight: "400",
  },
  link: {
    color: "#a78bfa", fontSize: "13px",
    textDecoration: "none", fontWeight: "600",
    marginTop: "4px",
  },
};
