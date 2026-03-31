import { useState } from "react";
import ScamResult from "./ScamResult";

const LABELS = {
  en: {
    placeholder: "Paste a job offer, SMS, email, or any message you're unsure about…",
    btn: "Check this message",
    checking: "Analyzing…",
    error: "Something went wrong. Please try again.",
    hint: "Works with job offers, text messages, emails, and social media DMs.",
  },
  es: {
    placeholder: "Pega una oferta de trabajo, SMS, correo o cualquier mensaje del que no estés seguro/a…",
    btn: "Verificar este mensaje",
    checking: "Analizando…",
    error: "Algo salió mal. Por favor intenta de nuevo.",
    hint: "Funciona con ofertas de trabajo, mensajes de texto, correos y mensajes en redes sociales.",
  },
  zh: {
    placeholder: "粘贴工作邀请、短信、电子邮件或任何可疑消息…",
    btn: "检查此消息",
    checking: "分析中…",
    error: "出了点问题，请重试。",
    hint: "适用于工作邀请、短信、电子邮件和社交媒体私信。",
  },
  vi: {
    placeholder: "Dán lời mời việc làm, SMS, email hoặc tin nhắn đáng ngờ…",
    btn: "Kiểm tra tin nhắn này",
    checking: "Đang phân tích…",
    error: "Đã xảy ra lỗi. Vui lòng thử lại.",
    hint: "Hoạt động với lời mời việc làm, tin nhắn văn bản, email và DM mạng xã hội.",
  },
  ar: {
    placeholder: "الصق عرض عمل أو رسالة نصية أو بريداً إلكترونياً أو أي رسالة مشبوهة…",
    btn: "تحقق من هذه الرسالة",
    checking: "جارٍ التحليل…",
    error: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    hint: "يعمل مع عروض العمل والرسائل النصية والبريد الإلكتروني ورسائل التواصل الاجتماعي.",
  },
  fr: {
    placeholder: "Collez une offre d'emploi, SMS, e-mail ou tout message suspect…",
    btn: "Vérifier ce message",
    checking: "Analyse en cours…",
    error: "Quelque chose s'est mal passé. Veuillez réessayer.",
    hint: "Fonctionne avec les offres d'emploi, SMS, emails et messages sur les réseaux sociaux.",
  },
  pt: {
    placeholder: "Cole uma oferta de trabalho, SMS, e-mail ou qualquer mensagem suspeita…",
    btn: "Verificar esta mensagem",
    checking: "Analisando…",
    error: "Algo deu errado. Por favor, tente novamente.",
    hint: "Funciona com ofertas de trabalho, mensagens de texto, e-mails e DMs de redes sociais.",
  },
  hi: {
    placeholder: "एक नौकरी की पेशकश, SMS, ईमेल या कोई संदिग्ध संदेश पेस्ट करें…",
    btn: "इस संदेश की जांच करें",
    checking: "विश्लेषण हो रहा है…",
    error: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
    hint: "नौकरी की पेशकश, टेक्स्ट संदेश, ईमेल और सोशल मीडिया DMs के साथ काम करता है।",
  },
  ru: {
    placeholder: "Вставьте предложение о работе, SMS, электронное письмо или любое подозрительное сообщение…",
    btn: "Проверить это сообщение",
    checking: "Анализируется…",
    error: "Что-то пошло не так. Пожалуйста, попробуйте снова.",
    hint: "Работает с предложениями о работе, текстовыми сообщениями, письмами и DM в соцсетях.",
  },
};

export default function ScamChecker({ language = "en" }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const t = LABELS[language] || LABELS.en;

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/scam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Server error");
      setResult(await res.json());
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = text.trim() && !loading;

  return (
    <div style={S.wrap}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.metaKey && canSubmit && analyze()}
        placeholder={t.placeholder}
        style={S.textarea}
        rows={6}
      />
      <p style={S.hint}>{t.hint}</p>
      <button
        style={{ ...S.btn, opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? "pointer" : "not-allowed" }}
        onClick={analyze}
        disabled={!canSubmit}
      >
        {loading ? t.checking : t.btn}
      </button>
      {error && <p style={S.error}>{error}</p>}
      {result && <ScamResult result={result} language={language} />}
    </div>
  );
}

const S = {
  wrap: { display: "flex", flexDirection: "column", gap: "12px", fontFamily: "'Inter', system-ui, sans-serif" },
  textarea: {
    width: "100%", background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: "16px", padding: "16px 18px",
    color: "#f0ecff", fontSize: "14px",
    fontFamily: "'Inter', system-ui, sans-serif",
    resize: "vertical", lineHeight: 1.6,
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  hint: { color: "#4a4768", fontSize: "12px", margin: 0, fontWeight: "500" },
  btn: {
    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    color: "#fff", border: "none",
    borderRadius: "12px", padding: "13px 28px",
    fontSize: "14px", fontWeight: "700",
    cursor: "pointer", alignSelf: "flex-start",
    boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
    transition: "opacity 0.2s, transform 0.2s",
    letterSpacing: "-0.01em",
  },
  error: { color: "#f87171", fontSize: "13px", fontWeight: "500" },
};
