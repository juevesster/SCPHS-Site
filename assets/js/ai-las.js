// ============================================================
// AI LAS ENHANCER
// Reads DeepSeek key from Firestore: config/ai.deepseekKey
// Feeds ONLY BoW facts — NEVER any DepEd LAS or textbook text.
// Falls back to template output if AI is unavailable.
// ============================================================

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

// ------------------------------------------------------------
// Load the DeepSeek key from Firestore
// ------------------------------------------------------------
async function getDeepSeekKey() {
  if (window.DEEPSEEK_API_KEY) return window.DEEPSEEK_API_KEY;

  try {
    const { db } = await import("./firebase-config.js");
    const { doc, getDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    const snap = await getDoc(doc(db, "config", "ai"));
    if (snap.exists()) {
      const data = snap.data();
      if (data.deepseekKey && typeof data.deepseekKey === "string") {
        return data.deepseekKey.trim();
      }
    }
  } catch (e) {
    console.warn("[ai-las] Could not load key from Firestore:", e);
  }
  return null;
}

// ------------------------------------------------------------
// Build the prompt — BoW facts only
// ------------------------------------------------------------
function buildPrompt(lesson) {
  const compsText = (lesson.competencies || [])
    .map(c => `- ${c.code}: ${c.text}`)
    .join("\n");

  return `You are helping a Filipino public school teacher create an ORIGINAL Learning Activity Sheet (LAS) for students.

CRITICAL RULES:
1. Generate 100% ORIGINAL content. Do NOT reproduce, paraphrase, or reference any existing DepEd LAS, textbook, or published worksheet.
2. Use simple, warm, encouraging language appropriate for Grade ${lesson.gradeLevel} students.
3. Follow the DepEd LAS template structure exactly (Activity Title, Objective, Materials, Instructions, Analysis Questions, Answer Key).
4. The teacher will review and edit the output before use.

LESSON CONTEXT (all facts from the curriculum):
- Subject: ${lesson.subjectName}
- Grade: ${lesson.gradeLevel}
- Term ${lesson.term} · Week ${lesson.week}
- School Year: ${lesson.schoolYear}

COMPETENCIES (from the Budget of Work):
${compsText || "(no competencies listed)"}

CONTENT STANDARD:
${lesson.contentStandard || "(not provided)"}

PERFORMANCE STANDARD:
${lesson.performanceStandard || "(not provided)"}

TEACHER'S LESSON FLOW (for reference — do not copy verbatim):
${lesson.lessonFlow ? lesson.lessonFlow.slice(0, 1200) : "(not provided)"}

TASK: Reply with STRICT JSON (no markdown, no code fences) with this exact shape:
{
  "activityTitle": "A short, engaging activity title (5-10 words).",
  "objective": "One clear sentence describing what students will be able to do.",
  "materials": ["3-6 short material items students will need."],
  "instructions": ["4-6 numbered short steps students follow."],
  "analysisQuestions": ["4-6 open-ended reflection or comprehension questions."],
  "answerKey": ["Concise answers to each analysis question, in order."]
}

Keep language simple, warm, and encouraging. Use English with occasional Filipino hints when helpful. Do not add any explanation outside the JSON.`;
}

// ------------------------------------------------------------
// Enhance with AI
// ------------------------------------------------------------
export async function enhanceLASWithAI(lesson, onProgress) {
  const key = await getDeepSeekKey();

  if (!key) {
    console.warn("[ai-las] No DeepSeek key configured.");
    return null;
  }

  onProgress?.("Contacting AI...");

  const payload = {
    model: "deepseek-chat",
    messages: [
      { role: "system", content: "You output only valid JSON. No prose, no markdown." },
      { role: "user", content: buildPrompt(lesson) },
    ],
    temperature: 0.7,
    max_tokens: 2200,
  };

  try {
    onProgress?.("Generating original LAS content...");

    const res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AI failed (${res.status}): ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    let raw = data?.choices?.[0]?.message?.content || "";

    raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned non-JSON content.");
      parsed = JSON.parse(m[0]);
    }

    onProgress?.("Done.");
    return parsed;

  } catch (e) {
    console.error("[ai-las] AI enhancement failed:", e);
    return null;
  }
}

// ------------------------------------------------------------
// Merge AI output into lesson object
// ------------------------------------------------------------
export function mergeAIIntoLAS(lesson, aiData) {
  if (!aiData) return lesson;
  const merged = { ...lesson };

  if (aiData.activityTitle)                  merged._aiLASActivityTitle = aiData.activityTitle;
  if (aiData.objective)                      merged._aiLASObjective = aiData.objective;
  if (Array.isArray(aiData.materials))       merged._aiLASMaterials = aiData.materials;
  if (Array.isArray(aiData.instructions))    merged._aiLASInstructions = aiData.instructions;
  if (Array.isArray(aiData.analysisQuestions)) merged._aiLASAnalysis = aiData.analysisQuestions;
  if (Array.isArray(aiData.answerKey))       merged._aiLASAnswerKey = aiData.answerKey;

  return merged;
}