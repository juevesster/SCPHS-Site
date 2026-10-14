// ============================================================
// LAS GENERATOR
// Takes an ILAW lesson plan → produces a student-facing
// LEARNING ACTIVITY SHEET (LAS) using DepEd template structure.
// Content is ORIGINAL — generated from BoW competency (facts only).
// ============================================================

const esc = s => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const shorten = (text, max = 400) => {
  if (!text) return "";
  const t = String(text).trim();
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
};

// ------------------------------------------------------------
// Collect lesson data from the ILAW editor (mirrors collectLessonData)
// ------------------------------------------------------------
export function collectLASData() {
  const val = (id) => {
    const el = document.getElementById(id);
    return el ? (el.value || "").trim() : "";
  };

  const checked = Array.from(document.querySelectorAll("[data-comp-code]:checked"));
  const competencies = checked.map(cb => ({
    code: cb.dataset.compCode,
    text: cb.dataset.compText,
  }));

  // Fallback to manual competencies if none checked
  const manual = document.getElementById("manualComps");
  if (manual && manual.value.trim() && !competencies.length) {
    manual.value.split("\n").map(l => l.trim()).filter(Boolean).forEach((line, i) => {
      competencies.push({ code: `M${i + 1}`, text: line });
    });
  }

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
    weekDateRange:       val("f-weekDateRange"),
    contentStandard:     val("f-contentStandard"),
    performanceStandard: val("f-performanceStandard"),
    preLesson:           val("f-preLesson"),
    lessonFlow:          val("f-lessonFlow"),
    materialsText:       val("f-materialsText"),
    assessment:          val("f-assessment"),
    competencies,
    preparedByName:      val("f-sig-preparedName"),
    preparedByPosition:  val("f-sig-preparedPos"),
    checkedByName:       val("f-sig-checkedName"),
    checkedByPosition:   val("f-sig-checkedPos"),
    notedByName:         val("f-sig-notedName"),
    notedByPosition:     val("f-sig-notedPos"),
  };
}

// ------------------------------------------------------------
// URL helpers (mirror learner-module.js)
// ------------------------------------------------------------
function getCurrentBaseUrl() {
  const origin = location.origin;
  const path = location.pathname.replace(/\/[^/]*$/, "");
  return origin + path;
}

function getLASPublicUrl(slug) {
  return `${getCurrentBaseUrl()}/las.html?slug=${encodeURIComponent(slug)}`;
}

function getLASPublicUrlDisplay(slug) {
  return `las.html?slug=${slug}`;
}

