import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Checklist from "../components/Checklist";
import ResourceList from "../components/ResourceList";
import NGOList from "../components/NGOList";

const LABELS = {
  en: {
    greeting: "Your personalized plan is ready.",
    sub: "Based on your answers, here are your next steps.",
    profileCard: "Your profile",
    safetyBtn: "Check My Digital Safety",
    restartBtn: "Start over",
    checklistHeading: "Your next steps",
    empty: "No steps generated. Please try again.",
  },
  es: {
    greeting: "Tu plan personalizado está listo.",
    sub: "Basado en tus respuestas, estos son tus próximos pasos.",
    profileCard: "Tu perfil",
    safetyBtn: "Revisar mi seguridad digital",
    restartBtn: "Empezar de nuevo",
    checklistHeading: "Tus próximos pasos",
    empty: "No se generaron pasos. Por favor intenta de nuevo.",
  },
  zh: {
    greeting: "您的个性化计划已准备就绪。",
    sub: "根据您的回答，以下是您的下一步。",
    profileCard: "您的档案",
    safetyBtn: "检查我的数字安全",
    restartBtn: "重新开始",
    checklistHeading: "您的下一步",
    empty: "未生成步骤。请重试。",
  },
  vi: {
    greeting: "Kế hoạch cá nhân của bạn đã sẵn sàng.",
    sub: "Dựa trên câu trả lời của bạn, đây là các bước tiếp theo.",
    profileCard: "Hồ sơ của bạn",
    safetyBtn: "Kiểm tra an toàn kỹ thuật số",
    restartBtn: "Bắt đầu lại",
    checklistHeading: "Các bước tiếp theo của bạn",
    empty: "Không có bước nào được tạo. Vui lòng thử lại.",
  },
  ar: {
    greeting: "خطتك المخصصة جاهزة.",
    sub: "بناءً على إجاباتك، إليك خطواتك التالية.",
    profileCard: "ملفك الشخصي",
    safetyBtn: "تحقق من أماني الرقمي",
    restartBtn: "ابدأ من جديد",
    checklistHeading: "خطواتك التالية",
    empty: "لم تُنشأ خطوات. يرجى المحاولة مرة أخرى.",
  },
  fr: {
    greeting: "Votre plan personnalisé est prêt.",
    sub: "Basé sur vos réponses, voici vos prochaines étapes.",
    profileCard: "Votre profil",
    safetyBtn: "Vérifier ma sécurité numérique",
    restartBtn: "Recommencer",
    checklistHeading: "Vos prochaines étapes",
    empty: "Aucune étape générée. Veuillez réessayer.",
  },
  pt: {
    greeting: "Seu plano personalizado está pronto.",
    sub: "Com base nas suas respostas, aqui estão seus próximos passos.",
    profileCard: "Seu perfil",
    safetyBtn: "Verificar minha segurança digital",
    restartBtn: "Recomeçar",
    checklistHeading: "Seus próximos passos",
    empty: "Nenhuma etapa gerada. Por favor, tente novamente.",
  },
  hi: {
    greeting: "आपकी व्यक्तिगत योजना तैयार है।",
    sub: "आपके उत्तरों के आधार पर, यहां आपके अगले कदम हैं।",
    profileCard: "आपका प्रोफ़ाइल",
    safetyBtn: "मेरी डिजिटल सुरक्षा जांचें",
    restartBtn: "फिर से शुरू करें",
    checklistHeading: "आपके अगले कदम",
    empty: "कोई कदम नहीं बनाया गया। कृपया पुनः प्रयास करें।",
  },
  ru: {
    greeting: "Ваш персональный план готов.",
    sub: "На основе ваших ответов — ваши следующие шаги.",
    profileCard: "Ваш профиль",
    safetyBtn: "Проверить мою цифровую безопасность",
    restartBtn: "Начать заново",
    checklistHeading: "Ваши следующие шаги",
    empty: "Шаги не созданы. Пожалуйста, попробуйте снова.",
  },
  ko: {
    greeting: "맞춤형 계획이 준비되었습니다.",
    sub: "답변을 기반으로 다음 단계를 알려드립니다.",
    profileCard: "내 프로필",
    safetyBtn: "디지털 안전 확인",
    restartBtn: "다시 시작",
    checklistHeading: "다음 단계",
    empty: "생성된 단계가 없습니다. 다시 시도하세요.",
  },
  tl: {
    greeting: "Handa na ang iyong personalized na plano.",
    sub: "Batay sa iyong mga sagot, narito ang iyong mga susunod na hakbang.",
    profileCard: "Ang iyong profile",
    safetyBtn: "Suriin ang aking digital na kaligtasan",
    restartBtn: "Magsimulang muli",
    checklistHeading: "Ang iyong mga susunod na hakbang",
    empty: "Walang nabuong mga hakbang. Pakisubukan muli.",
  },
  uk: {
    greeting: "Ваш персональний план готовий.",
    sub: "На основі ваших відповідей — ваші наступні кроки.",
    profileCard: "Ваш профіль",
    safetyBtn: "Перевірити мою цифрову безпеку",
    restartBtn: "Почати заново",
    checklistHeading: "Ваші наступні кроки",
    empty: "Кроки не створено. Будь ласка, спробуйте знову.",
  },
  ht: {
    greeting: "Plan pèsonèl ou a prèt.",
    sub: "Baze sou repons ou yo, men pwochen etap ou yo.",
    profileCard: "Pwofil ou",
    safetyBtn: "Tcheke sekirite dijital mwen",
    restartBtn: "Rekòmanse",
    checklistHeading: "Pwochen etap ou yo",
    empty: "Pa gen etap jenere. Tanpri eseye ankò.",
  },
  am: {
    greeting: "የእርስዎ ግላዊ እቅድ ዝግጁ ነው።",
    sub: "በመልሶችዎ መሰረት፣ እነዚህ ቀጣይ እርምጃዎችዎ ናቸው።",
    profileCard: "የእርስዎ መገለጫ",
    safetyBtn: "የዲጂታል ደህንነቴን ያረጋግጡ",
    restartBtn: "እንደገና ጀምር",
    checklistHeading: "ቀጣይ እርምጃዎችዎ",
    empty: "ምንም እርምጃ አልተፈጠረም። እባክዎ እንደገና ሞክሩ።",
  },
  so: {
    greeting: "Qorshahaaaga shakhsi ahaaneed waa diyaar.",
    sub: "Ku saleysan jawaabahaaga, kuwan waa tallaabadaada xigta.",
    profileCard: "Astaamahaaga",
    safetyBtn: "Hubi amnigayga dijital",
    restartBtn: "Dib u bilow",
    checklistHeading: "Tallaabadaada xigta",
    empty: "Lama sameyn tallaabo. Fadlan isku day mar kale.",
  },
};

