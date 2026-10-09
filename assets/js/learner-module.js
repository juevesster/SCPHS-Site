// ============================================================
// LEARNER MODULE GENERATOR
// Takes an ILAW lesson plan → produces a student-facing module
// Self-contained: includes its own helpers, no external deps.
// ============================================================

// ---------- Local helpers ----------
const esc = s => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const shorten = (text, max = 400) => {
  if (!text) return "";
  const t = String(text).trim();
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
};

const simplifySentence = (s) => {
  return String(s || "")
    .replace(/\b(utilize|utilise)\b/gi, "use")
    .replace(/\bcommence\b/gi, "start")
    .replace(/\bterminate\b/gi, "end")
    .replace(/\bendeavor\b/gi, "try")
    .replace(/\bdemonstrate\b/gi, "show")
    .replace(/\bcomprehend\b/gi, "understand")
    .replace(/\bsubsequently\b/gi, "then")
    .replace(/\bnevertheless\b/gi, "still");
};

// ============================================================
// COLLECT LESSON DATA from the ILAW editor
// ============================================================
export function collectLessonData() {
  const val = (id) => {
    const el = document.getElementById(id);
    return el ? (el.value || "").trim() : "";
  };

  const checked = Array.from(document.querySelectorAll("[data-comp-code]:checked"));
  const competencies = checked.map(cb => ({
    code: cb.dataset.compCode,
    text: cb.dataset.compText,
  }));

  const manual = document.getElementById("manualComps");
  if (manual && manual.value.trim() && !competencies.length) {
    manual.value.split("\n").map(l => l.trim()).filter(Boolean).forEach((line, i) => {
      competencies.push({ code: `M${i + 1}`, text: line });
    });
  }

  const rubric = {};
  [
    "intentions_clear", "intentions_coherent", "learning_clear",
    "learning_designed", "integration_maximized", "inclusive",
    "assessment_integrated", "assessment_evidence", "interventions_actionable"
  ].forEach(key => {
    const r = document.querySelector(`input[name="rubric_${key}"]:checked`);
    rubric[key] = r?.value || "not_yet";
  });

  const aiDeclValue = document.querySelector('input[name="aiDecl"]:checked')?.value || "not-used";

  return {
    lessonTitle:         val("f-lessonTitle"),
    subjectName:         document.getElementById("pickSubject")?.selectedOptions?.[0]?.textContent || "",
    subjectCode:         document.getElementById("pickSubject")?.value || "",
    gradeLevel:          document.getElementById("pickGrade")?.value || "",
    term:                document.getElementById("pickTerm")?.value || "",
    week:                document.getElementById("pickWeek")?.value || "",
    schoolYear:          document.getElementById("pickYear")?.value || "",
    teacherName:         val("f-teacherName"),
    section:             val("f-section"),
    noOfSessions:        val("f-noOfSessions"),
    references:          val("f-references"),
    contentStandard:     val("f-contentStandard"),
    performanceStandard: val("f-performanceStandard"),
    learnerContext:      val("f-learnerContext"),
    preLesson:           val("f-preLesson"),
    lessonFlow:          val("f-lessonFlow"),
    materials:           val("f-materialsText"),
    integration:         val("f-integration"),
    assessment:          val("f-assessment"),
    extendedLearning:    val("f-extendedLearning"),
    waysForward:         val("f-waysForward"),
    competencies,
    rubric,
    aiDeclaration:       aiDeclValue,
    preparedByName:      val("f-sig-preparedName"),
    preparedByPosition:  val("f-sig-preparedPos"),
    checkedByName:       val("f-sig-checkedName"),
    checkedByPosition:   val("f-sig-checkedPos"),
    notedByName:         val("f-sig-notedName"),
    notedByPosition:     val("f-sig-notedPos"),
  };
}

// ============================================================
// URL helpers — auto-detect current domain
// ============================================================
function getCurrentBaseUrl() {
  // Uses the actual page URL — works on any host / repo name
  const origin = location.origin;
  const path = location.pathname.replace(/\/[^/]*$/, ""); // strip filename
  return origin + path;
}

