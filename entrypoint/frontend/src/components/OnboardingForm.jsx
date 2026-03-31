import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── Full translations (all UI + all option labels) ───────────────────────────
const T = {
  en: {
    stepOf: (n, t) => `Step ${n} of ${t}`,
    back: "← Back", continue: "Continue →", confirm: "This looks right →",
    edit: "Edit my answers", loading: "Building your personalized plan…",
    steps: [
      { question: "Where are you now?", sub: "Select the US state where you're currently located." },
      { question: "Which best describes your current situation?", sub: "Choose the option that feels closest — you can always update this later." },
      { question: "What is your main goal right now?", sub: "We'll focus your plan around this." },
      { question: "How urgent is this?", sub: "This helps us prioritize your next steps." },
      { question: "Do you have any of these documents?", sub: "Select all that apply. This helps us tailor your checklist." },
      { question: "Do you already have support?", sub: "A caseworker, immigration lawyer, or sponsor." },
    ],
    situations: [
      { value: "student", label: "Student (F-1 visa)" },
      { value: "work_visa", label: "Work visa (H-1B, L-1, O-1, etc.)" },
      { value: "asylum", label: "Seeking asylum or refugee status" },
      { value: "undocumented", label: "Undocumented / not sure of my status" },
      { value: "permanent_resident", label: "Permanent resident (Green Card)" },
      { value: "citizen_helping", label: "US citizen — helping a family member" },
      { value: "applying_for_other", label: "I'm applying or searching for someone else" },
      { value: "unaccompanied_minor", label: "Unaccompanied minor (under 18, no parent/guardian)" },
      { value: "mixed_status", label: "Mixed-status family (different statuses in same household)" },
      { value: "prefer_not_say", label: "I'd rather not say" },
    ],
    goals: [
      { value: "documents", label: "Get my documents in order" },
      { value: "work", label: "Find work or understand my work rights" },
      { value: "housing", label: "Find housing or shelter" },
      { value: "healthcare", label: "Get healthcare" },
      { value: "legal", label: "Connect with legal help" },
      { value: "rights", label: "Understand my rights" },
      { value: "safety", label: "Stay safe online" },
      { value: "family", label: "Support a family member" },
      { value: "unsure", label: "I'm not sure yet" },
    ],
    urgencies: [
      { value: "crisis", label: "I need help immediately", sub: "I'm in a crisis or unsafe situation" },
      { value: "urgent", label: "This is pressing", sub: "I need help within the next few days" },
      { value: "soon", label: "Within a few weeks", sub: "Important but not an emergency" },
      { value: "planning", label: "I'm planning ahead", sub: "No immediate rush" },
    ],
    documents: [
      { value: "passport", label: "Passport", tip: "An official travel document issued by your home country. Has your photo and a unique number." },
      { value: "national_id", label: "National ID / Government ID", tip: "A government-issued ID from your home country — driver's license, cedula, national card, etc." },
      { value: "visa", label: "Visa", tip: "A stamp or sticker in your passport (or electronic authorization) that lets you enter the US legally." },
      { value: "asylum_papers", label: "Asylum papers / I-589", tip: "Documents showing you have applied for or been granted protection in the US. Includes form I-589 or I-94." },
      { value: "green_card", label: "Green Card (I-551)", tip: "Permanent Resident Card — proof that you can live and work in the US permanently." },
      { value: "ead", label: "Work Permit (EAD Card)", tip: "Employment Authorization Document — allows you to legally work in the US." },
      { value: "none", label: "None of the above", tip: "" },
      { value: "prefer_not_say", label: "I'd rather not say", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "Yes — I have a caseworker" },
      { value: "lawyer", label: "Yes — I have an immigration lawyer" },
      { value: "sponsor", label: "Yes — I have a sponsor" },
      { value: "none", label: "No — I'm navigating this alone" },
      { value: "helping_other", label: "I'm helping someone else navigate this" },
    ],
    summaryTitle: "Here's what we understand about your situation.",
    summarySubtitle: "Take a moment to review — you can edit anything before we build your plan.",
    summaryLabels: { state: "Location", situation: "Situation", goal: "Main goal", urgency: "Urgency", documents: "Documents", support: "Support" },
    crisisHeading: "You're not alone.",
    crisisBody: "If you are in immediate danger, please call 911. For immigration crisis support:",
    crisisLinks: [
      { label: "RAICES Emergency Hotline", href: "https://www.raicestexas.org" },
      { label: "National Domestic Violence Hotline: 1-800-799-7233", href: "https://www.thehotline.org" },
      { label: "IRC Crisis Support", href: "https://www.rescue.org" },
    ],
    crisisContinue: "Continue to build my plan anyway",
  },

  es: {
    stepOf: (n, t) => `Paso ${n} de ${t}`,
    back: "← Atrás", continue: "Continuar →", confirm: "Esto es correcto →",
    edit: "Editar mis respuestas", loading: "Construyendo tu plan personalizado…",
    steps: [
      { question: "¿Dónde estás ahora?", sub: "Selecciona el estado donde te encuentras." },
      { question: "¿Cuál describe mejor tu situación actual?", sub: "Elige la opción más cercana — puedes actualizarla después." },
      { question: "¿Cuál es tu objetivo principal ahora mismo?", sub: "Enfocaremos tu plan en esto." },
      { question: "¿Qué tan urgente es esto?", sub: "Esto nos ayuda a priorizar tus próximos pasos." },
      { question: "¿Tienes alguno de estos documentos?", sub: "Selecciona todos los que apliquen." },
      { question: "¿Ya tienes apoyo?", sub: "Un trabajador social, abogado de inmigración o patrocinador." },
    ],
    situations: [
      { value: "student", label: "Estudiante (visa F-1)" },
      { value: "work_visa", label: "Visa de trabajo (H-1B, L-1, O-1, etc.)" },
      { value: "asylum", label: "Solicitando asilo o estatus de refugiado" },
      { value: "undocumented", label: "Sin documentos / no sé cuál es mi estatus" },
      { value: "permanent_resident", label: "Residente permanente (Tarjeta verde)" },
      { value: "citizen_helping", label: "Ciudadano/a de EE.UU. — ayudando a un familiar" },
      { value: "applying_for_other", label: "Estoy gestionando esto para otra persona" },
      { value: "unaccompanied_minor", label: "Menor no acompañado/a (menor de 18 años)" },
      { value: "mixed_status", label: "Familia de estatus mixto" },
      { value: "prefer_not_say", label: "Prefiero no decirlo" },
    ],
    goals: [
      { value: "documents", label: "Organizar mis documentos" },
      { value: "work", label: "Encontrar trabajo o conocer mis derechos laborales" },
      { value: "housing", label: "Encontrar vivienda o refugio" },
      { value: "healthcare", label: "Acceder a atención médica" },
      { value: "legal", label: "Conectarme con ayuda legal" },
      { value: "rights", label: "Conocer mis derechos" },
      { value: "safety", label: "Estar seguro/a en línea" },
      { value: "family", label: "Apoyar a un familiar" },
      { value: "unsure", label: "Aún no estoy seguro/a" },
    ],
    urgencies: [
      { value: "crisis", label: "Necesito ayuda ahora mismo", sub: "Estoy en una situación de crisis o insegura" },
      { value: "urgent", label: "Es urgente", sub: "Necesito ayuda en los próximos días" },
      { value: "soon", label: "En las próximas semanas", sub: "Importante pero no una emergencia" },
      { value: "planning", label: "Estoy planeando con anticipación", sub: "Sin urgencia inmediata" },
    ],
    documents: [
      { value: "passport", label: "Pasaporte", tip: "Documento oficial de viaje emitido por tu país. Tiene tu foto y un número único." },
      { value: "national_id", label: "Documento de identidad nacional", tip: "Identificación gubernamental de tu país — licencia, cédula, etc." },
      { value: "visa", label: "Visa", tip: "Sello o autorización que permite tu ingreso legal a EE.UU." },
      { value: "asylum_papers", label: "Documentos de asilo / I-589", tip: "Documentos que muestran que has solicitado o recibido protección en EE.UU." },
      { value: "green_card", label: "Tarjeta verde (I-551)", tip: "Prueba de residencia permanente en EE.UU." },
      { value: "ead", label: "Permiso de trabajo (Tarjeta EAD)", tip: "Documento de Autorización de Empleo — te permite trabajar legalmente." },
      { value: "none", label: "Ninguno de los anteriores", tip: "" },
      { value: "prefer_not_say", label: "Prefiero no decirlo", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "Sí — tengo un trabajador/a social" },
      { value: "lawyer", label: "Sí — tengo un abogado/a de inmigración" },
      { value: "sponsor", label: "Sí — tengo un patrocinador/a" },
      { value: "none", label: "No — estoy navegando esto solo/a" },
      { value: "helping_other", label: "Estoy ayudando a otra persona" },
    ],
    summaryTitle: "Esto es lo que entendemos sobre tu situación.",
    summarySubtitle: "Revisa tus respuestas — puedes editar cualquier cosa antes de continuar.",
    summaryLabels: { state: "Ubicación", situation: "Situación", goal: "Objetivo principal", urgency: "Urgencia", documents: "Documentos", support: "Apoyo" },
    crisisHeading: "No estás solo/a.",
    crisisBody: "Si estás en peligro inmediato, llama al 911. Para apoyo de crisis de inmigración:",
    crisisLinks: [
      { label: "Línea de emergencia RAICES", href: "https://www.raicestexas.org" },
      { label: "Línea Nacional contra la Violencia Doméstica: 1-800-799-7233", href: "https://www.thehotline.org" },
      { label: "Apoyo de crisis IRC", href: "https://www.rescue.org" },
    ],
    crisisContinue: "Continuar y construir mi plan de todas formas",
  },

  zh: {
    stepOf: (n, t) => `第 ${n} 步，共 ${t} 步`,
    back: "← 返回", continue: "继续 →", confirm: "这是正确的 →",
    edit: "编辑我的答案", loading: "正在生成您的个性化计划……",
    steps: [
      { question: "您现在在哪里？", sub: "请选择您目前所在的美国州。" },
      { question: "哪个选项最能描述您的现状？", sub: "请选择最接近的选项——您可以随时更新。" },
      { question: "您目前的主要目标是什么？", sub: "我们将围绕此目标制定您的计划。" },
      { question: "这有多紧急？", sub: "这有助于我们确定您下一步的优先级。" },
      { question: "您有以下哪些证件？", sub: "请选择所有适用项。" },
      { question: "您已有支持人员了吗？", sub: "移民事务工作人员、律师或担保人。" },
    ],
    situations: [
      { value: "student", label: "学生（F-1签证）" },
      { value: "work_visa", label: "工作签证（H-1B、L-1、O-1等）" },
      { value: "asylum", label: "申请庇护或难民身份" },
      { value: "undocumented", label: "无证件 / 不确定自己的身份" },
      { value: "permanent_resident", label: "永久居民（绿卡）" },
      { value: "citizen_helping", label: "美国公民——协助家庭成员" },
      { value: "applying_for_other", label: "我在替他人申请或查询" },
      { value: "unaccompanied_minor", label: "无人陪伴的未成年人（18岁以下）" },
      { value: "mixed_status", label: "混合移民身份家庭" },
      { value: "prefer_not_say", label: "不愿透露" },
    ],
    goals: [
      { value: "documents", label: "整理证件" },
      { value: "work", label: "寻找工作或了解劳动权利" },
      { value: "housing", label: "寻找住房或庇护所" },
      { value: "healthcare", label: "获得医疗服务" },
      { value: "legal", label: "联系法律援助" },
      { value: "rights", label: "了解我的权利" },
      { value: "safety", label: "网络安全防护" },
      { value: "family", label: "支持家庭成员" },
      { value: "unsure", label: "暂时不确定" },
    ],
    urgencies: [
      { value: "crisis", label: "我需要立即帮助", sub: "我正处于危机或不安全的情况" },
      { value: "urgent", label: "情况紧迫", sub: "我需要在几天内获得帮助" },
      { value: "soon", label: "几周内", sub: "重要但不是紧急情况" },
      { value: "planning", label: "我在提前规划", sub: "暂无紧急情况" },
    ],
    documents: [
      { value: "passport", label: "护照", tip: "您本国政府签发的官方旅行证件，含照片和唯一编号。" },
      { value: "national_id", label: "国家身份证", tip: "本国政府颁发的身份证件。" },
      { value: "visa", label: "签证", tip: "允许您合法入境美国的印章或电子授权。" },
      { value: "asylum_papers", label: "庇护文件 / I-589", tip: "证明您已在美国申请或获得保护的文件。" },
      { value: "green_card", label: "绿卡（I-551）", tip: "永久居民卡——证明您可在美国永久生活和工作。" },
      { value: "ead", label: "工作许可证（EAD卡）", tip: "就业授权文件——允许您在美国合法工作。" },
      { value: "none", label: "以上均无", tip: "" },
      { value: "prefer_not_say", label: "不愿透露", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "是——我有个案工作人员" },
      { value: "lawyer", label: "是——我有移民律师" },
      { value: "sponsor", label: "是——我有担保人" },
      { value: "none", label: "不——我在独自应对" },
      { value: "helping_other", label: "我在替他人处理这些事务" },
    ],
    summaryTitle: "以下是我们对您情况的了解。",
    summarySubtitle: "请核查您的答案——在制定计划前，您可以编辑任何内容。",
    summaryLabels: { state: "位置", situation: "情况", goal: "主要目标", urgency: "紧迫程度", documents: "证件", support: "支持" },
    crisisHeading: "您并不孤单。",
    crisisBody: "如果您身处即时危险，请拨打911。移民危机支持：",
    crisisLinks: [{ label: "RAICES 紧急热线", href: "https://www.raicestexas.org" }, { label: "IRC 危机支持", href: "https://www.rescue.org" }],
    crisisContinue: "继续制定我的计划",
  },

  vi: {
    stepOf: (n, t) => `Bước ${n} / ${t}`,
    back: "← Quay lại", continue: "Tiếp tục →", confirm: "Thông tin đúng →",
    edit: "Chỉnh sửa câu trả lời", loading: "Đang xây dựng kế hoạch cá nhân hóa cho bạn…",
    steps: [
      { question: "Bạn đang ở đâu?", sub: "Chọn tiểu bang bạn đang sinh sống." },
      { question: "Điều nào mô tả đúng nhất tình huống của bạn?", sub: "Chọn tùy chọn gần nhất — bạn có thể cập nhật sau." },
      { question: "Mục tiêu chính của bạn hiện tại là gì?", sub: "Chúng tôi sẽ xây dựng kế hoạch xoay quanh điều này." },
      { question: "Việc này khẩn cấp đến mức nào?", sub: "Giúp chúng tôi ưu tiên các bước tiếp theo." },
      { question: "Bạn có những giấy tờ nào?", sub: "Chọn tất cả những gì áp dụng." },
      { question: "Bạn đã có ai hỗ trợ chưa?", sub: "Nhân viên xã hội, luật sư di trú hoặc người bảo trợ." },
    ],
    situations: [
      { value: "student", label: "Sinh viên (visa F-1)" },
      { value: "work_visa", label: "Visa công việc (H-1B, L-1, O-1, v.v.)" },
      { value: "asylum", label: "Đang xin tị nạn hoặc quy chế tị nạn" },
      { value: "undocumented", label: "Không có giấy tờ / không chắc về tình trạng của mình" },
      { value: "permanent_resident", label: "Thường trú nhân (Thẻ xanh)" },
      { value: "citizen_helping", label: "Công dân Hoa Kỳ — giúp đỡ thành viên gia đình" },
      { value: "applying_for_other", label: "Tôi đang xin hoặc tìm kiếm thay cho người khác" },
      { value: "unaccompanied_minor", label: "Trẻ vị thành niên không có người đi kèm (dưới 18 tuổi)" },
      { value: "mixed_status", label: "Gia đình có nhiều tình trạng di trú khác nhau" },
      { value: "prefer_not_say", label: "Tôi không muốn nói" },
    ],
    goals: [
      { value: "documents", label: "Sắp xếp giấy tờ" },
      { value: "work", label: "Tìm việc làm hoặc hiểu quyền lao động" },
      { value: "housing", label: "Tìm nhà ở hoặc nơi trú ẩn" },
      { value: "healthcare", label: "Tiếp cận dịch vụ y tế" },
      { value: "legal", label: "Kết nối với hỗ trợ pháp lý" },
      { value: "rights", label: "Hiểu các quyền của mình" },
      { value: "safety", label: "An toàn trực tuyến" },
      { value: "family", label: "Hỗ trợ thành viên gia đình" },
      { value: "unsure", label: "Tôi chưa chắc" },
    ],
    urgencies: [
      { value: "crisis", label: "Tôi cần giúp đỡ ngay bây giờ", sub: "Tôi đang trong tình huống khủng hoảng" },
      { value: "urgent", label: "Rất khẩn cấp", sub: "Tôi cần giúp đỡ trong vài ngày tới" },
      { value: "soon", label: "Trong vài tuần", sub: "Quan trọng nhưng không khẩn cấp" },
      { value: "planning", label: "Tôi đang lên kế hoạch trước", sub: "Chưa khẩn cấp" },
    ],
    documents: [
      { value: "passport", label: "Hộ chiếu", tip: "Giấy tờ du lịch chính thức do nước bạn cấp." },
      { value: "national_id", label: "Chứng minh nhân dân / CCCD", tip: "Giấy tờ tùy thân do chính phủ nước bạn cấp." },
      { value: "visa", label: "Visa", tip: "Tem hoặc ủy quyền điện tử cho phép bạn nhập cảnh Hoa Kỳ hợp pháp." },
      { value: "asylum_papers", label: "Giấy tờ xin tị nạn / I-589", tip: "Tài liệu chứng minh bạn đã nộp đơn hoặc được bảo vệ tại Mỹ." },
      { value: "green_card", label: "Thẻ xanh (I-551)", tip: "Thẻ thường trú nhân — chứng minh bạn có thể sống và làm việc tại Mỹ vĩnh viễn." },
      { value: "ead", label: "Giấy phép lao động (Thẻ EAD)", tip: "Giấy phép lao động — cho phép bạn làm việc hợp pháp tại Mỹ." },
      { value: "none", label: "Không có giấy tờ nào ở trên", tip: "" },
      { value: "prefer_not_say", label: "Tôi không muốn nói", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "Có — tôi có nhân viên xã hội" },
      { value: "lawyer", label: "Có — tôi có luật sư di trú" },
      { value: "sponsor", label: "Có — tôi có người bảo lãnh" },
      { value: "none", label: "Không — tôi đang tự xử lý" },
      { value: "helping_other", label: "Tôi đang giúp người khác" },
    ],
    summaryTitle: "Đây là những gì chúng tôi hiểu về tình huống của bạn.",
    summarySubtitle: "Hãy xem lại — bạn có thể chỉnh sửa bất cứ điều gì trước khi tiếp tục.",
    summaryLabels: { state: "Vị trí", situation: "Tình huống", goal: "Mục tiêu", urgency: "Mức độ khẩn cấp", documents: "Giấy tờ", support: "Hỗ trợ" },
    crisisHeading: "Bạn không đơn độc.",
    crisisBody: "Nếu bạn đang gặp nguy hiểm ngay lập tức, hãy gọi 911:",
    crisisLinks: [{ label: "RAICES", href: "https://www.raicestexas.org" }, { label: "IRC", href: "https://www.rescue.org" }],
    crisisContinue: "Tiếp tục xây dựng kế hoạch của tôi",
  },

  ar: {
    stepOf: (n, t) => `خطوة ${n} من ${t}`,
    back: "رجوع ←", continue: "→ متابعة", confirm: "→ هذا صحيح",
    edit: "تعديل إجاباتي", loading: "جارٍ إعداد خطتك الشخصية…",
    steps: [
      { question: "أين أنتَ الآن؟", sub: "اختر الولاية الأمريكية التي تقيم فيها حالياً." },
      { question: "أيّ خيار يصف وضعك الحالي أفضل؟", sub: "اختر الأقرب إلى وضعك — يمكنك التحديث لاحقاً." },
      { question: "ما هدفك الرئيسي الآن؟", sub: "سنبني خطتك حول هذا الهدف." },
      { question: "ما مدى إلحاح الأمر؟", sub: "هذا يساعدنا في تحديد أولويات خطواتك التالية." },
      { question: "هل تمتلك أياً من هذه الوثائق؟", sub: "اختر كل ما ينطبق عليك." },
      { question: "هل لديك دعم بالفعل؟", sub: "مساعد اجتماعي، محامٍ للهجرة أو كفيل." },
    ],
    situations: [
      { value: "student", label: "طالب/طالبة (تأشيرة F-1)" },
      { value: "work_visa", label: "تأشيرة عمل (H-1B, L-1, O-1, إلخ)" },
      { value: "asylum", label: "أسعى للحصول على اللجوء أو وضع اللاجئ" },
      { value: "undocumented", label: "غير موثق / لست متأكداً من وضعي القانوني" },
      { value: "permanent_resident", label: "مقيم دائم (البطاقة الخضراء)" },
      { value: "citizen_helping", label: "مواطن أمريكي — أساعد أحد أفراد العائلة" },
      { value: "applying_for_other", label: "أتقدم بطلب نيابةً عن شخص آخر" },
      { value: "unaccompanied_minor", label: "قاصر غير مصحوب (دون 18 سنة)" },
      { value: "mixed_status", label: "أسرة ذات أوضاع قانونية مختلطة" },
      { value: "prefer_not_say", label: "أفضّل عدم الإفصاح" },
    ],
    goals: [
      { value: "documents", label: "ترتيب وثائقي" },
      { value: "work", label: "إيجاد عمل أو فهم حقوقي" },
      { value: "housing", label: "إيجاد سكن أو مأوى" },
      { value: "healthcare", label: "الحصول على رعاية صحية" },
      { value: "legal", label: "التواصل مع المساعدة القانونية" },
      { value: "rights", label: "فهم حقوقي" },
      { value: "safety", label: "الأمان الرقمي" },
      { value: "family", label: "دعم أحد أفراد الأسرة" },
      { value: "unsure", label: "لست متأكداً بعد" },
    ],
    urgencies: [
      { value: "crisis", label: "أحتاج إلى مساعدة فورية", sub: "أنا في موقف أزمة أو غير آمن" },
      { value: "urgent", label: "الأمر ملحّ", sub: "أحتاج مساعدة خلال أيام" },
      { value: "soon", label: "خلال أسابيع", sub: "مهم لكن ليس طارئاً" },
      { value: "planning", label: "أخطط مسبقاً", sub: "لا توجد حاجة ملحّة" },
    ],
    documents: [
      { value: "passport", label: "جواز سفر", tip: "وثيقة سفر رسمية صادرة عن بلدك، تحتوي على صورتك ورقم فريد." },
      { value: "national_id", label: "بطاقة هوية وطنية", tip: "وثيقة هوية صادرة عن حكومة بلدك." },
      { value: "visa", label: "تأشيرة", tip: "ختم أو إذن إلكتروني يتيح لك الدخول القانوني إلى الولايات المتحدة." },
      { value: "asylum_papers", label: "وثائق اللجوء / I-589", tip: "مستندات تُثبت تقديمك طلباً للحماية أو حصولك عليها في الولايات المتحدة." },
      { value: "green_card", label: "البطاقة الخضراء (I-551)", tip: "بطاقة الإقامة الدائمة — تُثبت حقك في الإقامة والعمل الدائم في الولايات المتحدة." },
      { value: "ead", label: "تصريح العمل (بطاقة EAD)", tip: "وثيقة تخويل التوظيف — تتيح لك العمل بصورة قانونية في الولايات المتحدة." },
      { value: "none", label: "لا شيء مما سبق", tip: "" },
      { value: "prefer_not_say", label: "أفضّل عدم الإفصاح", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "نعم — لديّ أخصائي اجتماعي" },
      { value: "lawyer", label: "نعم — لديّ محامٍ للهجرة" },
      { value: "sponsor", label: "نعم — لديّ كفيل" },
      { value: "none", label: "لا — أتعامل مع هذا بمفردي" },
      { value: "helping_other", label: "أساعد شخصاً آخر في هذا الأمر" },
    ],
    summaryTitle: "إليك ما فهمناه عن وضعك.",
    summarySubtitle: "خذ لحظة للمراجعة — يمكنك تعديل أي شيء قبل المتابعة.",
    summaryLabels: { state: "الموقع", situation: "الوضع", goal: "الهدف الرئيسي", urgency: "الإلحاح", documents: "الوثائق", support: "الدعم" },
    crisisHeading: "أنتَ لست وحدك.",
    crisisBody: "إن كنت في خطر فوري، اتصل بـ 911:",
    crisisLinks: [{ label: "RAICES", href: "https://www.raicestexas.org" }, { label: "IRC", href: "https://www.rescue.org" }],
    crisisContinue: "متابعة لبناء خطتي على أي حال",
  },

  fr: {
    stepOf: (n, t) => `Étape ${n} sur ${t}`,
    back: "← Retour", continue: "Continuer →", confirm: "C'est correct →",
    edit: "Modifier mes réponses", loading: "Création de votre plan personnalisé…",
    steps: [
      { question: "Où vous trouvez-vous ?", sub: "Sélectionnez l'État américain où vous résidez." },
      { question: "Laquelle de ces options décrit le mieux votre situation ?", sub: "Choisissez l'option la plus proche — vous pourrez la modifier plus tard." },
      { question: "Quel est votre objectif principal en ce moment ?", sub: "Nous allons construire votre plan autour de cela." },
      { question: "À quel point est-ce urgent ?", sub: "Cela nous aide à prioriser vos prochaines étapes." },
      { question: "Avez-vous l'un de ces documents ?", sub: "Sélectionnez tout ce qui s'applique." },
      { question: "Avez-vous déjà un soutien ?", sub: "Un travailleur social, un avocat en immigration ou un parrain." },
    ],
    situations: [
      { value: "student", label: "Étudiant(e) (visa F-1)" },
      { value: "work_visa", label: "Visa de travail (H-1B, L-1, O-1, etc.)" },
      { value: "asylum", label: "En demande d'asile ou de statut de réfugié" },
      { value: "undocumented", label: "Sans papiers / pas sûr(e) de mon statut" },
      { value: "permanent_resident", label: "Résident(e) permanent(e) (carte verte)" },
      { value: "citizen_helping", label: "Citoyen(ne) américain(e) — aidant un membre de la famille" },
      { value: "applying_for_other", label: "Je fais des démarches pour quelqu'un d'autre" },
      { value: "unaccompanied_minor", label: "Mineur(e) non accompagné(e) (moins de 18 ans)" },
      { value: "mixed_status", label: "Famille à statuts migratoires mixtes" },
      { value: "prefer_not_say", label: "Je préfère ne pas le dire" },
    ],
    goals: [
      { value: "documents", label: "Mettre mes documents en ordre" },
      { value: "work", label: "Trouver du travail ou comprendre mes droits" },
      { value: "housing", label: "Trouver un logement" },
      { value: "healthcare", label: "Accéder aux soins de santé" },
      { value: "legal", label: "Obtenir une aide juridique" },
      { value: "rights", label: "Comprendre mes droits" },
      { value: "safety", label: "Ma sécurité en ligne" },
      { value: "family", label: "Soutenir un membre de ma famille" },
      { value: "unsure", label: "Je ne sais pas encore" },
    ],
    urgencies: [
      { value: "crisis", label: "J'ai besoin d'aide immédiatement", sub: "Je suis en situation de crise" },
      { value: "urgent", label: "C'est urgent", sub: "J'ai besoin d'aide dans les prochains jours" },
      { value: "soon", label: "Dans les prochaines semaines", sub: "Important mais pas une urgence" },
      { value: "planning", label: "Je planifie à l'avance", sub: "Pas d'urgence immédiate" },
    ],
    documents: [
      { value: "passport", label: "Passeport", tip: "Document de voyage officiel délivré par votre pays." },
      { value: "national_id", label: "Carte d'identité nationale", tip: "Pièce d'identité gouvernementale de votre pays." },
      { value: "visa", label: "Visa", tip: "Cachet ou autorisation électronique permettant d'entrer légalement aux États-Unis." },
      { value: "asylum_papers", label: "Documents d'asile / I-589", tip: "Documents prouvant que vous avez demandé ou obtenu la protection aux États-Unis." },
      { value: "green_card", label: "Carte verte (I-551)", tip: "Carte de résident permanent — prouve que vous pouvez vivre et travailler aux États-Unis." },
      { value: "ead", label: "Permis de travail (carte EAD)", tip: "Document d'autorisation d'emploi — vous permet de travailler légalement aux États-Unis." },
      { value: "none", label: "Aucun de ces documents", tip: "" },
      { value: "prefer_not_say", label: "Je préfère ne pas le dire", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "Oui — j'ai un(e) travailleur/euse social(e)" },
      { value: "lawyer", label: "Oui — j'ai un(e) avocat(e) en immigration" },
      { value: "sponsor", label: "Oui — j'ai un(e) parrain/marraine" },
      { value: "none", label: "Non — je navigue seul(e)" },
      { value: "helping_other", label: "J'aide quelqu'un d'autre" },
    ],
    summaryTitle: "Voici ce que nous comprenons de votre situation.",
    summarySubtitle: "Prenez un moment pour vérifier — vous pouvez modifier quoi que ce soit avant de continuer.",
    summaryLabels: { state: "Lieu", situation: "Situation", goal: "Objectif principal", urgency: "Urgence", documents: "Documents", support: "Soutien" },
    crisisHeading: "Vous n'êtes pas seul(e).",
    crisisBody: "Si vous êtes en danger immédiat, appelez le 911:",
    crisisLinks: [{ label: "RAICES", href: "https://www.raicestexas.org" }, { label: "IRC", href: "https://www.rescue.org" }],
    crisisContinue: "Continuer et créer mon plan quand même",
  },

  pt: {
    stepOf: (n, t) => `Passo ${n} de ${t}`,
    back: "← Voltar", continue: "Continuar →", confirm: "Está correto →",
    edit: "Editar minhas respostas", loading: "Criando seu plano personalizado…",
    steps: [
      { question: "Onde você está agora?", sub: "Selecione o estado dos EUA onde você está." },
      { question: "O que melhor descreve sua situação atual?", sub: "Escolha a opção mais próxima — você pode atualizar depois." },
      { question: "Qual é o seu principal objetivo agora?", sub: "Vamos construir seu plano em torno disso." },
      { question: "O quão urgente é isso?", sub: "Isso nos ajuda a priorizar seus próximos passos." },
      { question: "Você tem algum desses documentos?", sub: "Selecione todos que se aplicam." },
      { question: "Você já tem apoio?", sub: "Um assistente social, advogado de imigração ou patrocinador." },
    ],
    situations: [
      { value: "student", label: "Estudante (visto F-1)" },
      { value: "work_visa", label: "Visto de trabalho (H-1B, L-1, O-1, etc.)" },
      { value: "asylum", label: "Solicitando asilo ou status de refugiado" },
      { value: "undocumented", label: "Sem documentos / incerto(a) sobre meu status" },
      { value: "permanent_resident", label: "Residente permanente (Green Card)" },
      { value: "citizen_helping", label: "Cidadão americano — ajudando um familiar" },
      { value: "applying_for_other", label: "Estou fazendo isso por outra pessoa" },
      { value: "unaccompanied_minor", label: "Menor desacompanhado(a) (menos de 18 anos)" },
      { value: "mixed_status", label: "Família com status migratório misto" },
      { value: "prefer_not_say", label: "Prefiro não dizer" },
    ],
    goals: [
      { value: "documents", label: "Organizar meus documentos" },
      { value: "work", label: "Encontrar trabalho ou entender meus direitos" },
      { value: "housing", label: "Encontrar moradia ou abrigo" },
      { value: "healthcare", label: "Acessar cuidados de saúde" },
      { value: "legal", label: "Conectar com ajuda jurídica" },
      { value: "rights", label: "Entender meus direitos" },
      { value: "safety", label: "Segurança online" },
      { value: "family", label: "Apoiar um familiar" },
      { value: "unsure", label: "Ainda não tenho certeza" },
    ],
    urgencies: [
      { value: "crisis", label: "Preciso de ajuda imediatamente", sub: "Estou em crise ou situação de risco" },
      { value: "urgent", label: "É urgente", sub: "Preciso de ajuda nos próximos dias" },
      { value: "soon", label: "Nas próximas semanas", sub: "Importante, mas não emergência" },
      { value: "planning", label: "Estou planejando com antecedência", sub: "Sem urgência imediata" },
    ],
    documents: [
      { value: "passport", label: "Passaporte", tip: "Documento oficial de viagem emitido pelo seu país." },
      { value: "national_id", label: "RG / Documento de identidade nacional", tip: "Documento de identidade emitido pelo governo do seu país." },
      { value: "visa", label: "Visto", tip: "Carimbo ou autorização eletrônica que permite a entrada legal nos EUA." },
      { value: "asylum_papers", label: "Documentos de asilo / I-589", tip: "Documentos que mostram que você solicitou ou recebeu proteção nos EUA." },
      { value: "green_card", label: "Green Card (I-551)", tip: "Cartão de residência permanente — prova que você pode viver e trabalhar nos EUA permanentemente." },
      { value: "ead", label: "Permissão de trabalho (Cartão EAD)", tip: "Documento de autorização de emprego — permite que você trabalhe legalmente nos EUA." },
      { value: "none", label: "Nenhum dos anteriores", tip: "" },
      { value: "prefer_not_say", label: "Prefiro não dizer", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "Sim — tenho um assistente social" },
      { value: "lawyer", label: "Sim — tenho um advogado de imigração" },
      { value: "sponsor", label: "Sim — tenho um patrocinador" },
      { value: "none", label: "Não — estou navegando sozinho(a)" },
      { value: "helping_other", label: "Estou ajudando outra pessoa" },
    ],
    summaryTitle: "Aqui está o que entendemos sobre sua situação.",
    summarySubtitle: "Reserve um momento para revisar — você pode editar qualquer coisa antes de continuar.",
    summaryLabels: { state: "Localização", situation: "Situação", goal: "Objetivo principal", urgency: "Urgência", documents: "Documentos", support: "Apoio" },
    crisisHeading: "Você não está sozinho(a).",
    crisisBody: "Se você estiver em perigo imediato, ligue para o 911:",
    crisisLinks: [{ label: "RAICES", href: "https://www.raicestexas.org" }, { label: "IRC", href: "https://www.rescue.org" }],
    crisisContinue: "Continuar e criar meu plano assim mesmo",
  },

  hi: {
    stepOf: (n, t) => `चरण ${n} / ${t}`,
    back: "← वापस", continue: "आगे बढ़ें →", confirm: "यह सही है →",
    edit: "अपने उत्तर संपादित करें", loading: "आपकी व्यक्तिगत योजना तैयार की जा रही है…",
    steps: [
      { question: "आप अभी कहाँ हैं?", sub: "अपना वर्तमान अमेरिकी राज्य चुनें।" },
      { question: "आपकी वर्तमान स्थिति को सबसे अच्छा कौन बताता है?", sub: "सबसे नज़दीकी विकल्प चुनें — आप बाद में बदल सकते हैं।" },
      { question: "अभी आपका मुख्य लक्ष्य क्या है?", sub: "हम इसी के आधार पर आपकी योजना बनाएंगे।" },
      { question: "यह कितना जरूरी है?", sub: "इससे हम आपके अगले कदमों को प्राथमिकता दे सकते हैं।" },
      { question: "क्या आपके पास इनमें से कोई दस्तावेज़ है?", sub: "जो भी लागू हो, सभी चुनें।" },
      { question: "क्या आपके पास पहले से कोई सहायता है?", sub: "केसवर्कर, इमिग्रेशन वकील, या प्रायोजक।" },
    ],
    situations: [
      { value: "student", label: "छात्र (F-1 वीज़ा)" },
      { value: "work_visa", label: "वर्क वीज़ा (H-1B, L-1, O-1, आदि)" },
      { value: "asylum", label: "शरण या शरणार्थी दर्जे के लिए आवेदन कर रहे हैं" },
      { value: "undocumented", label: "बिना दस्तावेज़ / अपनी स्थिति के बारे में अनिश्चित" },
      { value: "permanent_resident", label: "स्थायी निवासी (ग्रीन कार्ड)" },
      { value: "citizen_helping", label: "अमेरिकी नागरिक — परिवार के किसी सदस्य की मदद कर रहे हैं" },
      { value: "applying_for_other", label: "मैं किसी और के लिए आवेदन कर रहा/रही हूं" },
      { value: "unaccompanied_minor", label: "असंगत नाबालिग (18 वर्ष से कम)" },
      { value: "mixed_status", label: "मिश्रित-स्थिति परिवार" },
      { value: "prefer_not_say", label: "बताना नहीं चाहता/चाहती" },
    ],
    goals: [
      { value: "documents", label: "अपने दस्तावेज़ व्यवस्थित करें" },
      { value: "work", label: "काम खोजें या श्रम अधिकार समझें" },
      { value: "housing", label: "आवास या आश्रय खोजें" },
      { value: "healthcare", label: "स्वास्थ्य सेवा लें" },
      { value: "legal", label: "कानूनी सहायता से जुड़ें" },
      { value: "rights", label: "अपने अधिकार समझें" },
      { value: "safety", label: "ऑनलाइन सुरक्षित रहें" },
      { value: "family", label: "परिवार के सदस्य की सहायता करें" },
      { value: "unsure", label: "अभी तय नहीं" },
    ],
    urgencies: [
      { value: "crisis", label: "मुझे तुरंत मदद चाहिए", sub: "मैं संकट में हूं या असुरक्षित हूं" },
      { value: "urgent", label: "यह जरूरी है", sub: "कुछ दिनों में मदद चाहिए" },
      { value: "soon", label: "कुछ हफ्तों में", sub: "जरूरी लेकिन आपात नहीं" },
      { value: "planning", label: "मैं आगे की योजना बना रहा/रही हूं", sub: "कोई तत्काल जरूरत नहीं" },
    ],
    documents: [
      { value: "passport", label: "पासपोर्ट", tip: "आपके देश द्वारा जारी आधिकारिक यात्रा दस्तावेज़।" },
      { value: "national_id", label: "राष्ट्रीय पहचान पत्र", tip: "आपके देश की सरकार द्वारा जारी आईडी।" },
      { value: "visa", label: "वीज़ा", tip: "स्टाम्प या इलेक्ट्रॉनिक अनुमति जो आपको अमेरिका में कानूनी रूप से प्रवेश देती है।" },
      { value: "asylum_papers", label: "शरण दस्तावेज़ / I-589", tip: "वे दस्तावेज़ जो दिखाते हैं कि आपने अमेरिका में सुरक्षा के लिए आवेदन किया है।" },
      { value: "green_card", label: "ग्रीन कार्ड (I-551)", tip: "स्थायी निवास कार्ड — यह साबित करता है कि आप अमेरिका में स्थायी रूप से रह और काम कर सकते हैं।" },
      { value: "ead", label: "वर्क परमिट (EAD कार्ड)", tip: "रोजगार प्राधिकरण दस्तावेज़ — आपको अमेरिका में कानूनी रूप से काम करने देता है।" },
      { value: "none", label: "इनमें से कोई नहीं", tip: "" },
      { value: "prefer_not_say", label: "बताना नहीं चाहता/चाहती", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "हाँ — मेरे पास एक केसवर्कर है" },
      { value: "lawyer", label: "हाँ — मेरे पास एक इमिग्रेशन वकील है" },
      { value: "sponsor", label: "हाँ — मेरे पास एक प्रायोजक है" },
      { value: "none", label: "नहीं — मैं अकेले इसे संभाल रहा/रही हूं" },
      { value: "helping_other", label: "मैं किसी और की मदद कर रहा/रही हूं" },
    ],
    summaryTitle: "आपकी स्थिति के बारे में हमारी समझ।",
    summarySubtitle: "एक बार जांच करें — आगे बढ़ने से पहले कुछ भी बदल सकते हैं।",
    summaryLabels: { state: "स्थान", situation: "स्थिति", goal: "मुख्य लक्ष्य", urgency: "जरूरत", documents: "दस्तावेज़", support: "सहायता" },
    crisisHeading: "आप अकेले नहीं हैं।",
    crisisBody: "अगर आप तत्काल खतरे में हैं, तो 911 पर कॉल करें:",
    crisisLinks: [{ label: "RAICES", href: "https://www.raicestexas.org" }, { label: "IRC", href: "https://www.rescue.org" }],
    crisisContinue: "फिर भी मेरी योजना बनाना जारी रखें",
  },

  ru: {
    stepOf: (n, t) => `Шаг ${n} из ${t}`,
    back: "← Назад", continue: "Продолжить →", confirm: "Всё верно →",
    edit: "Изменить ответы", loading: "Составляем ваш персональный план…",
    steps: [
      { question: "Где вы сейчас?", sub: "Выберите штат США, где вы проживаете." },
      { question: "Что лучше всего описывает вашу текущую ситуацию?", sub: "Выберите наиболее близкий вариант." },
      { question: "Какова ваша главная цель прямо сейчас?", sub: "Мы построим ваш план вокруг этого." },
      { question: "Насколько это срочно?", sub: "Это поможет нам определить приоритеты." },
      { question: "Есть ли у вас какие-либо из этих документов?", sub: "Выберите всё, что применимо." },
      { question: "Есть ли у вас уже поддержка?", sub: "Социальный работник, иммиграционный адвокат или спонсор." },
    ],
    situations: [
      { value: "student", label: "Студент (виза F-1)" },
      { value: "work_visa", label: "Рабочая виза (H-1B, L-1, O-1 и др.)" },
      { value: "asylum", label: "Подаю заявление на убежище или статус беженца" },
      { value: "undocumented", label: "Нет документов / неуверен в своём статусе" },
      { value: "permanent_resident", label: "Постоянный резидент (Грин-карта)" },
      { value: "citizen_helping", label: "Гражданин США — помогаю члену семьи" },
      { value: "applying_for_other", label: "Я оформляю документы за другого человека" },
      { value: "unaccompanied_minor", label: "Несопровождаемый несовершеннолетний (до 18 лет)" },
      { value: "mixed_status", label: "Семья со смешанным иммиграционным статусом" },
      { value: "prefer_not_say", label: "Предпочитаю не говорить" },
    ],
    goals: [
      { value: "documents", label: "Привести документы в порядок" },
      { value: "work", label: "Найти работу или узнать свои трудовые права" },
      { value: "housing", label: "Найти жильё или убежище" },
      { value: "healthcare", label: "Получить медицинскую помощь" },
      { value: "legal", label: "Связаться с юридической помощью" },
      { value: "rights", label: "Понять свои права" },
      { value: "safety", label: "Безопасность в интернете" },
      { value: "family", label: "Помочь члену семьи" },
      { value: "unsure", label: "Пока не знаю" },
    ],
    urgencies: [
      { value: "crisis", label: "Мне нужна немедленная помощь", sub: "Я в кризисной или небезопасной ситуации" },
      { value: "urgent", label: "Это срочно", sub: "Нужна помощь в течение нескольких дней" },
      { value: "soon", label: "В течение нескольких недель", sub: "Важно, но не экстренно" },
      { value: "planning", label: "Планирую заранее", sub: "Нет немедленной срочности" },
    ],
    documents: [
      { value: "passport", label: "Паспорт", tip: "Официальный документ, удостоверяющий личность, выданный вашей страной." },
      { value: "national_id", label: "Национальное удостоверение личности", tip: "Государственный документ, удостоверяющий личность, из вашей страны." },
      { value: "visa", label: "Виза", tip: "Отметка или электронное разрешение на законный въезд в США." },
      { value: "asylum_papers", label: "Документы на убежище / I-589", tip: "Документы, подтверждающие, что вы подали заявление о защите или получили её в США." },
      { value: "green_card", label: "Грин-карта (I-551)", tip: "Карта постоянного жителя — подтверждает право на постоянное проживание и работу в США." },
      { value: "ead", label: "Разрешение на работу (карта EAD)", tip: "Документ, разрешающий законное трудоустройство в США." },
      { value: "none", label: "Ни одного из перечисленных", tip: "" },
      { value: "prefer_not_say", label: "Предпочитаю не говорить", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "Да — у меня есть социальный работник" },
      { value: "lawyer", label: "Да — у меня есть иммиграционный адвокат" },
      { value: "sponsor", label: "Да — у меня есть спонсор" },
      { value: "none", label: "Нет — я разбираюсь самостоятельно" },
      { value: "helping_other", label: "Я помогаю другому человеку" },
    ],
    summaryTitle: "Вот что мы поняли о вашей ситуации.",
    summarySubtitle: "Проверьте — вы можете изменить что угодно перед продолжением.",
    summaryLabels: { state: "Местоположение", situation: "Ситуация", goal: "Главная цель", urgency: "Срочность", documents: "Документы", support: "Поддержка" },
    crisisHeading: "Вы не одиноки.",
    crisisBody: "Если вы в немедленной опасности, позвоните 911:",
    crisisLinks: [{ label: "RAICES", href: "https://www.raicestexas.org" }, { label: "IRC", href: "https://www.rescue.org" }],
    crisisContinue: "Продолжить и составить мой план",
  },
};

