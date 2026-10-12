// ============================================================
// MATERIALS GENERATOR — V1
// Generates 4 material types from a lesson:
//   📖 lecture | 🎯 activities | 📊 slides | ❓ quiz
// Uses DeepSeek via the same system_config/ai key your ILAW uses.
// ============================================================

import { db } from "./firebase-config.js";
import {
  doc, getDoc, setDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const esc = s => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// ============================================================
// AI CONFIG LOADER (matches ILAW pattern)
// ============================================================
let AI_CONFIG_CACHE = null;
async function getAIConfig() {
  if (AI_CONFIG_CACHE) return AI_CONFIG_CACHE;
  try {
    const snap = await getDoc(doc(db, "config", "ai"));
    if (snap.exists()) {
      const d = snap.data();
      AI_CONFIG_CACHE = {
        apiKey:  d.deepseekKey  || d.deepseek_key  || d.apiKey || "",
        apiUrl:  d.deepseekUrl  || "https://api.deepseek.com/v1/chat/completions",
        model:   d.deepseekModel || "deepseek-chat",
      };
    }
  } catch (e) {
    console.warn("[materials-generator] AI config load failed:", e);
  }
  if (!AI_CONFIG_CACHE) {
    AI_CONFIG_CACHE = {
      apiKey: "",
      apiUrl: "https://api.deepseek.com/v1/chat/completions",
      model: "deepseek-chat",
    };
  }
  return AI_CONFIG_CACHE;
}

// ============================================================
// LOW-LEVEL AI CALL
// ============================================================
async function callAI(systemPrompt, userPrompt, onProgress) {
  const cfg = await getAIConfig();
  if (!cfg.apiKey) {
    throw new Error("AI is not configured. Ask admin to add the DeepSeek key.");
  }
  if (onProgress) onProgress("Contacting AI…");

  const res = await fetch(cfg.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}): ${txt.slice(0, 200)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content || "";
  if (!content) throw new Error("AI returned empty content");
  return { content, aiModel: cfg.model };
}

// ============================================================
// PROMPT BUILDERS
// ============================================================

function baseContext(lesson) {
  const gradeLabel = lesson.gradeLevel === "K" ? "Kindergarten" : `Grade ${lesson.gradeLevel || ""}`;
  const competencies = (lesson.competencyTexts || []).slice(0, 8).join("\n- ");
  const standards = [
    lesson.contentStandard    ? `Content Standard: ${lesson.contentStandard}` : "",
    lesson.performanceStandard ? `Performance Standard: ${lesson.performanceStandard}` : "",
  ].filter(Boolean).join("\n");

  return `
SUBJECT: ${lesson.subjectName || lesson.subjectCode || "—"}
GRADE LEVEL: ${gradeLabel}
TERM: ${lesson.term || "—"} | WEEK: ${lesson.week || "—"}
LESSON TITLE: ${lesson.lessonTitle || "—"}
${standards ? standards : ""}
${competencies ? `KEY COMPETENCIES:\n- ${competencies}` : ""}
${lesson.learnerContext ? `LEARNER CONTEXT: ${lesson.learnerContext}` : ""}
`.trim();
}

function systemPromptForTeachers() {
  return `You are an experienced Philippine public school teacher writing instructional materials for DepEd classrooms.
Write in clear, grade-appropriate English (Filipino/Tagalog is fine for examples if useful).
Output ONLY valid HTML using <p>, <ul>, <ol>, <li>, <strong>, <em> tags. No <html>, <head>, or <body> wrappers.
Keep it practical, culturally relevant to Filipino students, and aligned with MATATAG curriculum goals.`;
}

export const MATERIAL_PROMPTS = {
  lecture: (lesson) => ({
    system: systemPromptForTeachers(),
    user: `Create a well-structured LECTURE NOTES document for this lesson.

${baseContext(lesson)}

Structure the output as HTML with this shape:
<p><strong>Opening Hook (2 min):</strong> An engaging question or short scenario to start the lesson.</p>
<p><strong>Core Content (8-10 min):</strong></p>
<ul>
  <li>3-5 clearly written key points with <strong>bolded terms</strong> and brief explanations.</li>
</ul>
<p><strong>Real-World Connection:</strong> A short paragraph linking the topic to everyday Filipino life.</p>
<p><strong>Closing (2 min):</strong> Summarize the key learning and preview the next lesson.</p>

Output HTML only. No code fences. No explanation outside the HTML.`,
  }),

  activities: (lesson) => ({
    system: systemPromptForTeachers(),
    user: `Create 2-3 HANDS-ON ACTIVITIES for this lesson.

${baseContext(lesson)}

Structure the output as HTML with this shape:
<div>
  <p><strong>Activity 1 — [Title] ([duration] min)</strong></p>
  <ul>
    <li><strong>Materials:</strong> list of items</li>
    <li><strong>Group size:</strong> number of students</li>
    <li><strong>Steps:</strong> 3-5 clear steps</li>
    <li><strong>Output/Assessment:</strong> what students produce</li>
  </ul>
</div>
(repeat for activity 2 and 3)

Make each activity realistic for a Filipino public school classroom — minimal materials, hands-on, collaborative.
Output HTML only. No code fences.`,
  }),

  slides: (lesson) => ({
    system: systemPromptForTeachers(),
    user: `Create a 10-SLIDE PRESENTATION OUTLINE for this lesson.

${baseContext(lesson)}

Structure the output as HTML:
<ol>
  <li><strong>Slide Title:</strong> 3-4 short bullet points describing what appears on the slide.</li>
  ...
</ol>

Suggested slide breakdown:
1. Title slide with lesson name
2. Learning objectives
3. Hook / warm-up question
4-7. Core content (key concepts)
8. Example / worked example
9. Quick check / practice
10. Summary + preview of next lesson

Each slide should have a clear title and 3-4 concise bullet points.
Output HTML only. No code fences.`,
  }),

  quiz: (lesson) => ({
    system: systemPromptForTeachers(),
    user: `Create a 10-QUESTION MULTIPLE CHOICE QUIZ for this lesson.

${baseContext(lesson)}

Structure the output as HTML:
<ol>
  <li>
    <p><strong>Question text here?</strong></p>
    <p>a) Option A<br>b) Option B<br>c) Option C<br>d) Option D</p>
    <p><em>Answer: b) Correct option</em></p>
  </li>
  ...
</ol>

Mix difficulty levels: 3 easy, 4 medium, 3 challenging.
Questions must align to the competencies listed above.
Output HTML only. No code fences.`,
  }),
};

// ============================================================
// GENERATE ONE MATERIAL
// ============================================================
export async function generateMaterial(type, lesson, onProgress) {
  const promptBuilder = MATERIAL_PROMPTS[type];
  if (!promptBuilder) throw new Error("Unknown material type: " + type);
  const prompt = promptBuilder(lesson);
  const result = await callAI(prompt.system, prompt.user, onProgress);

  // Strip any code fences just in case
  let clean = result.content.trim();
  clean = clean.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/, "");
  return { content: clean, aiModel: result.aiModel };
}

