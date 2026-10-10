// ============================================================
// AI LEARNER MODULE ENHANCER — V2
// Reads DeepSeek key from Firestore: config/ai.deepseekKey
// Falls back to template output if AI is unavailable.
// ============================================================

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

// ============================================================
// Load the DeepSeek key from Firestore
// ============================================================
async function getDeepSeekKey() {
  // 1. Window override first (for dev/testing)
  if (window.DEEPSEEK_API_KEY) return window.DEEPSEEK_API_KEY;

  // 2. Read from Firestore config/ai
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
    console.warn("[ai-learner-module] Could not load key from Firestore:", e);
  }

  return null;
}

// ============================================================
// Build the prompt
// ============================================================
function buildPrompt(lesson) {
  const compsText = (lesson.competencies || [])
    .map(c => `- ${c.code}: ${c.text}`)
    .join("\n");

  return `You are helping a Filipino public school teacher turn a lesson plan into a SIMPLE, SELF-PACED HOME LEARNING MODULE for students.

The module will be:
- Read by students ALONE (no teacher present) during class suspension (typhoon, flood, etc.)
- Printed on paper OR read on a phone
- Simplified with short sentences and friendly tone

LESSON CONTEXT:
- Subject: ${lesson.subjectName}
- Grade: ${lesson.gradeLevel}
- Title: ${lesson.lessonTitle}
- Term ${lesson.term}, Week ${lesson.week}
- School Year: ${lesson.schoolYear}

COMPETENCIES (what students should learn):
${compsText || "(no competencies listed)"}

ORIGINAL CONTENT STANDARD:
${lesson.contentStandard || "(not provided)"}

ORIGINAL LESSON FLOW (teacher-facing):
${lesson.lessonFlow ? lesson.lessonFlow.slice(0, 1500) : "(not provided)"}

TASK: Reply with STRICT JSON (no markdown, no code fences) with this shape:
{
  "greeting": "A short 2-sentence friendly greeting to the student in English with a Filipino phrase.",
  "objectives": ["3 to 4 short, student-friendly learning objectives"],
  "lessonIntro": "1 short paragraph (max 100 words) explaining the topic simply.",
  "lessonSteps": ["4 to 6 short, numbered steps students can read in order."],
  "activities": [
    { "title": "Activity 1 name", "duration": "10 min", "instructions": "1-2 short sentences." },
    { "title": "Activity 2 name", "duration": "15 min", "instructions": "1-2 short sentences." },
    { "title": "Activity 3 name", "duration": "5 min",  "instructions": "1-2 short sentences." }
  ],
  "selfCheck": [
    { "question": "Question 1?", "options": ["a option", "b option", "c option", "d option"], "correct": 0 },
    { "question": "Question 2?", "options": ["a option", "b option", "c option", "d option"], "correct": 2 },
    { "question": "Question 3?", "options": ["a option", "b option", "c option", "d option"], "correct": 1 },
    { "question": "Question 4?", "options": ["a option", "b option", "c option", "d option"], "correct": 3 },
    { "question": "Question 5?", "options": ["a option", "b option", "c option", "d option"], "correct": 0 }
  ]
}

Keep language simple, warm, and encouraging. Use English with occasional Filipino hints. Do not add any explanation outside the JSON.`;
}

// ============================================================
// Enhance with AI
// ============================================================
export async function enhanceLearnerModuleWithAI(lesson, onProgress) {
  const key = await getDeepSeekKey();

  if (!key) {
    console.warn("[ai-learner-module] No DeepSeek key configured.");
    return null;
  }

  onProgress?.("Contacting AI...");

  const payload = {
    model: "deepseek-chat",
    messages: [
      { role: "system", content: "You output only valid JSON. No prose, no markdown." },
      { role: "user", content: buildPrompt(lesson) },
    ],
    temperature: 0.6,
    max_tokens: 2200,
  };

  try {
    onProgress?.("Generating content...");

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

    // Clean possible code fences
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
    console.error("[ai-learner-module] AI enhancement failed:", e);
    return null;
  }
}

// ============================================================
// Merge AI output into lesson object
// ============================================================
export function mergeAIIntoLesson(lesson, aiData) {
  if (!aiData) return lesson;
  const merged = { ...lesson };

  if (aiData.greeting)     merged._aiGreeting = aiData.greeting;
  if (Array.isArray(aiData.objectives)) merged._aiObjectives = aiData.objectives;
  if (aiData.lessonIntro)  merged._aiLessonIntro = aiData.lessonIntro;
  if (Array.isArray(aiData.lessonSteps)) merged._aiLessonSteps = aiData.lessonSteps;
  if (Array.isArray(aiData.activities))  merged._aiActivities = aiData.activities;
  if (Array.isArray(aiData.selfCheck))   merged._aiSelfCheck = aiData.selfCheck;

  return merged;
}