// ─── Partial translations (UI chrome only — options fall back to English) ─────
const PARTIAL = {
  ko: {
    stepOf: (n, t) => `${n}단계 / ${t}`,
    back: "← 뒤로", continue: "계속 →", confirm: "맞습니다 →",
    edit: "답변 수정", loading: "맞춤형 계획을 작성 중입니다…",
    steps: [
      { question: "지금 어디에 계신가요?", sub: "현재 거주하는 미국 주를 선택하세요." },
      { question: "현재 상황을 가장 잘 설명하는 것은?", sub: "가장 가까운 옵션을 선택하세요." },
      { question: "지금 주요 목표는 무엇인가요?", sub: "이를 중심으로 계획을 세웁니다." },
      { question: "얼마나 긴급한가요?", sub: "다음 단계의 우선순위를 정하는 데 도움이 됩니다." },
      { question: "다음 서류가 있으신가요?", sub: "해당되는 항목을 모두 선택하세요." },
      { question: "이미 지원을 받고 계신가요?", sub: "케이스워커, 이민 변호사 또는 보증인." },
    ],
    summaryTitle: "당신의 상황에 대해 이해한 내용입니다.",
    summarySubtitle: "계획을 세우기 전에 검토하고 수정할 수 있습니다.",
    summaryLabels: { state: "위치", situation: "상황", goal: "주요 목표", urgency: "긴급도", documents: "서류", support: "지원" },
    crisisHeading: "혼자가 아닙니다.", crisisBody: "즉각적인 위험에 처해 있다면 911에 전화하세요:", crisisContinue: "계속해서 내 계획 세우기",
    situations: [
      { value: "student", label: "학생 (F-1 비자)" },
      { value: "work_visa", label: "취업 비자 (H-1B, L-1, O-1 등)" },
      { value: "asylum", label: "망명 또는 난민 지위 신청" },
      { value: "undocumented", label: "미등록 / 체류 상태 불확실" },
      { value: "permanent_resident", label: "영주권자 (그린카드)" },
      { value: "citizen_helping", label: "미국 시민권자 — 가족 구성원 지원" },
      { value: "applying_for_other", label: "다른 사람을 위해 신청 또는 문의 중" },
      { value: "unaccompanied_minor", label: "동반자 없는 미성년자 (18세 미만)" },
      { value: "mixed_status", label: "혼합 체류 신분 가족" },
      { value: "prefer_not_say", label: "말하고 싶지 않음" },
    ],
    goals: [
      { value: "documents", label: "서류 정리" },
      { value: "work", label: "취업 또는 근로 권리 이해" },
      { value: "housing", label: "주거지 또는 쉼터 찾기" },
      { value: "healthcare", label: "의료 서비스 받기" },
      { value: "legal", label: "법률 지원 연결" },
      { value: "rights", label: "권리 이해" },
      { value: "safety", label: "온라인 안전" },
      { value: "family", label: "가족 구성원 지원" },
      { value: "unsure", label: "아직 잘 모름" },
    ],
    urgencies: [
      { value: "crisis", label: "즉시 도움이 필요함", sub: "위기 또는 위험한 상황에 있음" },
      { value: "urgent", label: "긴급한 상황", sub: "며칠 안에 도움이 필요" },
      { value: "soon", label: "몇 주 내", sub: "중요하지만 응급은 아님" },
      { value: "planning", label: "미리 계획 중", sub: "즉각적인 긴급 상황 없음" },
    ],
    documents: [
      { value: "passport", label: "여권", tip: "본국 정부가 발급한 공식 여행 문서. 사진과 고유 번호가 있음." },
      { value: "national_id", label: "주민등록증 / 정부 발급 신분증", tip: "본국 정부가 발급한 신분증 — 운전면허증, 국가 신분증 등." },
      { value: "visa", label: "비자", tip: "미국에 합법적으로 입국할 수 있는 여권 도장 또는 전자 승인." },
      { value: "asylum_papers", label: "망명 서류 / I-589", tip: "미국에서 보호 신청을 했거나 받았음을 보여주는 서류." },
      { value: "green_card", label: "그린카드 (I-551)", tip: "영주권 카드 — 미국에서 영구적으로 살고 일할 수 있음을 증명." },
      { value: "ead", label: "취업허가증 (EAD 카드)", tip: "고용 허가 서류 — 미국에서 합법적으로 일할 수 있도록 허가." },
      { value: "none", label: "해당 없음", tip: "" },
      { value: "prefer_not_say", label: "말하고 싶지 않음", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "예 — 케이스워커가 있음" },
      { value: "lawyer", label: "예 — 이민 변호사가 있음" },
      { value: "sponsor", label: "예 — 보증인이 있음" },
      { value: "none", label: "아니요 — 혼자 해결 중" },
      { value: "helping_other", label: "다른 사람을 돕고 있음" },
    ],
    crisisLinks: [
      { label: "RAICES 긴급 전화", href: "https://www.raicestexas.org" },
      { label: "IRC 위기 지원", href: "https://www.rescue.org" },
    ],
  },
  tl: {
    stepOf: (n, t) => `Hakbang ${n} ng ${t}`,
    back: "← Bumalik", continue: "Magpatuloy →", confirm: "Tama ito →",
    edit: "I-edit ang aking mga sagot", loading: "Ginagawa ang iyong personalized na plano…",
    steps: [
      { question: "Nasaan ka ngayon?", sub: "Piliin ang estado ng US kung saan ka nakatira." },
      { question: "Alin ang pinaka-angkop sa iyong sitwasyon?", sub: "Piliin ang pinaka-malapit — maaari mong i-update mamaya." },
      { question: "Ano ang iyong pangunahing layunin ngayon?", sub: "Itatayo namin ang iyong plano sa paligid nito." },
      { question: "Gaano ito kaapurahan?", sub: "Nakakatulong ito sa amin na unahin ang iyong mga susunod na hakbang." },
      { question: "Mayroon ka bang alinman sa mga dokumentong ito?", sub: "Piliin ang lahat ng naaangkop." },
      { question: "Mayroon ka nang suporta?", sub: "Caseworker, abogado sa imigrasyon, o sponsor." },
    ],
    summaryTitle: "Ito ang aming pag-unawa sa iyong sitwasyon.",
    summarySubtitle: "Suriin — maaari kang mag-edit ng anuman bago magpatuloy.",
    summaryLabels: { state: "Lokasyon", situation: "Sitwasyon", goal: "Pangunahing layunin", urgency: "Pagkamadalian", documents: "Mga dokumento", support: "Suporta" },
    crisisHeading: "Hindi ka nag-iisa.", crisisBody: "Kung nasa agarang panganib ka, tumawag sa 911:", crisisContinue: "Magpatuloy at bumuo ng aking plano",
    situations: [
      { value: "student", label: "Estudyante (F-1 visa)" },
      { value: "work_visa", label: "Work visa (H-1B, L-1, O-1, atbp.)" },
      { value: "asylum", label: "Naghahanap ng asylum o refugee status" },
      { value: "undocumented", label: "Walang dokumento / hindi sigurado sa status ko" },
      { value: "permanent_resident", label: "Permanenteng residente (Green Card)" },
      { value: "citizen_helping", label: "Mamamayan ng US — tumutulong sa miyembro ng pamilya" },
      { value: "applying_for_other", label: "Naghahanap o nag-a-apply para sa iba" },
      { value: "unaccompanied_minor", label: "Walang kasamang menor de edad (wala pang 18 taong gulang)" },
      { value: "mixed_status", label: "Pamilya na may magkakaibang immigration status" },
      { value: "prefer_not_say", label: "Ayoko sabihin" },
    ],
    goals: [
      { value: "documents", label: "Ayusin ang aking mga dokumento" },
      { value: "work", label: "Humanap ng trabaho o maunawaan ang aking mga karapatan" },
      { value: "housing", label: "Humanap ng tirahan o silungan" },
      { value: "healthcare", label: "Makakuha ng serbisyong pangkalusugan" },
      { value: "legal", label: "Makipag-ugnayan sa legal na tulong" },
      { value: "rights", label: "Maunawaan ang aking mga karapatan" },
      { value: "safety", label: "Manatiling ligtas online" },
      { value: "family", label: "Suportahan ang miyembro ng pamilya" },
      { value: "unsure", label: "Hindi pa ako sigurado" },
    ],
    urgencies: [
      { value: "crisis", label: "Kailangan ko ng tulong agad", sub: "Nasa krisis o mapanganib na sitwasyon ako" },
      { value: "urgent", label: "Ito ay kailangan na", sub: "Kailangan ng tulong sa loob ng ilang araw" },
      { value: "soon", label: "Sa loob ng ilang linggo", sub: "Mahalaga ngunit hindi emergency" },
      { value: "planning", label: "Nagpaplano nang maaga", sub: "Walang agarang pangangailangan" },
    ],
    documents: [
      { value: "passport", label: "Pasaporte", tip: "Opisyal na dokumento sa paglalakbay na inilabas ng iyong bansa. May larawan at natatanging numero." },
      { value: "national_id", label: "National ID / Government ID", tip: "ID na inilabas ng gobyerno ng iyong bansa — lisensya, national card, atbp." },
      { value: "visa", label: "Visa", tip: "Selyo o elektronikong pahintulot na nagbibigay-daan sa iyong pumasok sa US nang legal." },
      { value: "asylum_papers", label: "Mga papel ng asylum / I-589", tip: "Mga dokumento na nagpapakita na nag-apply ka o nakatanggap ng proteksyon sa US." },
      { value: "green_card", label: "Green Card (I-551)", tip: "Permanent Resident Card — patunay na maaari kang manirahan at magtrabaho sa US nang permanente." },
      { value: "ead", label: "Work Permit (EAD Card)", tip: "Employment Authorization Document — nagpapahintulot sa iyong magtrabaho nang legal sa US." },
      { value: "none", label: "Wala sa nabanggit", tip: "" },
      { value: "prefer_not_say", label: "Ayoko sabihin", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "Oo — mayroon akong caseworker" },
      { value: "lawyer", label: "Oo — mayroon akong abogado sa imigrasyon" },
      { value: "sponsor", label: "Oo — mayroon akong sponsor" },
      { value: "none", label: "Hindi — nag-iisa akong nag-navigate nito" },
      { value: "helping_other", label: "Tinutulungan ko ang ibang tao" },
    ],
    crisisLinks: [
      { label: "RAICES Emergency Hotline", href: "https://www.raicestexas.org" },
      { label: "IRC Crisis Support", href: "https://www.rescue.org" },
    ],
  },
  uk: {
    stepOf: (n, t) => `Крок ${n} з ${t}`,
    back: "← Назад", continue: "Продовжити →", confirm: "Це правильно →",
    edit: "Редагувати відповіді", loading: "Складаємо ваш персональний план…",
    steps: [
      { question: "Де ви зараз?", sub: "Виберіть штат США, де ви перебуваєте." },
      { question: "Що найкраще описує вашу поточну ситуацію?", sub: "Оберіть найближчий варіант." },
      { question: "Яка ваша головна мета зараз?", sub: "Ми побудуємо ваш план навколо цього." },
      { question: "Наскільки це терміново?", sub: "Це допомагає нам визначити пріоритети." },
      { question: "Чи маєте ви будь-який з цих документів?", sub: "Виберіть усе, що стосується вас." },
      { question: "Чи є у вас вже підтримка?", sub: "Соціальний працівник, адвокат з імміграції або спонсор." },
    ],
    summaryTitle: "Ось що ми розуміємо про вашу ситуацію.",
    summarySubtitle: "Перевірте — ви можете відредагувати будь-що перед продовженням.",
    summaryLabels: { state: "Місцезнаходження", situation: "Ситуація", goal: "Головна мета", urgency: "Терміновість", documents: "Документи", support: "Підтримка" },
    crisisHeading: "Ви не самі.", crisisBody: "Якщо ви в безпосередній небезпеці, телефонуйте 911:", crisisContinue: "Продовжити і скласти мій план",
    situations: [
      { value: "student", label: "Студент (віза F-1)" },
      { value: "work_visa", label: "Робоча віза (H-1B, L-1, O-1 тощо)" },
      { value: "asylum", label: "Подаю заяву на притулок або статус біженця" },
      { value: "undocumented", label: "Немає документів / невпевнений у своєму статусі" },
      { value: "permanent_resident", label: "Постійний резидент (Грін-карта)" },
      { value: "citizen_helping", label: "Громадянин США — допомагаю члену сім'ї" },
      { value: "applying_for_other", label: "Я оформляю документи за іншу людину" },
      { value: "unaccompanied_minor", label: "Неповнолітній без супроводу (до 18 років)" },
      { value: "mixed_status", label: "Сім'я зі змішаним імміграційним статусом" },
      { value: "prefer_not_say", label: "Не хочу говорити" },
    ],
    goals: [
      { value: "documents", label: "Впорядкувати документи" },
      { value: "work", label: "Знайти роботу або зрозуміти свої трудові права" },
      { value: "housing", label: "Знайти житло або притулок" },
      { value: "healthcare", label: "Отримати медичну допомогу" },
      { value: "legal", label: "Зв'язатися з юридичною допомогою" },
      { value: "rights", label: "Зрозуміти свої права" },
      { value: "safety", label: "Безпека в інтернеті" },
      { value: "family", label: "Допомогти члену сім'ї" },
      { value: "unsure", label: "Ще не знаю" },
    ],
    urgencies: [
      { value: "crisis", label: "Потрібна негайна допомога", sub: "Я в кризовій або небезпечній ситуації" },
      { value: "urgent", label: "Це терміново", sub: "Потрібна допомога протягом кількох днів" },
      { value: "soon", label: "Протягом кількох тижнів", sub: "Важливо, але не екстрено" },
      { value: "planning", label: "Планую заздалегідь", sub: "Немає негайної терміновості" },
    ],
    documents: [
      { value: "passport", label: "Паспорт", tip: "Офіційний документ, виданий вашою країною. Містить фото та унікальний номер." },
      { value: "national_id", label: "Національне посвідчення особи", tip: "Державний документ, виданий урядом вашої країни — посвідчення водія, картка тощо." },
      { value: "visa", label: "Віза", tip: "Штамп або електронне дозвіл на законний в'їзд до США." },
      { value: "asylum_papers", label: "Документи на притулок / I-589", tip: "Документи, що підтверджують подачу заяви або отримання захисту в США." },
      { value: "green_card", label: "Грін-карта (I-551)", tip: "Карта постійного мешканця — підтверджує право на постійне проживання та роботу в США." },
      { value: "ead", label: "Дозвіл на роботу (карта EAD)", tip: "Документ, що дозволяє законне працевлаштування в США." },
      { value: "none", label: "Жодного з перелічених", tip: "" },
      { value: "prefer_not_say", label: "Не хочу говорити", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "Так — є соціальний працівник" },
      { value: "lawyer", label: "Так — є адвокат з імміграції" },
      { value: "sponsor", label: "Так — є спонсор" },
      { value: "none", label: "Ні — розбираюся самостійно" },
      { value: "helping_other", label: "Допомагаю іншій людині" },
    ],
    crisisLinks: [
      { label: "RAICES Екстрена лінія", href: "https://www.raicestexas.org" },
      { label: "IRC Кризова підтримка", href: "https://www.rescue.org" },
    ],
  },
  ht: {
    stepOf: (n, t) => `Etap ${n} nan ${t}`,
    back: "← Retounen", continue: "Kontinye →", confirm: "Sa a kòrèk →",
    edit: "Chanje repons mwen", loading: "N ap bati plan pèsonèl ou a…",
    steps: [
      { question: "Ki kote ou ye kounye a?", sub: "Chwazi eta ameriken kote ou rete a." },
      { question: "Ki sa ki pi dekri sitiyasyon ou kounye a?", sub: "Chwazi opsyon ki pi pre — ou ka mete ajou pita." },
      { question: "Ki sa ki objektif prensipal ou kounye a?", sub: "Nou pral bati plan ou baze sou sa." },
      { question: "Nan ki pwen sa a ijan?", sub: "Sa ede nou priyorize pwochen etap ou yo." },
      { question: "Eske ou gen youn nan dokiman sa yo?", sub: "Chwazi tout sa ki aplike." },
      { question: "Eske ou gen sipò deja?", sub: "Travayè sosyal, avoka imigrasyon, oswa esponsor." },
    ],
    summaryTitle: "Men sa nou konprann sou sitiyasyon ou.",
    summarySubtitle: "Pran yon moman pou revize — ou ka chanje nenpòt bagay anvan nou kontinye.",
    summaryLabels: { state: "Kote", situation: "Sitiyasyon", goal: "Objektif prensipal", urgency: "Ijans", documents: "Dokiman", support: "Sipò" },
    crisisHeading: "Ou pa pou kont ou.", crisisBody: "Si ou nan danje imedya, rele 911:", crisisContinue: "Kontinye bati plan mwen an kanmenm",
    situations: [
      { value: "student", label: "Etidyan (viza F-1)" },
      { value: "work_visa", label: "Viza travay (H-1B, L-1, O-1, elatriye)" },
      { value: "asylum", label: "Ap chèche azil oswa estati refijye" },
      { value: "undocumented", label: "San papye / pa sèten sou estati mwen" },
      { value: "permanent_resident", label: "Rezidan pèmanan (Kat Vèt)" },
      { value: "citizen_helping", label: "Sitwayen ameriken — ap ede yon manm fanmi" },
      { value: "applying_for_other", label: "Mwen ap aplike pou yon lòt moun" },
      { value: "unaccompanied_minor", label: "Minè san akonpayatè (anba 18 an)" },
      { value: "mixed_status", label: "Fanmi ak estati imigrasyon diferan" },
      { value: "prefer_not_say", label: "Mwen prefere pa di" },
    ],
    goals: [
      { value: "documents", label: "Mete papye mwen yo an òd" },
      { value: "work", label: "Jwenn travay oswa konprann dwa m travay" },
      { value: "housing", label: "Jwenn lojman oswa abri" },
      { value: "healthcare", label: "Jwenn swen sante" },
      { value: "legal", label: "Konekte ak èd legal" },
      { value: "rights", label: "Konprann dwa mwen yo" },
      { value: "safety", label: "Rete an sekirite sou entènèt" },
      { value: "family", label: "Sipòte yon manm fanmi" },
      { value: "unsure", label: "Mwen poko sèten" },
    ],
    urgencies: [
      { value: "crisis", label: "Mwen bezwen èd imedyatman", sub: "Mwen nan yon sitiyasyon kriz oswa ki pa an sekirite" },
      { value: "urgent", label: "Sa a ap prese", sub: "Mwen bezwen èd nan kèlke jou" },
      { value: "soon", label: "Nan kèlke semèn", sub: "Enpòtan men pa ijan" },
      { value: "planning", label: "Mwen ap planifye davans", sub: "Pa gen ijans imedyat" },
    ],
    documents: [
      { value: "passport", label: "Paspo", tip: "Dokiman vwayaj ofisyèl peyi ou bay. Gen foto ou ak yon nimewo inik." },
      { value: "national_id", label: "Kat idantite nasyonal / Kat gouvènman", tip: "Kat idantite gouvènman peyi ou bay — lisans, kat nasyonal, elatriye." },
      { value: "visa", label: "Viza", tip: "Mak oswa otorizasyon elektwonik ki pèmèt ou antre Etazini légalman." },
      { value: "asylum_papers", label: "Papye azil / I-589", tip: "Dokiman ki montre ou aplike pou pwoteksyon oswa ou resevwa li nan Etazini." },
      { value: "green_card", label: "Kat Vèt (I-551)", tip: "Kat Rezidan Pèmanan — prèv ou ka viv ak travay nan Etazini pou toujou." },
      { value: "ead", label: "Pèmi travay (Kat EAD)", tip: "Dokiman otorizasyon travay — pèmèt ou travay légalman nan Etazini." },
      { value: "none", label: "Okenn nan sa yo", tip: "" },
      { value: "prefer_not_say", label: "Mwen prefere pa di", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "Wi — mwen gen yon travayè sosyal" },
      { value: "lawyer", label: "Wi — mwen gen yon avoka imigrasyon" },
      { value: "sponsor", label: "Wi — mwen gen yon esponsor" },
      { value: "none", label: "Non — mwen ap navige sa poukont mwen" },
      { value: "helping_other", label: "Mwen ap ede yon lòt moun" },
    ],
    crisisLinks: [
      { label: "RAICES Liy Ijans", href: "https://www.raicestexas.org" },
      { label: "IRC Sipò Kriz", href: "https://www.rescue.org" },
    ],
  },
  am: {
    stepOf: (n, t) => `ደረጃ ${n} ከ ${t}`,
    back: "← ተመለስ", continue: "ቀጥል →", confirm: "ይህ ትክክል ነው →",
    edit: "መልሶቼን አርም", loading: "የእርስዎ ግላዊ እቅድ እየተዘጋጀ ነው…",
    steps: [
      { question: "አሁን የት ነዎት?", sub: "እርስዎ ያሉበትን የአሜሪካ ግዛት ይምረጡ።" },
      { question: "አሁን ያለዎትን ሁኔታ በትክክል የሚገልጸው ምንድን ነው?", sub: "ቅርብ የሆነውን ይምረጡ — ኋላ ማዘመን ይችላሉ።" },
      { question: "አሁን ዋና ዓላማዎ ምንድን ነው?", sub: "እቅድዎን ይህን መሰረት አድርገን እናዘጋጃለን።" },
      { question: "ይህ ምን ያህል አስቸኳይ ነው?", sub: "ይህ ቀጣይ እርምጃዎችዎን ቅደም ተከተል ለማዘጋጀት ይረዳናል።" },
      { question: "ከዚህ ሰነዶች መካከል አንዳቸውን ያስቀምጣሉ?", sub: "የሚመለከቱዎትን ሁሉ ይምረጡ።" },
      { question: "አስቀድሞ ድጋፍ አለዎት?", sub: "የጉዳይ ሰራተኛ፣ የፍልሰት ጠበቃ ወይም ጠባቂ።" },
    ],
    summaryTitle: "ስለ ሁኔታዎ እንደምናውቀው ይኸው ነው።",
    summarySubtitle: "ለማሻሻያ ዕድል አለዎት — ከመቀጠልዎ በፊት ማንኛውንም ነገር ማስተካከል ይችላሉ።",
    summaryLabels: { state: "ቦታ", situation: "ሁኔታ", goal: "ዋና ዓላማ", urgency: "አስቸኳይነት", documents: "ሰነዶች", support: "ድጋፍ" },
    crisisHeading: "ብቻዎ አይደሉም።", crisisBody: "ወዲያውኑ አደጋ ውስጥ ከሆኑ 911 ይደውሉ:", crisisContinue: "ቀጥሎ እቅዴን እናዘጋጅ",
    situations: [
      { value: "student", label: "ተማሪ (F-1 ቪዛ)" },
      { value: "work_visa", label: "የሥራ ቪዛ (H-1B፣ L-1፣ O-1፣ ወዘተ)" },
      { value: "asylum", label: "ጥገኝነት ወይም የስደተኛ ደረጃ እጠይቃለሁ" },
      { value: "undocumented", label: "ሰነድ የለኝም / ስለ ሁኔታዬ እርግጠኛ አይደለሁም" },
      { value: "permanent_resident", label: "ቋሚ ነዋሪ (ግሪን ካርድ)" },
      { value: "citizen_helping", label: "የአሜሪካ ዜጋ — የቤተሰብ አባልን እረዳለሁ" },
      { value: "applying_for_other", label: "ለሌላ ሰው አመልካቻ ወይም ፍለጋ እያደረግሁ ነው" },
      { value: "unaccompanied_minor", label: "ያለ አጃቢ ወጣት (ከ18 ዓመት በታች)" },
      { value: "mixed_status", label: "ድብልቅ የፍልሰት ሁኔታ ያለው ቤተሰብ" },
      { value: "prefer_not_say", label: "መናገር አልፈልግም" },
    ],
    goals: [
      { value: "documents", label: "ሰነዶቼን ማደራጀት" },
      { value: "work", label: "ሥራ ማግኘት ወይም የሥራ መብቶቼን መረዳት" },
      { value: "housing", label: "ቤት ወይም መጠለያ ማግኘት" },
      { value: "healthcare", label: "የጤና አገልግሎት ማግኘት" },
      { value: "legal", label: "ከህጋዊ ድጋፍ ጋር መገናኘት" },
      { value: "rights", label: "መብቶቼን መረዳት" },
      { value: "safety", label: "በኢንተርኔት ደህንነት መጠበቅ" },
      { value: "family", label: "የቤተሰብ አባልን መደገፍ" },
      { value: "unsure", label: "እስካሁን እርግጠኛ አይደለሁም" },
    ],
    urgencies: [
      { value: "crisis", label: "አሁኑኑ እርዳታ እፈልጋለሁ", sub: "ቀውስ ወይም ደህንነቴ ስጋት ላይ ነው" },
      { value: "urgent", label: "ይህ አስቸኳይ ነው", sub: "በጥቂት ቀናት ውስጥ እርዳታ እፈልጋለሁ" },
      { value: "soon", label: "በጥቂት ሳምንታት ውስጥ", sub: "አስፈላጊ ነው ግን አደጋ አይደለም" },
      { value: "planning", label: "አስቀድሜ እቅድ እያወጣሁ ነው", sub: "ወቅታዊ አስቸኳይ ፍላጎት የለም" },
    ],
    documents: [
      { value: "passport", label: "ፓስፖርት", tip: "ከአገርዎ መንግስት የተሰጠ ኦፊሴላዊ የጉዞ ሰነድ። ፎቶ እና ልዩ ቁጥር አለው።" },
      { value: "national_id", label: "ብሔራዊ መታወቂያ ካርድ", tip: "ከአገርዎ መንግስት የተሰጠ መታወቂያ — ፈቃድ፣ ብሔራዊ ካርድ፣ ወዘተ።" },
      { value: "visa", label: "ቪዛ", tip: "ወደ አሜሪካ ህጋዊ ለመግባት የሚፈቅድ ማህተም ወይም ኤሌክትሮኒካዊ ፈቃድ።" },
      { value: "asylum_papers", label: "የጥገኝነት ሰነዶች / I-589", tip: "በአሜሪካ ጥበቃ ለማግኘት ያመለከቱ ወይም ያገኙ መሆኑን የሚያሳዩ ሰነዶች።" },
      { value: "green_card", label: "ግሪን ካርድ (I-551)", tip: "ቋሚ የነዋሪ ካርድ — በአሜሪካ ቋሚ ሆኖ መኖርና መስራት የሚቻልበት ማስረጃ።" },
      { value: "ead", label: "የሥራ ፈቃድ (EAD ካርድ)", tip: "የሥራ ፈቃድ ሰነድ — በአሜሪካ ህጋዊ ሆኖ ለመስራት ይፈቅዳል።" },
      { value: "none", label: "ከዚህ ውስጥ አንዳቸውም የለኝም", tip: "" },
      { value: "prefer_not_say", label: "መናገር አልፈልግም", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "አዎ — ኬዝ ዎርከር አለኝ" },
      { value: "lawyer", label: "አዎ — የፍልሰት ጠበቃ አለኝ" },
      { value: "sponsor", label: "አዎ — ጠባቂ አለኝ" },
      { value: "none", label: "አይ — ብቻዬን እየሄድኩ ነው" },
      { value: "helping_other", label: "ሌላ ሰውን እረዳለሁ" },
    ],
    crisisLinks: [
      { label: "RAICES ድንገተኛ ስልክ", href: "https://www.raicestexas.org" },
      { label: "IRC ቀውስ ድጋፍ", href: "https://www.rescue.org" },
    ],
  },
  so: {
    stepOf: (n, t) => `Tallaabo ${n} / ${t}`,
    back: "← Dib", continue: "Sii wad →", confirm: "Tan ayaa sax →",
    edit: "Wax ka beddel jawaabaheeyga", loading: "Qorshahaaaga shakhsi ahaaneed waa la diyaarinayaa…",
    steps: [
      { question: "Hadda xagee baad joogtaa?", sub: "Dooro gobolka Mareykanka ee aad ku nooshahay." },
      { question: "Kaayihee ayaa ugu wanaagsan xaaladaada hadda?", sub: "Dooro xulashada ugu dhow." },
      { question: "Waa maxay yoolkaaga ugu muhiimsan hadda?", sub: "Qorshahaaaga ayaanu ku dhisi doonaa." },
      { question: "Intee le'eg ayay xaaladu deg degta u tahay?", sub: "Kani wuxuu naga caawiyaa in aan koobaabno tallaabadaada xigta." },
      { question: "Ma haysataa mid ka mid ah dukumiintiyadan?", sub: "Dooro dhammaan kuwa kuu khuseeya." },
      { question: "Ma haysataa taageero horeba?", sub: "Shaqaale kiis, qareen socdaalka, ama dammaanad." },
    ],
    summaryTitle: "Waa kan waxa aan ka fahmay xaaladaada.",
    summarySubtitle: "Daqiiqad iska eeg — waxaad wax ka beddeli kartaa ka hor inta aanan sii wadanin.",
    summaryLabels: { state: "Goob", situation: "Xaalad", goal: "Yoolka ugu muhiimsan", urgency: "Deg deg", documents: "Dukumiintiyada", support: "Taageero" },
    crisisHeading: "Adiga maha keligaa.", crisisBody: "Haddaad khatar degdeg ah ku jirto, wac 911:", crisisContinue: "Sii wad oo dhis qorshahayga",
    situations: [
      { value: "student", label: "Arday (F-1 fiisa)" },
      { value: "work_visa", label: "Fiisa shaqo (H-1B, L-1, O-1, iwm)" },
      { value: "asylum", label: "Codsanaya xadgudub ama xaalad qaxooti" },
      { value: "undocumented", label: "Warqad la'aan / xaaladda socdaalka ma garanayso" },
      { value: "permanent_resident", label: "Deganaanshaha joogta ah (Kaarka Cagaarka ah)" },
      { value: "citizen_helping", label: "Muwaadin Mareekan — u caawiya xubin qoys" },
      { value: "applying_for_other", label: "Waxaan codsanayaa ama raadinayaa qof kale" },
      { value: "unaccompanied_minor", label: "Qof yar oo aan la socod lahayn (hoostooda 18)" },
      { value: "mixed_status", label: "Qoys leh xaaladdo socdaal oo kala duwan" },
      { value: "prefer_not_say", label: "Ma rabin in aan sheego" },
    ],
    goals: [
      { value: "documents", label: "Warqadaheeyga hagaajin" },
      { value: "work", label: "Shaqo raadso ama xuquuqdeyda shaqada faham" },
      { value: "housing", label: "Guri ama magan-galo raadso" },
      { value: "healthcare", label: "Daryeel caafimaad hel" },
      { value: "legal", label: "Caawimada sharciga la xiriir" },
      { value: "rights", label: "Xuquuqdeyda faham" },
      { value: "safety", label: "Online amaan ahaanshaha" },
      { value: "family", label: "Xubin qoys taageero" },
      { value: "unsure", label: "Weli ma hubo" },
    ],
    urgencies: [
      { value: "crisis", label: "Caawimo degdeg ah baan u baahnahay", sub: "Xaalad khatar ah ama aan amaan ahayn ayaan ku jiraa" },
      { value: "urgent", label: "Tani waa deg-deg", sub: "Caawimo dhowr maalmood gudahood baan u baahnahay" },
      { value: "soon", label: "Dhowr toddobaad gudahood", sub: "Muhiim laakiin xaalad degdeg ah ma aha" },
      { value: "planning", label: "Hore baan u qorsheynayaa", sub: "Degdeg aan la'dahay" },
    ],
    documents: [
      { value: "passport", label: "Baasaboor", tip: "Warqad safar rasmi ah dalkaaga ka soo saartay. Sawir iyo nambarka gaarka ah ayuu leeyahay." },
      { value: "national_id", label: "Aqoonsiga Qaranka / Aqoonsiga Dowladda", tip: "Aqoonsi dowladda dalkaaga ka soo saartay — ruqsad waddaadid, kaarku qaranka, iwm." },
      { value: "visa", label: "Fiisa", tip: "Shaati ama fasax elektaroonig ah oo kuu oggolaanaya inaad si sharci ah Maraykanka gasho." },
      { value: "asylum_papers", label: "Warqadaha xadgudubka / I-589", tip: "Dukumiintiyada muujinaya inaad codsatay ama hesho ilaalin Maraykanka." },
      { value: "green_card", label: "Kaarka Cagaarka (I-551)", tip: "Kaarka Deganaanshaha Joogta ah — caddayn aad si joogto ah ugu noolaan karto oo ka shaqaysan karto Maraykanka." },
      { value: "ead", label: "Ruqsadda Shaqada (EAD Kaarka)", tip: "Dukumiintiga Oggolaanshaha Shaqada — kuu oggolaanaya inaad si sharci ah Maraykanka ku shaqayso." },
      { value: "none", label: "Mid kasta oo ka mid ah ma hayo", tip: "" },
      { value: "prefer_not_say", label: "Ma rabin in aan sheego", tip: "" },
    ],
    support: [
      { value: "caseworker", label: "Haa — shaqaale kiis ayaan leeyahay" },
      { value: "lawyer", label: "Haa — qareen socdaal ayaan leeyahay" },
      { value: "sponsor", label: "Haa — dammaanad ayaan leeyahay" },
      { value: "none", label: "Maya — keligey ayaan waxan maaraynayaa" },
      { value: "helping_other", label: "Qof kale ayaan caawiyayaa" },
    ],
    crisisLinks: [
      { label: "RAICES Xarunta Degdegga", href: "https://www.raicestexas.org" },
      { label: "IRC Taageerada Xaaladda", href: "https://www.rescue.org" },
    ],
  },
};

