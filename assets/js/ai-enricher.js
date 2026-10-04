// ============================================================
// ai-enricher.js — Direct DeepSeek enrichment (no backend)
// Reads API key from Firestore: system_config/ai
// ============================================================

import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let _cfgCache = null;
let _cfgAt = 0;
const CACHE_MS = 5 * 60 * 1000;

async function loadCfg() {
  const now = Date.now();
  if (_cfgCache && (now - _cfgAt) < CACHE_MS) return _cfgCache;

  const snap = await getDoc(doc(db, "system_config", "ai"));
  if (!snap.exists()) throw new Error("Missing Firestore doc: system_config/ai");
  const cfg = snap.data();

  if (!cfg.enabled) throw new Error("AI is disabled in config");
  if (!cfg.deepseek_api_key || cfg.deepseek_api_key.length < 20) {
    throw new Error("DeepSeek key missing in config");
  }

  _cfgCache = cfg;
  _cfgAt = now;
  return cfg;
}

export async function enrichILAW(parsed, ctx = {}, onProgress = () => {}) {
  onProgress(10, "Loading AI config...");
  const cfg = await loadCfg();

  // ---------- Build the prompt ----------
  const lines = [];
  lines.push(`SUBJECT: ${ctx.subjectName || ctx.subjectCode || "N/A"}`);
  lines.push(`GRADE: ${ctx.gradeLevel || "N/A"}`);
  lines.push(`TERM ${ctx.term || "?"}, WEEK ${ctx.week || "?"}`);
  lines.push("");
  lines.push("=== TEACHER'S DOCUMENT ===");

  const fields = {
    lessonTitle:         "Lesson Title",
    learningArea:        "Learning Area",
    contentStandard:     "Content Standard",
    performanceStandard: "Performance Standard",
    competencies:        "Competencies",
    learningObjectives:  "Learning Objectives",
    learnerContext:      "Learner Context",
    preLesson:           "Pre-Lesson",
    lessonFlow:          "Lesson Flow",
    materials:           "Materials",
    integration:         "Integration",
    assessment:          "Assessment",
    extendedLearning:    "Extended Learning",
    waysForward:         "Ways Forward",
    teacherReflections:  "Teacher Reflections",
    references:          "References",
  };

  for (const [k, label] of Object.entries(fields)) {
    let v = parsed[k] || "";
    if (Array.isArray(v)) v = v.map(x => `- ${x}`).join("\n");
    if (String(v).trim()) lines.push(`\n${label}:\n${v}\n`);
  }

  const systemPrompt =
    "You are a Philippine K-12 ILAW lesson plan assistant. " +
    "The teacher has provided a partial ILAW lesson plan. " +
    "Preserve the topic; expand short entries into full professional text; " +
    "fill in missing fields using subject/grade context. " +
    "Align with DepEd ILAW (DO 3, s. 2026). " +
    "Return ONLY a JSON object with these exact keys: " +
    "competencies, content_standard, performance_standard, learner_context, " +
    "pre_lesson, lesson_flow, materials_text, integration_opportunities, " +
    "assessment, extended_learning, ways_forward, teacher_reflections, references_text. " +
    "Each value must be plain text (no markdown, no bullet asterisks).";

  const userPrompt =
    lines.join("\n") +
    "\n\n=== TASK ===\n" +
    "Produce the complete ILAW fields as valid JSON. " +
    "Stay faithful to the teacher's source. Return valid JSON only.";

  onProgress(35, "Calling DeepSeek...");

  const resp = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cfg.deepseek_api_key}`,
    },
    body: JSON.stringify({
      model: cfg.deepseek_model || "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
      temperature: cfg.temperature ?? 0.5,
      max_tokens: cfg.max_tokens ?? 4000,
      response_format: { type: "json_object" },
    }),
  });

  onProgress(75, "Parsing response...");

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`DeepSeek HTTP ${resp.status} — ${txt.slice(0, 200)}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || "";
  let out;
  try {
    out = JSON.parse(content);
  } catch {
    throw new Error("AI did not return JSON: " + content.slice(0, 200));
  }

  onProgress(100, "Done");
  return out;
}