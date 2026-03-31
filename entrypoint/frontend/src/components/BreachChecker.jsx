import { useState } from "react";
import BreachResult from "./BreachResult";

const LABELS = {
  en: {
    placeholder: "Enter your email address",
    privacy: "Your email is checked using k-anonymity. We never store it.",
    btn: "Check my exposure",
    checking: "Checking…",
    error: "Something went wrong. Please try again.",
  },
  es: {
    placeholder: "Ingresa tu correo electrónico",
    privacy: "Tu correo se verifica con anonimato. Nunca lo almacenamos.",
    btn: "Verificar mi exposición",
    checking: "Verificando…",
    error: "Algo salió mal. Por favor intenta de nuevo.",
  },
  zh: {
    placeholder: "输入您的电子邮件地址",
    privacy: "您的电子邮件使用k-匿名性检查，我们从不存储。",
    btn: "检查我的暴露情况",
    checking: "检查中…",
    error: "出了点问题，请重试。",
  },
  vi: {
    placeholder: "Nhập địa chỉ email của bạn",
    privacy: "Email của bạn được kiểm tra bằng k-anonymity. Chúng tôi không bao giờ lưu trữ nó.",
    btn: "Kiểm tra mức độ rò rỉ",
    checking: "Đang kiểm tra…",
    error: "Đã xảy ra lỗi. Vui lòng thử lại.",
  },
  ar: {
    placeholder: "أدخل عنوان بريدك الإلكتروني",
    privacy: "يتم فحص بريدك الإلكتروني باستخدام k-anonymity. نحن لا نخزنه أبداً.",
    btn: "تحقق من تعرضي",
    checking: "جارٍ الفحص…",
    error: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
  },
  fr: {
    placeholder: "Entrez votre adresse e-mail",
    privacy: "Votre email est vérifié avec k-anonymity. Nous ne le stockons jamais.",
    btn: "Vérifier mon exposition",
    checking: "Vérification…",
    error: "Quelque chose s'est mal passé. Veuillez réessayer.",
  },
  pt: {
    placeholder: "Digite seu endereço de e-mail",
    privacy: "Seu e-mail é verificado usando k-anonymity. Nunca o armazenamos.",
    btn: "Verificar minha exposição",
    checking: "Verificando…",
    error: "Algo deu errado. Por favor, tente novamente.",
  },
  hi: {
    placeholder: "अपना ईमेल पता दर्ज करें",
    privacy: "आपका ईमेल k-anonymity का उपयोग करके जांचा जाता है। हम इसे कभी संग्रहीत नहीं करते।",
    btn: "मेरी एक्सपोज़र जांचें",
    checking: "जांच हो रही है…",
    error: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
  },
  ru: {
    placeholder: "Введите ваш адрес электронной почты",
    privacy: "Ваш email проверяется с использованием k-anonymity. Мы его никогда не храним.",
    btn: "Проверить мою уязвимость",
    checking: "Проверяется…",
    error: "Что-то пошло не так. Пожалуйста, попробуйте снова.",
  },
};

export default function BreachChecker({ language = "en" }) {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const t = LABELS[language] || LABELS.en;
  const isValid = email.includes("@") && email.includes(".");

  const check = async () => {
    if (!isValid) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/breach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Server error");
      setResult(await res.json());
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = isValid && !loading;

  return (
    <div style={S.wrap}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && canSubmit && check()}
        placeholder={t.placeholder}
        style={S.input}
      />
      <p style={S.privacy}>{t.privacy}</p>
      <button
        style={{ ...S.btn, opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? "pointer" : "not-allowed" }}
        onClick={check}
        disabled={!canSubmit}
      >
        {loading ? t.checking : t.btn}
      </button>
      {error && <p style={S.error}>{error}</p>}
      {result && <BreachResult result={result} language={language} />}
    </div>
  );
}

const S = {
  wrap: { display: "flex", flexDirection: "column", gap: "12px", fontFamily: "'Inter', system-ui, sans-serif" },
  input: {
    width: "100%", background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: "14px", padding: "14px 18px",
    color: "#f0ecff", fontSize: "15px",
    fontFamily: "'Inter', system-ui, sans-serif",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  privacy: { color: "#4a4768", fontSize: "12px", margin: 0, fontWeight: "500", lineHeight: 1.5 },
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