const URGENCY_LABELS = {
  en: { crisis: "Immediate crisis", urgent: "Urgent", soon: "Within weeks", planning: "Planning ahead" },
  es: { crisis: "Crisis inmediata", urgent: "Urgente", soon: "Próximas semanas", planning: "Planificando" },
  zh: { crisis: "紧急危机", urgent: "紧迫", soon: "几周内", planning: "提前规划" },
  vi: { crisis: "Khủng hoảng ngay", urgent: "Khẩn cấp", soon: "Trong vài tuần", planning: "Lên kế hoạch" },
  ar: { crisis: "أزمة فورية", urgent: "عاجل", soon: "خلال أسابيع", planning: "تخطيط مسبق" },
  fr: { crisis: "Crise immédiate", urgent: "Urgent", soon: "Dans les semaines", planning: "Planification" },
  pt: { crisis: "Crise imediata", urgent: "Urgente", soon: "Em semanas", planning: "Planejando" },
  hi: { crisis: "तत्काल संकट", urgent: "जरूरी", soon: "कुछ हफ्तों में", planning: "योजना" },
  ru: { crisis: "Немедленный кризис", urgent: "Срочно", soon: "В ближайшие недели", planning: "Планирую" },
};

export default function Dashboard() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state?.profile) navigate("/onboarding");
  }, [state, navigate]);

  if (!state?.profile) return null;

  const { profile, checklist = [], resources = [], ngos = [] } = state;
  const language = profile.language || localStorage.getItem("ep_lang") || "en";
  const t = LABELS[language] || LABELS.en;
  const urgMap = URGENCY_LABELS[language] || URGENCY_LABELS.en;

  return (
    <div style={S.page}>
      <div style={S.blob1} />
      <div style={S.blob2} />
      <Navbar language={language} />

      <div style={S.content}>
        <div style={S.header}>
          <div style={S.headerBadge}>{t.profileCard}</div>
          <h1 style={S.heading}>{t.greeting}</h1>
          <p style={S.sub}>{t.sub}</p>
        </div>

        <div style={S.profileRow}>
          {profile.state && <span style={S.pill}>{profile.state}</span>}
          {profile.visa_type && <span style={S.pill}>{profile.visa_type}</span>}
          {profile.urgency && (
            <span style={{ ...S.pill, ...S.urgencyPill }}>
              {urgMap[profile.urgency] || profile.urgency}
            </span>
          )}
        </div>

        <div style={S.divider} />

        <section style={S.section}>
          <h2 style={S.sectionHeading}>{t.checklistHeading}</h2>
          {checklist.length > 0
            ? <Checklist steps={checklist} language={language} />
            : <p style={S.empty}>{t.empty}</p>
          }
        </section>

        {resources.length > 0 && (
          <section style={S.section}>
            <ResourceList resources={resources} language={language} />
          </section>
        )}

        {ngos.length > 0 && (
          <section style={S.section}>
            <NGOList ngos={ngos} language={language} />
          </section>
        )}

        <div style={S.actions}>
          <button
            style={S.btnPrimary}
            onClick={() => navigate("/safety")}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(139,92,246,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(139,92,246,0.3)"; }}
          >
            {t.safetyBtn}
          </button>
          <button style={S.btnSecondary} onClick={() => navigate("/onboarding")}>
            {t.restartBtn}
          </button>
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
    position: "relative",
  },
  blob1: {
    position: "fixed", borderRadius: "50%", filter: "blur(110px)", pointerEvents: "none",
    width: 500, height: 500,
    background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",
    top: -80, left: -80, zIndex: 0,
  },
  blob2: {
    position: "fixed", borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none",
    width: 400, height: 400,
    background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
    bottom: -60, right: -60, zIndex: 0,
  },
  content: {
    position: "relative", zIndex: 1,
    maxWidth: "740px", margin: "0 auto",
    display: "flex", flexDirection: "column", gap: "0",
    animation: "fadeIn 0.4s ease",
  },
  header: { marginBottom: "20px" },
  headerBadge: {
    display: "inline-block",
    background: "rgba(139,92,246,0.12)",
    border: "1px solid rgba(139,92,246,0.25)",
    color: "#c4b5fd", borderRadius: "999px",
    padding: "4px 14px", fontSize: "12px",
    fontWeight: "600", letterSpacing: "0.04em",
    marginBottom: "14px",
  },
  heading: {
    color: "#f0ecff",
    fontSize: "clamp(22px, 4vw, 34px)",
    fontWeight: "800", margin: "0 0 8px 0",
    lineHeight: 1.2, letterSpacing: "-0.02em",
  },
  sub: { color: "#8b8ba7", fontSize: "15px", margin: 0, lineHeight: 1.6 },
  profileRow: {
    display: "flex", flexWrap: "wrap",
    gap: "8px", alignItems: "center",
    marginBottom: "28px",
  },
  pill: {
    background: "rgba(139,92,246,0.1)",
    border: "1px solid rgba(139,92,246,0.25)",
    color: "#c4b5fd", fontSize: "12px",
    borderRadius: "999px", padding: "5px 14px",
    fontWeight: "500",
  },
  urgencyPill: {
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.25)",
    color: "#fbbf24",
  },
  divider: {
    height: "1px",
    background: "rgba(139,92,246,0.12)",
    marginBottom: "36px",
  },
  section: { marginBottom: "44px" },
  sectionHeading: {
    color: "#f0ecff", fontSize: "20px",
    fontWeight: "700", margin: "0 0 18px 0",
    letterSpacing: "-0.01em",
  },
  empty: { color: "#4a4768", fontSize: "15px" },
  actions: {
    display: "flex", gap: "12px",
    flexWrap: "wrap", marginTop: "8px",
    paddingTop: "28px",
    borderTop: "1px solid rgba(139,92,246,0.1)",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    color: "#fff", border: "none",
    borderRadius: "12px", padding: "14px 28px",
    fontSize: "15px", fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
    transition: "transform 0.2s, box-shadow 0.2s",
    letterSpacing: "-0.01em",
  },
  btnSecondary: {
    background: "transparent",
    color: "#8b8ba7",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px", padding: "14px 28px",
    fontSize: "15px", fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s, border-color 0.2s",
  },
};