function getPublicUrl(slug) {
  return `${getCurrentBaseUrl()}/m.html?slug=${encodeURIComponent(slug)}`;
}

function getPublicUrlDisplay(slug) {
  // Short display version for printing
  return `m.html?slug=${slug}`;
}

function getQrUrl(slug) {
  const fullUrl = getPublicUrl(slug);
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(fullUrl)}&color=0f2b4f&bgcolor=ffffff`;
}

// ============================================================
// BUILD LEARNER MODULE HTML
// ============================================================
export function buildLearnerModuleHTML(lessonRaw, cfg = {}, options = {}) {
  // Defensive defaults — never let undefined arrays crash rendering
  const lesson = {
    ...lessonRaw,
    competencies:        Array.isArray(lessonRaw?.competencies) ? lessonRaw.competencies : [],
    competencyTexts:     Array.isArray(lessonRaw?.competencyTexts) ? lessonRaw.competencyTexts : [],
    competencyCodes:     Array.isArray(lessonRaw?.competencyCodes) ? lessonRaw.competencyCodes : [],
    lessonFlow:          typeof lessonRaw?.lessonFlow === "string" ? lessonRaw.lessonFlow : "",
    contentStandard:     typeof lessonRaw?.contentStandard === "string" ? lessonRaw.contentStandard : "",
    performanceStandard: typeof lessonRaw?.performanceStandard === "string" ? lessonRaw.performanceStandard : "",
    materialsText:       typeof lessonRaw?.materialsText === "string" ? lessonRaw.materialsText : "",
    materials:           typeof lessonRaw?.materials === "string" ? lessonRaw.materials : "",
    learnerContext:      typeof lessonRaw?.learnerContext === "string" ? lessonRaw.learnerContext : "",
    subjectName:         typeof lessonRaw?.subjectName === "string" ? lessonRaw.subjectName : "",
    subjectCode:         typeof lessonRaw?.subjectCode === "string" ? lessonRaw.subjectCode : "",
    gradeLevel:          typeof lessonRaw?.gradeLevel === "string" ? lessonRaw.gradeLevel : "",
    lessonTitle:         typeof lessonRaw?.lessonTitle === "string" ? lessonRaw.lessonTitle : "",
    preparedByName:      typeof lessonRaw?.preparedByName === "string" ? lessonRaw.preparedByName : "",
    preparedByPosition:  typeof lessonRaw?.preparedByPosition === "string" ? lessonRaw.preparedByPosition : "",
    checkedByName:       typeof lessonRaw?.checkedByName === "string" ? lessonRaw.checkedByName : "",
    checkedByPosition:   typeof lessonRaw?.checkedByPosition === "string" ? lessonRaw.checkedByPosition : "",
    notedByName:         typeof lessonRaw?.notedByName === "string" ? lessonRaw.notedByName : "",
    notedByPosition:     typeof lessonRaw?.notedByPosition === "string" ? lessonRaw.notedByPosition : "",
    publicSlug:          typeof lessonRaw?.publicSlug === "string" ? lessonRaw.publicSlug : "",
    schoolYear:          typeof lessonRaw?.schoolYear === "string" ? lessonRaw.schoolYear : "",
    section:             typeof lessonRaw?.section === "string" ? lessonRaw.section : "",
    term:  typeof lessonRaw?.term === "string" || typeof lessonRaw?.term === "number" ? String(lessonRaw.term) : "",
    week:  typeof lessonRaw?.week === "string" || typeof lessonRaw?.week === "number" ? String(lessonRaw.week) : "",
  };

  const C = {
    depedLogo:        cfg.depedLogo || "",
    schoolLogo:       cfg.schoolLogo || "",
    headerLine1:      cfg.headerLine1 || "Republic of the Philippines",
    headerLine2:      cfg.headerLine2 || "Department of Education",
    region:           cfg.region || "",
    division:         cfg.division || "",
    schoolName:       cfg.schoolName || "",
    schoolAddress:    cfg.schoolAddress || "",
    footerLine1:      cfg.footerLine1 || "",
    preparedByLabel:  cfg.preparedByLabel || "Prepared by:",
    checkedByLabel:   cfg.checkedByLabel  || "Checked by:",
    notedByLabel:     cfg.notedByLabel    || "Noted by:",
  };

  // Simplified content
  const simpleContentStd = simplifySentence(shorten(lesson.contentStandard, 260));
  const simplePerfStd    = simplifySentence(shorten(lesson.performanceStandard, 260));
  const simpleMaterials  = simplifySentence(shorten(lesson.materials || lesson.materialsText, 400));
  const simpleContext    = shorten(lesson.learnerContext, 220);

  const generatedDate = new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric"
  });

  // Safely resolve arrays
  const competencies = Array.isArray(lesson.competencies) ? lesson.competencies : [];

  // AI-enhanced overrides (optional)
  const useAI = !!lesson._aiLessonIntro;

  const greeting = lesson._aiGreeting ||
    "Kumusta! While classes are on hold, let's keep learning. Take your time — this module is for you.";

  const objectives = useAI && Array.isArray(lesson._aiObjectives)
    ? lesson._aiObjectives
    : competencies.map(c => simplifySentence(c.text));

  const lessonIntro = useAI ? lesson._aiLessonIntro : simpleContentStd;

  const lessonSteps = useAI && Array.isArray(lesson._aiLessonSteps)
    ? lesson._aiLessonSteps
    : (lesson.lessonFlow || "").split(/\n+/).filter(Boolean).slice(0, 6);

  const activities = useAI && Array.isArray(lesson._aiActivities)
    ? lesson._aiActivities
    : [
        { title: "Activity 1 — Look Around You", duration: "10 min", instructions: `Find 3 things at home related to ${lesson.subjectName || "this lesson"}. Draw or describe them.` },
        { title: "Activity 2 — Try It Yourself", duration: "15 min", instructions: "Do a simple hands-on practice based on the lesson. Write what you did and noticed." },
        { title: "Activity 3 — Share & Reflect", duration: "5 min",  instructions: "Share what you learned with a family member. Write their reaction." },
      ];

  const selfCheck = useAI && Array.isArray(lesson._aiSelfCheck)
    ? lesson._aiSelfCheck.map(q => ({
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        answer: `${String.fromCharCode(97 + q.correct)} — ${(q.options && q.options[q.correct]) || ""}`,
      }))
    : buildSelfCheckQuestions(lesson);

  const answerKey = selfCheck.map((q, i) => `Q${i + 1}: ${q.answer}`).join(" · ");

  return `
    <div class="lm-page">
      <div class="lm-header">
        ${C.depedLogo ? `<img class="lm-deped-logo" src="${esc(C.depedLogo)}" alt="DepEd" width="60" height="60" loading="eager" crossorigin="anonymous" />` : ""}
        <div class="lm-header-line1">${esc(C.headerLine1)}</div>
        <div class="lm-header-line2">${esc(C.headerLine2)}</div>
        ${C.region ? `<div class="lm-header-line3">${esc(C.region)}</div>` : ""}
        ${C.division ? `<div class="lm-header-line3">${esc(C.division)}</div>` : ""}
      </div>

      <div class="lm-school-banner">
        <div class="lm-school-name">${esc(C.schoolName)}</div>
        ${C.schoolAddress ? `<div class="lm-school-address">${esc(C.schoolAddress)}</div>` : ""}
      </div>

      <div class="lm-title">LEARNING MODULE</div>
      <div class="lm-subtitle">${esc(lesson.lessonTitle || lesson.subjectName)}</div>

      <div class="lm-meta">
        <span><strong>Subject:</strong> ${esc(lesson.subjectName)}</span>
        <span><strong>Grade:</strong> ${esc(lesson.gradeLevel === "K" ? "Kindergarten" : "Grade " + lesson.gradeLevel)}</span>
        <span><strong>Section:</strong> ${esc(lesson.section || "—")}</span>
        <span><strong>Term ${esc(lesson.term)} · Week ${esc(lesson.week)}</strong></span>
        <span><strong>SY:</strong> ${esc(lesson.schoolYear)}</span>
      </div>

      <div class="lm-suspension-banner">
        🌪️ <strong>For Home-Based Learning</strong><br>
        <span>Use this module while classes are suspended. Take your time.
        Answer the activities and self-check at the end. Send a photo of
        your answers to your teacher when classes resume or via Messenger.</span>
      </div>

      <div class="lm-section lm-greeting">
        <div class="lm-section-title">👋 Hello, Learner!</div>
        <p>${esc(greeting)}</p>
        <p><strong>You will need:</strong> this module (printed or on a phone), a pencil or ballpen, and a notebook.</p>
      </div>

      <div class="lm-section">
        <div class="lm-section-title">🎯 What You Will Learn</div>
        ${objectives.length
          ? `<ul class="lm-obj-list">${objectives.map(o => `<li>${esc(simplifySentence(o))}</li>`).join("")}</ul>`
          : `<p class="lm-empty">No specific competencies linked to this lesson yet.</p>`}
      </div>

      ${lessonIntro ? `
      <div class="lm-section">
        <div class="lm-section-title">📖 What This Lesson Is About</div>
        <p>${esc(lessonIntro)}</p>
        ${simplePerfStd ? `<p style="margin-top:6px;"><em>By the end, you should be able to:</em> ${esc(simplePerfStd)}</p>` : ""}
      </div>` : ""}

      ${lessonSteps.length ? `
      <div class="lm-section">
        <div class="lm-section-title">📚 The Lesson</div>
        ${lessonSteps.map((step, i) => {
          const clean = simplifySentence(String(step).trim());
          return clean ? `<div class="lm-lesson-step"><span class="lm-step-num">${i + 1}</span>${esc(clean)}</div>` : "";
        }).join("")}
        ${simpleMaterials ? `<p style="margin-top:8px;font-size:9pt;"><strong>Things you can use:</strong> ${esc(simpleMaterials)}</p>` : ""}
      </div>` : ""}

      <div class="lm-section">
        <div class="lm-section-title">✏️ Activities</div>
        ${activities.map(a => `
          <div class="lm-activity">
            <strong>${esc(a.title)} (${esc(a.duration)})</strong>
            <p>${esc(a.instructions)}</p>
          </div>
        `).join("")}
      </div>

      <div class="lm-section">
        <div class="lm-section-title">❓ Self-Check (5 questions)</div>
        <p style="font-size:9pt;color:#555;margin-bottom:6px;">Circle the letter of the correct answer. Don't peek at the answer key!</p>
        ${selfCheck.map((q, i) => `
          <div class="lm-quiz-item">
            <div class="lm-quiz-q"><strong>${i + 1}.</strong> ${esc(q.question)}</div>
            ${(q.options || []).map((opt, j) => `<div class="lm-quiz-opt">${String.fromCharCode(97 + j)}) ${esc(opt)}</div>`).join("")}
          </div>
        `).join("")}
      </div>

    ${!options.hideAnswerKey ? `
      <div class="lm-answer-key">
        <div class="lm-section-title">🔒 Answer Key (For parent/guardian only)</div>
        <p style="font-size:9pt;">${esc(answerKey)}</p>
        <p style="font-size:8pt;color:#777;margin-top:4px;">Fold or cut this section before giving the module to the learner.</p>
      </div>
      ` : `
      <div class="lm-answer-key" style="background:#fef3c7;border-color:#fcd34d;">
        <div class="lm-section-title" style="color:#92400e;">🔒 Answer Key Not Included</div>
        <p style="font-size:9pt;color:#92400e;margin:0;">
          To protect learner work, the answer key is not included in this online version.
          Parents/guardians may request it from the teacher via Messenger, or find it
          in the printed copy sent home by the teacher.
        </p>
      </div>
      `}

      <div class="lm-section lm-submit">
        <div class="lm-section-title">📱 How to Submit Your Work</div>
        <ol>
          <li>Take a clear photo of your notebook pages.</li>
          <li>Send to your teacher via Messenger GC or private message.</li>
          <li>Keep the printed module for review when classes resume.</li>
        </ol>
        ${lesson.preparedByName ? `<p style="font-size:9pt;margin-top:8px;"><strong>Teacher:</strong> ${esc(lesson.preparedByName)}</p>` : ""}
      </div>

      <div class="lm-signatories">
        <div class="lm-sig">
          <div class="lm-sig-label">${esc(C.preparedByLabel)}</div>
          <div class="lm-sig-name">${esc(lesson.preparedByName || "—")}</div>
          <div class="lm-sig-pos">${esc(lesson.preparedByPosition || "")}</div>
        </div>
        <div class="lm-sig">
          <div class="lm-sig-label">${esc(C.checkedByLabel)}</div>
          <div class="lm-sig-name">${esc(lesson.checkedByName || "—")}</div>
          <div class="lm-sig-pos">${esc(lesson.checkedByPosition || "")}</div>
        </div>
        <div class="lm-sig">
          <div class="lm-sig-label">${esc(C.notedByLabel)}</div>
          <div class="lm-sig-name">${esc(lesson.notedByName || "—")}</div>
          <div class="lm-sig-pos">${esc(lesson.notedByPosition || "")}</div>
        </div>
      </div>

            ${lesson.publicSlug ? `
      <div class="lm-qr-footer">
        <div class="lm-qr-box">
          <div class="lm-qr-label">📱 Scan to view on your phone</div>
          <img class="lm-qr-img"
               src="${getQrUrl(lesson.publicSlug)}"
               alt="QR Code" />
          <div class="lm-qr-url">${esc(getPublicUrlDisplay(lesson.publicSlug))}</div>
        </div>
      </div>
      ` : ""}

      <div class="lm-footer">
        <div>${esc(C.footerLine1)}</div>
        <div>Generated: ${generatedDate} · Learner Module · ${esc(lesson.subjectCode)}-T${esc(lesson.term)}W${esc(lesson.week)}</div>
      </div>
    </div>
  `;
}

// ============================================================
// TEMPLATE-BASED SELF-CHECK GENERATOR
// ============================================================
function buildSelfCheckQuestions(lesson) {
  const questions = [];
  const comps = Array.isArray(lesson.competencies) ? lesson.competencies.slice(0, 3) : [];

  comps.forEach((c) => {
    const text = c && c.text ? String(c.text) : "";
    const topic = text.split(/[.:;]/)[0].trim();
    questions.push({
      question: `Which of the following best describes: "${shorten(topic, 60)}"?`,
      options: [
        "The correct concept discussed in the lesson",
        "A different unrelated idea",
        "An opposite view",
        "None of the above",
      ],
      answer: "a — The correct concept discussed in the lesson",
    });
  });

  questions.push({
    question: `What is the main topic of this lesson in ${lesson.subjectName || "this subject"}?`,
    options: [
      lesson.lessonTitle || lesson.subjectName || "The lesson topic",
      "A previous unrelated lesson",
      "A future advanced topic",
      "An unrelated elective",
    ],
    answer: `a — ${lesson.lessonTitle || lesson.subjectName || "The lesson topic"}`,
  });

  questions.push({
    question: `Which activity helped you understand the lesson best?`,
    options: [
      "Activity 1 — Look Around You",
      "Activity 2 — Try It Yourself",
      "Activity 3 — Share & Reflect",
      "All of the above",
    ],
    answer: "d — All of the above",
  });

  while (questions.length < 5) {
    questions.push({
      question: "True or False: This lesson can be studied at home.",
      options: ["True", "False"],
      answer: "a — True",
    });
  }

  return questions.slice(0, 5);
}