// ─── Merge helper ─────────────────────────────────────────────────────────────
function fallback(value, key, lang, defaultVal) {
  if (value) return value;
  console.warn(`[i18n] Missing "${key}" translation for language "${lang}". Falling back to English.`);
  return defaultVal;
}

function getT(lang) {
  if (T[lang]) return T[lang];
  const p = PARTIAL[lang];
  if (!p) {
    console.warn(`[i18n] No translation found for language "${lang}". Falling back to English.`);
    return T.en;
  }
  return {
    ...T.en, ...p,
    steps: fallback(p.steps, "steps", lang, T.en.steps),
    situations: fallback(p.situations, "situations", lang, T.en.situations),
    goals: fallback(p.goals, "goals", lang, T.en.goals),
    urgencies: fallback(p.urgencies, "urgencies", lang, T.en.urgencies),
    documents: fallback(p.documents, "documents", lang, T.en.documents),
    support: fallback(p.support, "support", lang, T.en.support),
    summaryLabels: { ...T.en.summaryLabels, ...(p.summaryLabels || {}) },
    crisisLinks: fallback(p.crisisLinks, "crisisLinks", lang, T.en.crisisLinks),
  };
}

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","District of Columbia","Puerto Rico","Outside the US",
];

const SITUATION_TO_VISA = {
  student: "F-1 Student Visa", work_visa: "H-1B / Work Visa",
  asylum: "Asylum / Refugee", undocumented: "Undocumented / Unknown Status",
  permanent_resident: "Permanent Resident (Green Card)",
  citizen_helping: "US Citizen (assisting family)", applying_for_other: "Other / Third Party",
  unaccompanied_minor: "Unaccompanied Minor", mixed_status: "Mixed-Status Family",
  prefer_not_say: "Prefer Not to Say",
};