// ============================================================
// RECOMMENDED RESOURCES (per subject category)
// ============================================================
const RESOURCES = {
  common: [
    { icon: "📚", name: "STARBOOKS", tag: "PH", tagClass: "ph",
      desc: "DepEd DOST science & tech articles",
      url: "https://starbooks.ph/" },
    { icon: "📘", name: "DepEd LRMDS", tag: "PH", tagClass: "ph",
      desc: "Learning Resource Management Portal",
      url: "https://lrmds.deped.gov.ph/" },
    { icon: "🌍", name: "OER Commons", tag: "OER", tagClass: "oer",
      desc: "Free open educational resources",
      url: "https://oercommons.org/" },
  ],
  math: [
    { icon: "🔢", name: "Desmos", tag: "SIM", tagClass: "sim",
      desc: "Free graphing & math simulations",
      url: "https://www.desmos.com/calculator" },
    { icon: "🧮", name: "PhET Math", tag: "SIM", tagClass: "sim",
      desc: "Interactive math simulations",
      url: "https://phet.colorado.edu/en/simulations/filter?subjects=math" },
  ],
  science: [
    { icon: "⚡", name: "PhET Science", tag: "SIM", tagClass: "sim",
      desc: "Interactive science simulations",
      url: "https://phet.colorado.edu/" },
    { icon: "🔬", name: "CK-12 Science", tag: "OER", tagClass: "oer",
      desc: "Free science lessons & labs",
      url: "https://www.ck12.org/student/" },
  ],
  english: [
    { icon: "📖", name: "Project Gutenberg", tag: "OER", tagClass: "oer",
      desc: "Free classic literature",
      url: "https://www.gutenberg.org/" },
    { icon: "✍️", name: "Purdue OWL", tag: "OER", tagClass: "oer",
      desc: "Writing & grammar reference",
      url: "https://owl.purdue.edu/owl/purdue_owl.html" },
  ],
  tle: [
    { icon: "🛠️", name: "TESDA Online", tag: "PH", tagClass: "ph",
      desc: "Free vocational & TVL resources",
      url: "https://www.e-tesda.gov.ph/" },
    { icon: "🎯", name: "Skills Commons", tag: "OER", tagClass: "oer",
      desc: "Career & technical education resources",
      url: "https://www.skillscommons.org/" },
  ],
  filipino: [
    { icon: "🇵🇭", name: "Komisyon sa Wikang Filipino", tag: "PH", tagClass: "ph",
      desc: "Official Filipino language resources",
      url: "https://kwf.gov.ph/" },
  ],
  ap: [
    { icon: "🗺️", name: "National Historical Commission", tag: "PH", tagClass: "ph",
      desc: "Philippine history resources",
      url: "https://nhcp.gov.ph/" },
  ],
};

