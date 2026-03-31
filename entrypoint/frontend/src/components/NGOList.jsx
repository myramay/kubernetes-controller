const HEADINGS = {
  en: "Organizations that can help you",
  es: "Organizaciones que pueden ayudarte",
  zh: "可以帮助您的组织",
  vi: "Các tổ chức có thể giúp bạn",
  ar: "منظمات يمكنها مساعدتك",
  fr: "Organisations qui peuvent vous aider",
  pt: "Organizações que podem ajudar você",
  hi: "संगठन जो आपकी मदद कर सकते हैं",
  ru: "Организации, которые могут вам помочь",
  ko: "도움을 줄 수 있는 기관",
  tl: "Mga organisasyong makakatulong sa iyo",
  uk: "Організації, які можуть вам допомогти",
  ht: "Òganizasyon ki ka ede ou",
  am: "የሚረዱዎ ድርጅቶች",
  so: "Hay'adaha kaa caawin kara",
};

const PHONE_LABEL = {
  en: "Phone", es: "Teléfono", zh: "电话", vi: "Điện thoại",
  ar: "هاتف", fr: "Téléphone", pt: "Telefone", hi: "फ़ोन", ru: "Телефон",
};

const LANG_LABEL = {
  en: "Languages", es: "Idiomas", zh: "语言", vi: "Ngôn ngữ",
  ar: "اللغات", fr: "Langues", pt: "Idiomas", hi: "भाषाएं", ru: "Языки",
};

const WEBSITE_LABEL = {
  en: "Website", es: "Sitio web", zh: "网站", vi: "Trang web",
  ar: "الموقع الإلكتروني", fr: "Site web", pt: "Site", hi: "वेबसाइट", ru: "Сайт",
};

export default function NGOList({ ngos = [], language = "en" }) {
  if (!ngos.length) return null;

  const heading = HEADINGS[language] || HEADINGS.en;
  const phoneLbl = PHONE_LABEL[language] || PHONE_LABEL.en;
  const langLbl = LANG_LABEL[language] || LANG_LABEL.en;
  const websiteLbl = WEBSITE_LABEL[language] || WEBSITE_LABEL.en;

  return (
    <div style={S.wrap}>
      <h3 style={S.heading}>{heading}</h3>
      <div style={S.list}>
        {ngos.map((ngo, i) => (
          <div key={i} style={S.card}>
            <div style={S.cardHeader}>
              <span style={S.name}>{ngo.name}</span>
              {ngo.languages?.length > 0 && (
                <span style={S.langs}>
                  {langLbl}: {ngo.languages.join(", ")}
                </span>
              )}
            </div>
            <p style={S.reason}>{ngo.reason}</p>
            <div style={S.cardFooter}>
              {ngo.phone && (
                <a href={`tel:${ngo.phone}`} style={S.phone}>
                  {phoneLbl}: {ngo.phone}
                </a>
              )}
              {ngo.website && (
                <a href={ngo.website} target="_blank" rel="noopener noreferrer" style={S.website}>
                  {websiteLbl} →
                </a>
              )}
            </div>
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
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  card: {
    background: "rgba(20,18,40,0.8)",
    border: "1px solid rgba(139,92,246,0.15)",
    borderRadius: "16px", padding: "18px 20px",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", gap: "12px",
    marginBottom: "8px", flexWrap: "wrap",
  },
  name: {
    color: "#f0ecff", fontSize: "15px",
    fontWeight: "700", letterSpacing: "-0.01em",
  },
  langs: {
    color: "#4a4768", fontSize: "11px",
    fontWeight: "600",
    background: "rgba(139,92,246,0.08)",
    border: "1px solid rgba(139,92,246,0.15)",
    borderRadius: "999px", padding: "3px 10px",
    whiteSpace: "nowrap",
  },
  reason: {
    color: "#8b8ba7", fontSize: "13px",
    lineHeight: 1.6, margin: "0 0 12px 0",
    fontWeight: "400",
  },
  cardFooter: { display: "flex", gap: "16px", flexWrap: "wrap" },
  phone: {
    color: "#34d399", fontSize: "13px",
    textDecoration: "none", fontWeight: "600",
  },
  website: {
    color: "#a78bfa", fontSize: "13px",
    textDecoration: "none", fontWeight: "600",
  },
};