function getLASQrUrl(slug) {
  const fullUrl = getLASPublicUrl(slug);
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(fullUrl)}&color=0f2b4f&bgcolor=ffffff`;
}

// ------------------------------------------------------------
// BUILD LAS HTML
// Template follows the DepEd "Learning Activity Sheet" structure.
// All content is original — no DepEd LAS text is ever copied.
// ------------------------------------------------------------
export function buildLASHTML(lessonRaw, cfg = {}, options = {}) {
  const DEPED_LOGO_FALLBACK = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Department_of_Education_%28Philippines%29.svg/240px-Department_of_Education_%28Philippines%29.svg.png";

  // Merge overrides from LAS editor (teacher's edits)
  const overrides = lessonRaw?.lasOverrides || {};
  const hidden = Array.isArray(overrides.hiddenSections) ? overrides.hiddenSections : [];
  const hasOverride = (key) => Object.prototype.hasOwnProperty.call(overrides, key);

  // Defensive defaults
  const lesson = {
    ...lessonRaw,
    competencies: Array.isArray(lessonRaw?.competencies) ? lessonRaw.competencies : [],
    subjectName: typeof lessonRaw?.subjectName === "string" ? lessonRaw.subjectName : "",
    subjectCode: typeof lessonRaw?.subjectCode === "string" ? lessonRaw.subjectCode : "",
    gradeLevel:  typeof lessonRaw?.gradeLevel === "string" ? lessonRaw.gradeLevel : "",
    lessonTitle: typeof lessonRaw?.lessonTitle === "string" ? lessonRaw.lessonTitle : "",
    term: typeof lessonRaw?.term === "string" || typeof lessonRaw?.term === "number" ? String(lessonRaw.term) : "",
    week: typeof lessonRaw?.week === "string" || typeof lessonRaw?.week === "number" ? String(lessonRaw.week) : "",
  };

  // Convert relative logo paths → absolute
  function resolveLogoUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
    const base = location.origin + location.pathname.replace(/\/[^/]*$/, "");
    return `${base}/${path.replace(/^\.?\//, "")}`;
  }

  // Per-LAS school details override (from Edit LAS → School Details)
  const sd = overrides.schoolDetails || {};

  const C = {
    depedLogo:     resolveLogoUrl(cfg.depedLogo),
    headerLine1:   cfg.headerLine1 || "Republic of the Philippines",
    headerLine2:   cfg.headerLine2 || "Department of Education",
    region:        sd.region        || cfg.region        || "",
    division:      sd.division      || cfg.division      || "",
    schoolName:    sd.schoolName    || cfg.schoolName    || "",
    schoolAddress: sd.schoolAddress || cfg.schoolAddress || "",
    footerLine1:   cfg.footerLine1  || "",
  };

  const gradeLabel = lesson.gradeLevel === "K" ? "Kindergarten" : "Grade " + (lesson.gradeLevel || "—");
  const generatedDate = new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric"
  });

  // Resolve content — prefer AI-generated fields when present
  const useAI = !!lesson._aiLASActivityTitle;

  // Title (AI-generated or fallback from lesson title)
  const activityTitle = hasOverride("activityTitle")
    ? overrides.activityTitle
    : (useAI ? lesson._aiLASActivityTitle : (lesson.lessonTitle || "Learning Activity"));

  // Objective — from competency or AI
  const objective = hasOverride("objective")
    ? overrides.objective
    : (useAI && lesson._aiLASObjective
        ? lesson._aiLASObjective
        : (lesson.competencies[0]?.text || ""));

  // Materials — from lesson.materialsText or AI
  const materials = hasOverride("materials")
    ? overrides.materials
    : (useAI && Array.isArray(lesson._aiLASMaterials) ? lesson._aiLASMaterials : []);

  // Instructions — AI-generated steps
  const instructions = hasOverride("instructions")
    ? overrides.instructions
    : (useAI && Array.isArray(lesson._aiLASInstructions) ? lesson._aiLASInstructions : []);

  // Analysis questions — AI-generated
  const analysisQuestions = hasOverride("analysisQuestions")
    ? overrides.analysisQuestions
    : (useAI && Array.isArray(lesson._aiLASAnalysis) ? lesson._aiLASAnalysis : []);

  // Answer key (optional)
  const answerKey = useAI && Array.isArray(lesson._aiLASAnswerKey) ? lesson._aiLASAnswerKey : [];

  // Competency alignment footer
  const competencyCodes = lesson.competencies.map(c => c.code).filter(Boolean);

  return `
    <div class="lm-page las-page">
      <div class="lm-header">
  <img class="lm-deped-logo" src="${esc(C.depedLogo || DEPED_LOGO_FALLBACK)}" alt="DepEd" ... />
  <div class="lm-header-line1">${esc(C.headerLine1)}</div>
  <div class="lm-header-line2">${esc(C.headerLine2)}</div>
  ${C.region ? `<div class="lm-header-line3">${esc(C.region)}</div>` : ""}
  ${C.division ? `<div class="lm-header-line3">${esc(C.division)}</div>` : ""}
</div>

<div class="lm-school-banner">
  <div class="lm-school-name">${esc(C.schoolName)}</div>
  ${C.schoolAddress ? `<div class="lm-school-address">${esc(C.schoolAddress)}</div>` : ""}
</div>

      <div class="lm-title">LEARNING ACTIVITY SHEET</div>
      <div class="lm-subtitle">${esc(activityTitle)}</div>

      <div class="lm-meta">
        <span><strong>Subject:</strong> ${esc(lesson.subjectName)}</span>
        <span><strong>Grade:</strong> ${esc(gradeLabel)}</span>
        <span><strong>Section:</strong> ${esc(lesson.section || "—")}</span>
        <span><strong>Term ${esc(lesson.term)} · Week ${esc(lesson.week)}</strong></span>
        <span><strong>SY:</strong> ${esc(lesson.schoolYear)}</span>
      </div>

      <table style="width:100%;margin:8px 0 12px;border-collapse:collapse;font-size:10pt;">
        <tr>
          <td style="padding:4px 0;width:60%;">
            <strong>Name:</strong> <span style="display:inline-block;border-bottom:1px solid #000;min-width:200px;">&nbsp;</span>
          </td>
          <td style="padding:4px 0;">
            <strong>Date:</strong> <span style="display:inline-block;border-bottom:1px solid #000;min-width:120px;">&nbsp;</span>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:4px 0;">
            <strong>Grade &amp; Section:</strong> <span style="display:inline-block;border-bottom:1px solid #000;min-width:300px;">&nbsp;</span>
          </td>
        </tr>
      </table>

      ${!hidden.includes("objective") ? `
      <div class="lm-section">
        <div class="lm-section-title">🎯 Objective</div>
        <p>${esc(objective || "—")}</p>
      </div>` : ""}

      ${!hidden.includes("materials") && materials.length ? `
      <div class="lm-section">
        <div class="lm-section-title">🧰 Materials Needed</div>
        <ul class="lm-obj-list">
          ${materials.map(m => `<li>${esc(typeof m === "string" ? m : m.text || "")}</li>`).join("")}
        </ul>
      </div>` : ""}

      ${!hidden.includes("instructions") && instructions.length ? `
      <div class="lm-section">
        <div class="lm-section-title">📋 Instructions</div>
        ${instructions.map((step, i) => {
          const clean = typeof step === "string" ? step : (step.text || "");
          return clean ? `<div class="lm-lesson-step"><span class="lm-step-num">${i + 1}</span>${esc(clean)}</div>` : "";
        }).join("")}
      </div>` : ""}

      ${!hidden.includes("analysis") && analysisQuestions.length ? `
      <div class="lm-section">
        <div class="lm-section-title">🔍 Analysis</div>
        <ol style="margin:6px 0 0 20px;padding:0;">
          ${analysisQuestions.map(q => {
            const clean = typeof q === "string" ? q : (q.text || "");
            return clean ? `<li style="margin-bottom:6px;">${esc(clean)}</li>` : "";
          }).join("")}
        </ol>
      </div>` : ""}

      ${!options.hideAnswerKey && answerKey.length ? `
      <div class="lm-answer-key">
        <div class="lm-section-title">🔒 Answer Key (For parent/guardian or teacher only)</div>
        <ol style="margin:6px 0 0 20px;padding:0;font-size:10pt;">
          ${answerKey.map(a => {
            const clean = typeof a === "string" ? a : (a.text || "");
            return clean ? `<li>${esc(clean)}</li>` : "";
          }).join("")}
        </ol>
      </div>` : ""}

      <div class="lm-section" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px 14px;margin-top:14px;">
        <div style="font-size:9pt;color:#1e40af;line-height:1.5;">
          <strong>📌 Alignment:</strong>
          Aligned to DepEd MATATAG Competency
          ${competencyCodes.length ? competencyCodes.map(c => `<code style="background:#dbeafe;padding:1px 6px;border-radius:3px;">${esc(c)}</code>`).join(" ") : "—"}<br>
          <strong>🤖 Origin:</strong>
          Drafted with AI assistance · Reviewed and finalized by the teacher
          ${lesson.preparedByName ? `(${esc(lesson.preparedByName)})` : ""}<br>
          <strong>⚖️ Note:</strong>
          This is an ORIGINAL activity sheet. No copyrighted LAS or textbook content was reproduced.
        </div>
      </div>

      <div class="lm-signatories">
        <div class="lm-sig">
          <div class="lm-sig-label">Prepared by:</div>
          <div class="lm-sig-name">${esc(lesson.preparedByName || "—")}</div>
          <div class="lm-sig-pos">${esc(lesson.preparedByPosition || "")}</div>
        </div>
        <div class="lm-sig">
          <div class="lm-sig-label">Checked by:</div>
          <div class="lm-sig-name">${esc(lesson.checkedByName || "—")}</div>
          <div class="lm-sig-pos">${esc(lesson.checkedByPosition || "")}</div>
        </div>
        <div class="lm-sig">
          <div class="lm-sig-label">Noted by:</div>
          <div class="lm-sig-name">${esc(lesson.notedByName || "—")}</div>
          <div class="lm-sig-pos">${esc(lesson.notedByPosition || "")}</div>
        </div>
      </div>

      ${lesson.lasPublicSlug ? `
      <div class="lm-qr-footer">
        <div class="lm-qr-box">
          <div class="lm-qr-label">📱 Scan to view on your phone</div>
          <img class="lm-qr-img" src="${getLASQrUrl(lesson.lasPublicSlug)}" alt="QR Code" />
          <div class="lm-qr-url">${esc(getLASPublicUrlDisplay(lesson.lasPublicSlug))}</div>
        </div>
      </div>` : ""}

      <div class="lm-footer">
        <div>${esc(C.footerLine1)}</div>
        <div>Generated: ${generatedDate} · Learning Activity Sheet · ${esc(lesson.subjectCode)}-T${esc(lesson.term)}W${esc(lesson.week)}</div>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------
// URL helpers for external use
// ------------------------------------------------------------
export function getLASUrl(slug) {
  return getLASPublicUrl(slug);
}