export function getRecommendedResources(lesson) {
  if (!lesson) return RESOURCES.common;

  const subjectText = String(lesson.subjectName || lesson.subjectCode || "").toLowerCase();
  const extra = [];

  if (/\b(math|algebra|geometry|calculus|statistics)\b/.test(subjectText)) extra.push(...RESOURCES.math);
  if (/\b(science|biology|chemistry|physics|earth|environment)\b/.test(subjectText)) extra.push(...RESOURCES.science);
  if (/\b(english|literature|reading|language)\b/.test(subjectText)) extra.push(...RESOURCES.english);
  if (/\b(tle|tvl|tech|vocational|automotive|electrical|cookery|dressmaking)\b/.test(subjectText)) extra.push(...RESOURCES.tle);
  if (/\b(filipino|tagalog)\b/.test(subjectText)) extra.push(...RESOURCES.filipino);
  if (/\b(araling|ap|social|history)\b/.test(subjectText)) extra.push(...RESOURCES.ap);

  return [...RESOURCES.common, ...extra];
}

// ============================================================
// FIRESTORE — SAVE / LOAD MATERIALS
// ============================================================
const MATERIALS_SUBCOLL = (lessonId) => `lessons/${lessonId}/materials`;

export async function saveMaterial(lessonId, type, data) {
  if (!lessonId) throw new Error("No lesson ID");
  const ref = doc(db, "lessons", lessonId, "materials", type);
  await setDoc(ref, {
    type,
    content: data.content || "",
    status: data.status || "ready",
    aiModel: data.aiModel || "",
    updatedAt: serverTimestamp(),
    updatedBy: (typeof window !== "undefined" && window.__currentUserEmail) || "",
  }, { merge: true });
}

export async function loadMaterial(lessonId, type) {
  try {
    const ref = doc(db, "lessons", lessonId, "materials", type);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    console.warn("[materials-generator] loadMaterial failed:", type, e);
    return null;
  }
}

export { esc };