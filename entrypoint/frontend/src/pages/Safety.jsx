import { useState } from "react";
import Navbar from "../components/Navbar";
import ScamChecker from "../components/ScamChecker";
import BreachChecker from "../components/BreachChecker";

const SAFETY_LABELS = {
  en: {
    tag: "Digital Safety Tools",
    heading: "Protect yourself online.",
    sub: "Check suspicious messages for scams and see if your email has been exposed in a data breach.",
    scam: "Job & SMS Scanner",
    breach: "Data Breach Check",
  },
  es: {
    tag: "Herramientas de seguridad digital",
    heading: "Protégete en línea.",
    sub: "Verifica mensajes sospechosos y comprueba si tu correo estuvo en una filtración de datos.",
    scam: "Escáner de mensajes",
    breach: "Verificación de brechas",
  },
  zh: {
    tag: "数字安全工具",
    heading: "保护您的网络安全。",
    sub: "检查可疑消息是否为诈骗，并查看您的电子邮件是否在数据泄露中被暴露。",
    scam: "短信和工作诈骗扫描",
    breach: "数据泄露检查",
  },
  vi: {
    tag: "Công cụ an toàn kỹ thuật số",
    heading: "Bảo vệ bản thân trực tuyến.",
    sub: "Kiểm tra tin nhắn đáng ngờ và xem email của bạn có bị lộ không.",
    scam: "Máy quét tin nhắn",
    breach: "Kiểm tra vi phạm dữ liệu",
  },
  ar: {
    tag: "أدوات الأمان الرقمي",
    heading: "احمِ نفسك عبر الإنترنت.",
    sub: "تحقق من الرسائل المشبوهة وانظر إذا كان بريدك الإلكتروني مكشوفاً في اختراق بيانات.",
    scam: "ماسح الرسائل والعمل",
    breach: "فحص اختراق البيانات",
  },
  fr: {
    tag: "Outils de sécurité numérique",
    heading: "Protégez-vous en ligne.",
    sub: "Vérifiez les messages suspects et si votre email a été exposé dans une violation de données.",
    scam: "Scanner de messages",
    breach: "Vérification de violation",
  },
  pt: {
    tag: "Ferramentas de segurança digital",
    heading: "Proteja-se online.",
    sub: "Verifique mensagens suspeitas e veja se seu email foi exposto em uma violação de dados.",
    scam: "Scanner de mensagens",
    breach: "Verificação de violação",
  },
  hi: {
    tag: "डिजिटल सुरक्षा उपकरण",
    heading: "ऑनलाइन अपनी रक्षा करें।",
    sub: "संदिग्ध संदेशों की जांच करें और देखें कि आपका ईमेल डेटा उल्लंघन में उजागर हुआ है या नहीं।",
    scam: "संदेश स्कैनर",
    breach: "डेटा उल्लंघन जांच",
  },
  ru: {
    tag: "Инструменты цифровой безопасности",
    heading: "Защитите себя в интернете.",
    sub: "Проверьте подозрительные сообщения и узнайте, не был ли ваш email скомпрометирован.",
    scam: "Сканер сообщений",
    breach: "Проверка утечки данных",
  },
};

export default function Safety() {
  const language = localStorage.getItem("ep_lang") || "en";
  const [tab, setTab] = useState("scam");
  const t = SAFETY_LABELS[language] || SAFETY_LABELS.en;

  return (
    <div style={S.page}>
      <div style={S.blob1} />
      <div style={S.blob2} />
      <Navbar language={language} />

      <div style={S.content}>
        <div style={S.header}>
          <div style={S.tag}>{t.tag}</div>
          <h1 style={S.heading}>{t.heading}</h1>
          <p style={S.sub}>{t.sub}</p>
        </div>

        <div style={S.tabBar}>
          {[
            { id: "scam", label: t.scam },
            { id: "breach", label: t.breach },
          ].map(({ id, label }) => (
            <button
              key={id}
              style={{ ...S.tabBtn, ...(tab === id ? S.tabBtnActive : {}) }}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={S.panel}>
          {tab === "scam" && <ScamChecker language={language} />}
          {tab === "breach" && <BreachChecker language={language} />}
        </div>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: "#0c0b16",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    padding: "80px 24px 60px",
    position: "relative", overflow: "hidden",
  },
  blob1: {
    position: "fixed", borderRadius: "50%", filter: "blur(110px)", pointerEvents: "none",
    width: 440, height: 440,
    background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
    top: -80, left: -80,
  },
  blob2: {
    position: "fixed", borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none",
    width: 380, height: 380,
    background: "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)",
    bottom: -60, right: -60,
  },
  content: {
    position: "relative", zIndex: 1,
    maxWidth: "700px", margin: "0 auto",
    animation: "fadeIn 0.4s ease",
  },
  header: { textAlign: "center", marginBottom: "36px" },
  tag: {
    display: "inline-block",
    background: "rgba(139,92,246,0.12)",
    border: "1px solid rgba(139,92,246,0.3)",
    color: "#c4b5fd", borderRadius: "999px",
    padding: "6px 18px", fontSize: "12px",
    fontWeight: "600", letterSpacing: "0.05em",
    marginBottom: "16px", textTransform: "uppercase",
  },
  heading: {
    color: "#f0ecff",
    fontSize: "clamp(26px, 5vw, 40px)",
    fontWeight: "800", margin: "0 0 10px 0",
    lineHeight: 1.2, letterSpacing: "-0.025em",
  },
  sub: { color: "#8b8ba7", fontSize: "15px", lineHeight: 1.65, margin: 0 },
  tabBar: {
    display: "flex", gap: "6px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(139,92,246,0.12)",
    borderRadius: "16px", padding: "6px",
    marginBottom: "24px",
  },
  tabBtn: {
    flex: 1, border: "none",
    borderRadius: "12px", padding: "12px 16px",
    fontSize: "14px", fontWeight: "600",
    cursor: "pointer",
    background: "transparent", color: "#8b8ba7",
    transition: "background 0.2s, color 0.2s",
    letterSpacing: "-0.01em",
  },
  tabBtnActive: {
    background: "rgba(139,92,246,0.2)",
    color: "#c4b5fd",
  },
  panel: {
    background: "rgba(20,18,40,0.8)",
    border: "1px solid rgba(139,92,246,0.12)",
    borderRadius: "20px", padding: "28px",
  },
};