const TOTAL_STEPS = 6;

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  if (!text) return null;
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button style={tipStyles.btn}
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)} onBlur={() => setShow(false)}
        aria-label="What is this?">?</button>
      {show && <div style={tipStyles.box}>{text}</div>}
    </span>
  );
}
const tipStyles = {
  btn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "18px", height: "18px",
    background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)",
    borderRadius: "50%", color: "#c4b5fd", fontSize: "11px", fontWeight: "700",
    cursor: "pointer", marginLeft: "7px", fontFamily: "sans-serif", lineHeight: 1, verticalAlign: "middle",
  },
  box: {
    position: "absolute", bottom: "130%", left: "50%", transform: "translateX(-50%)",
    background: "#141228", border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: "12px", padding: "10px 14px", width: "220px",
    color: "#c4b5fd", fontSize: "13px", lineHeight: 1.5, zIndex: 200,
    pointerEvents: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
  },
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function OnboardingForm({ language }) {
  const navigate = useNavigate();
  const t = getT(language);
  const isRTL = language === "ar";

  const [step, setStep] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    state: "", situation: "", goal: "", urgency: "", documents: [], support: "",
  });

  const set = (field, value) => setProfile((p) => ({ ...p, [field]: value }));

  const toggleDoc = (value) => {
    const exclusive = ["none", "prefer_not_say"];
    setProfile((p) => {
      let docs = [...p.documents];
      if (exclusive.includes(value)) {
        docs = docs.includes(value) ? [] : [value];
      } else {
        docs = docs.filter((d) => !exclusive.includes(d));
        docs = docs.includes(value) ? docs.filter((d) => d !== value) : [...docs, value];
      }
      return { ...p, documents: docs };
    });
  };

  const canAdvance = () => {
    if (step === 0) return !!profile.state;
    if (step === 1) return !!profile.situation;
    if (step === 2) return !!profile.goal;
    if (step === 3) return !!profile.urgency;
    if (step === 4) return profile.documents.length > 0;
    if (step === 5) return !!profile.support;
    return false;
  };

  const advance = () => {
    if (step === 3 && profile.urgency === "crisis") { setShowCrisis(true); return; }
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else setShowSummary(true);
  };

  const submit = async () => {
    setLoading(true);
    const visa_type = SITUATION_TO_VISA[profile.situation] || profile.situation;
    const payload = {
      visa_type, state: profile.state,
      family: profile.situation === "mixed_status" ? "mixed-status family" : "",
      time_in_us: "", goal: profile.goal, language,
      urgency: profile.urgency, documents: profile.documents, has_support: profile.support,
    };
    try {
      const [cr, rr, nr] = await Promise.all([
        fetch("/api/checklist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
        fetch("/api/resources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visa_type, state: profile.state, goal: profile.goal, language, urgency: profile.urgency, documents: profile.documents }) }),
        fetch("/api/ngos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visa_type, state: profile.state, goal: profile.goal }) }),
      ]);
      const [checklist, resources, ngos] = await Promise.all([cr.json(), rr.json(), nr.json()]);
      navigate("/dashboard", { state: { profile: { ...profile, visa_type, language }, checklist, resources, ngos } });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // ── crisis ──────────────────────────────────────────────────────────────────
  if (showCrisis) {
    return (
      <div style={{ ...styles.card, direction: isRTL ? "rtl" : "ltr" }}>
        <div style={styles.crisisIcon} />
        <h2 style={{ ...styles.question, color: "#f87171" }}>{t.crisisHeading}</h2>
        <p style={styles.sub}>{t.crisisBody}</p>
        <div style={styles.crisisLinks}>
          {t.crisisLinks.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" style={styles.crisisLink}>{l.label} →</a>
          ))}
        </div>
        <button style={{ ...styles.btnPrimary, marginTop: "24px" }} onClick={() => { setShowCrisis(false); setStep(4); }}>
          {t.crisisContinue}
        </button>
      </div>
    );
  }

  // ── loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.card}>
        <div style={styles.spinner} />
        <p style={{ ...styles.sub, marginTop: "24px" }}>{t.loading}</p>
      </div>
    );
  }

  // ── profile summary ─────────────────────────────────────────────────────────
  if (showSummary) {
    const sl = t.summaryLabels;
    const sitLabel = t.situations.find((s) => s.value === profile.situation)?.label || profile.situation;
    const goalLabel = t.goals.find((g) => g.value === profile.goal)?.label || profile.goal;
    const urgLabel = t.urgencies.find((u) => u.value === profile.urgency)?.label || profile.urgency;
    const supLabel = t.support.find((s) => s.value === profile.support)?.label || profile.support;
    const docLabels = profile.documents.map((d) => t.documents.find((doc) => doc.value === d)?.label || d).join(", ");
    const rows = [
      { key: "state", label: sl.state, value: profile.state, si: 0 },
      { key: "situation", label: sl.situation, value: sitLabel, si: 1 },
      { key: "goal", label: sl.goal, value: goalLabel, si: 2 },
      { key: "urgency", label: sl.urgency, value: urgLabel, si: 3 },
      { key: "documents", label: sl.documents, value: docLabels, si: 4 },
      { key: "support", label: sl.support, value: supLabel, si: 5 },
    ];
    return (
      <div style={{ ...styles.card, direction: isRTL ? "rtl" : "ltr" }}>
        <div style={styles.summaryIcon} />
        <h2 style={styles.question}>{t.summaryTitle}</h2>
        <p style={{ ...styles.sub, marginBottom: "28px" }}>{t.summarySubtitle}</p>
        <div style={styles.summaryTable}>
          {rows.map(({ key, label, value, si }) => (
            <div key={key} style={styles.summaryRow}>
              <span style={styles.summaryLabel}>{label}</span>
              <div style={styles.summaryValueWrap}>
                <span style={styles.summaryValue}>{value || "—"}</span>
                <button style={styles.editBtn} onClick={() => { setShowSummary(false); setStep(si); }}>Edit</button>
              </div>
            </div>
          ))}
        </div>
        <button style={styles.btnPrimary} onClick={submit}>{t.confirm}</button>
      </div>
    );
  }

  // ── step screens ────────────────────────────────────────────────────────────
  const stepData = t.steps[step];
  return (
    <div style={{ ...styles.card, direction: isRTL ? "rtl" : "ltr" }}>
      <div style={styles.progress}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} style={{ ...styles.dot, background: i < step ? "#8b5cf6" : i === step ? "#c4b5fd" : "rgba(139,92,246,0.15)", width: i === step ? "28px" : "8px" }} />
        ))}
      </div>
      <div style={styles.stepLabel}>{t.stepOf(step + 1, TOTAL_STEPS)}</div>
      <h2 style={styles.question}>{stepData.question}</h2>
      <p style={styles.sub}>{stepData.sub}</p>

      {step === 0 && (
        <div style={styles.optionGrid}>
          <select value={profile.state} onChange={(e) => set("state", e.target.value)} style={styles.select}>
            <option value="">— Select a state —</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {step === 1 && (
        <div style={styles.optionList}>
          {t.situations.map(({ value, label }) => (
            <button key={value} style={{ ...styles.optionBtn, ...(profile.situation === value ? styles.optionBtnActive : {}) }} onClick={() => set("situation", value)}>{label}</button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div style={styles.optionGrid2}>
          {t.goals.map(({ value, label }) => (
            <button key={value} style={{ ...styles.goalCard, ...(profile.goal === value ? styles.goalCardActive : {}) }} onClick={() => set("goal", value)}>{label}</button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div style={styles.optionList}>
          {t.urgencies.map(({ value, label, sub }) => (
            <button key={value} style={{ ...styles.optionBtn, ...(profile.urgency === value ? styles.optionBtnActive : {}), flexDirection: "column", alignItems: "flex-start", gap: "2px" }} onClick={() => set("urgency", value)}>
              <span style={{ fontSize: "15px", fontWeight: "600" }}>{label}</span>
              <span style={{ fontSize: "13px", color: profile.urgency === value ? "#bfdbfe" : "#64748b" }}>{sub}</span>
            </button>
          ))}
        </div>
      )}

      {step === 4 && (
        <div style={styles.optionList}>
          {t.documents.map(({ value, label, tip }) => (
            <button key={value} style={{ ...styles.optionBtn, ...(profile.documents.includes(value) ? styles.optionBtnActive : {}), justifyContent: "flex-start", gap: "10px" }} onClick={() => toggleDoc(value)}>
              <span style={{ ...styles.checkbox, ...(profile.documents.includes(value) ? styles.checkboxActive : {}) }}>{profile.documents.includes(value) ? "✓" : ""}</span>
              <span>{label}</span>
              <Tooltip text={tip} />
            </button>
          ))}
        </div>
      )}

      {step === 5 && (
        <div style={styles.optionList}>
          {t.support.map(({ value, label }) => (
            <button key={value} style={{ ...styles.optionBtn, ...(profile.support === value ? styles.optionBtnActive : {}) }} onClick={() => set("support", value)}>{label}</button>
          ))}
        </div>
      )}

      <div style={styles.navRow}>
        {step > 0 && <button style={styles.btnBack} onClick={() => setStep((s) => s - 1)}>{t.back}</button>}
        <button
          style={{ ...styles.btnPrimary, opacity: canAdvance() ? 1 : 0.4, cursor: canAdvance() ? "pointer" : "not-allowed", marginLeft: step === 0 ? "auto" : undefined }}
          onClick={advance} disabled={!canAdvance()}
        >
          {step === TOTAL_STEPS - 1 ? t.confirm : t.continue}
        </button>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  card: { width: "100%", maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 4px", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" },
  progress: { display: "flex", gap: "6px", alignItems: "center", marginBottom: "16px" },
  dot: { height: "8px", borderRadius: "4px", transition: "width 0.35s ease, background 0.35s ease" },
  stepLabel: { color: "#4a4768", fontSize: "12px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "20px" },
  question: { color: "#f0ecff", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: "800", textAlign: "center", lineHeight: 1.2, margin: "0 0 8px 0", letterSpacing: "-0.02em" },
  sub: { color: "#8b8ba7", fontSize: "14px", textAlign: "center", lineHeight: 1.65, margin: "0 0 28px 0" },
  optionList: { width: "100%", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" },
  optionBtn: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "14px", padding: "14px 18px", color: "#c4b5fd", fontSize: "14px", fontWeight: "500", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", transition: "border-color 0.2s, background 0.2s, color 0.2s", letterSpacing: "-0.01em" },
  optionBtnActive: { background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.55)", color: "#f0ecff" },
  optionGrid: { width: "100%", marginBottom: "28px" },
  optionGrid2: { width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "28px" },
  goalCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "14px", padding: "14px 16px", color: "#c4b5fd", fontSize: "13px", fontWeight: "500", cursor: "pointer", textAlign: "left", transition: "border-color 0.2s, background 0.2s, color 0.2s", lineHeight: 1.45, letterSpacing: "-0.01em" },
  goalCardActive: { background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.55)", color: "#f0ecff" },
  select: { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "14px", padding: "14px 18px", color: "#f0ecff", fontSize: "15px", cursor: "pointer", appearance: "none", fontFamily: "'Inter', system-ui, sans-serif" },
  checkbox: { width: "20px", height: "20px", minWidth: "20px", borderRadius: "6px", border: "2px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", fontWeight: "700", transition: "background 0.2s, border-color 0.2s" },
  checkboxActive: { background: "#8b5cf6", borderColor: "#8b5cf6" },
  navRow: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginTop: "4px" },
  btnPrimary: { background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", color: "#fff", border: "none", borderRadius: "12px", padding: "14px 32px", fontSize: "15px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 20px rgba(139,92,246,0.35)", transition: "transform 0.2s, opacity 0.2s", letterSpacing: "-0.01em" },
  btnBack: { background: "none", border: "none", color: "#4a4768", fontSize: "14px", fontWeight: "500", cursor: "pointer", padding: "14px 0", transition: "color 0.2s", letterSpacing: "-0.01em" },
  summaryIcon: { width: "44px", height: "44px", borderRadius: "50%", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", marginBottom: "16px" },
  summaryTable: { width: "100%", background: "rgba(20,18,40,0.8)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "16px", overflow: "hidden", marginBottom: "28px" },
  summaryRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(139,92,246,0.08)" },
  summaryLabel: { color: "#4a4768", fontSize: "12px", fontWeight: "600", minWidth: "100px", textTransform: "uppercase", letterSpacing: "0.05em" },
  summaryValueWrap: { display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "flex-end" },
  summaryValue: { color: "#c4b5fd", fontSize: "14px", textAlign: "right", fontWeight: "500" },
  editBtn: { background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#c4b5fd", fontSize: "11px", fontWeight: "600", cursor: "pointer", padding: "3px 8px", borderRadius: "6px", letterSpacing: "0.02em" },
  crisisIcon: { width: "52px", height: "52px", borderRadius: "50%", background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)", marginBottom: "16px" },
  crisisLinks: { width: "100%", display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" },
  crisisLink: { display: "block", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", padding: "14px 18px", color: "#fca5a5", fontSize: "14px", fontWeight: "500", textDecoration: "none" },
  spinner: { width: "40px", height: "40px", border: "3px solid rgba(139,92,246,0.15)", borderTop: "3px solid #8b5cf6", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};

if (typeof document !== "undefined" && !document.getElementById("ep-spin")) {
  const s = document.createElement("style");
  s.id = "ep-spin";
  s.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(s);
}
