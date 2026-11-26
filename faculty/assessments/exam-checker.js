// Replace with your Gemini API key or proxy endpoint via your Java backend
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const GEMINI_MODEL = "gemini-2.5-flash";
const JAVA_SYNC_URL = ""; // Optional: e.g. "https://your-java-server/api/grades/sync"

// Optional: pass your initialized Firestore `db` instance from your portal's Firebase setup
const firestoreDb = window.scphsDb || null;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve({ base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function callGemini({ prompt, images = [], jsonMode = false, systemInstruction = "" }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const parts = [{ text: prompt }];

  for (const img of images) {
    parts.push({
      inline_data: {
        mime_type: img.mimeType,
        data: img.base64
      }
    });
  }

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      ...(jsonMode ? { responseMimeType: "application/json" } : {})
    }
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini HTTP ${res.status}`);
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

function setStatus(msg) {
  document.getElementById("ec-result-box").classList.remove("hidden");
  document.getElementById("ec-status-msg").textContent = msg;
}

function showResult(summaryHtml, detailText, statusText = "") {
  document.getElementById("ec-result-box").classList.remove("hidden");
  document.getElementById("ec-result-summary").innerHTML = summaryHtml;
  document.getElementById("ec-result-detail").textContent = detailText;
  if (statusText) {
    document.getElementById("ec-status-msg").textContent = statusText;
  }
}

// Mode switcher
document.getElementById("ec-mode").addEventListener("change", (e) => {
  const isEssay = e.target.value === "essay";
  document.getElementById("ec-mcq-panel").classList.toggle("hidden", isEssay);
  document.getElementById("ec-essay-panel").classList.toggle("hidden", !isEssay);
});

// Save key to Firestore (or localStorage fallback)
document.getElementById("ec-save-key-btn").addEventListener("click", async () => {
  const examId = document.getElementById("ec-exam-id").value.trim();
  const keys = document.getElementById("ec-key-input").value.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  if (!examId || !keys.length) return alert("Enter an Assessment ID and at least one answer key item.");

  localStorage.setItem(`ec_key_${examId}`, JSON.stringify(keys));
  if (firestoreDb && window.firebaseDoc && window.firebaseSetDoc) {
    await window.firebaseSetDoc(window.firebaseDoc(firestoreDb, "answer_keys", examId), {
      examId, keys, updatedAt: new Date().toISOString()
    });
  }
  setStatus(`Saved ${keys.length}-item key for "${examId}".`);
});

// Load key
document.getElementById("ec-load-key-btn").addEventListener("click", async () => {
  const examId = document.getElementById("ec-exam-id").value.trim();
  if (!examId) return alert("Enter an Assessment ID first.");

  if (firestoreDb && window.firebaseDoc && window.firebaseGetDoc) {
    const snap = await window.firebaseGetDoc(window.firebaseDoc(firestoreDb, "answer_keys", examId));
    if (snap.exists()) {
      const keys = snap.data().keys || [];
      document.getElementById("ec-key-input").value = keys.join(", ");
      return setStatus(`Loaded ${keys.length} items from Firestore.`);
    }
  }

  const localKeys = JSON.parse(localStorage.getItem(`ec_key_${examId}`) || "null");
  if (localKeys) {
    document.getElementById("ec-key-input").value = localKeys.join(", ");
    setStatus(`Loaded ${localKeys.length} items from local storage.`);
  } else {
    setStatus("No saved key found for this ID.");
  }
});

// Scan OMR / Answer Sheet with Gemini Vision
document.getElementById("ec-scan-omr-btn").addEventListener("click", async () => {
  const file = document.getElementById("ec-omr-file").files[0];
  if (!file) return alert("Choose an answer sheet image first.");

  const keys = document.getElementById("ec-key-input").value.split(",").map(s => s.trim()).filter(Boolean);
  const totalItems = keys.length || 10;

  try {
    setStatus("Scanning answer sheet with Gemini...");
    const img = await fileToBase64(file);
    const rawJson = await callGemini({
      prompt: `Extract student answers for items 1 to ${totalItems} from this sheet. Return strict JSON mapping "1", "2", ... to the chosen letter/answer (e.g. "A", "B", "C", "D") or "" if blank.`,
      images: [img],
      jsonMode: true,
      systemInstruction: "You are a precise optical mark and answer sheet reader."
    });

    const parsed = JSON.parse(rawJson);
    const extractedList = [];
    for (let i = 1; i <= totalItems; i++) {
      extractedList.push((parsed[String(i)] || "").toString().trim().toUpperCase());
    }

    document.getElementById("ec-student-answers").value = extractedList.join(", ");
    gradeMcq(keys, extractedList);
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
});

function gradeMcq(keys, studentAnswers) {
  if (!keys.length) {
    return showResult("<strong>Scanned Answers</strong>", studentAnswers.join(", "), "Add an Answer Key to compute score.");
  }
  let correct = 0;
  const breakdown = keys.map((k, idx) => {
    const s = (studentAnswers[idx] || "").toUpperCase();
    const ok = s === k.toUpperCase();
    if (ok) correct++;
    return `Q${idx + 1}: Student="${s || "-"}" | Key="${k}" -> ${ok ? "CORRECT" : "WRONG"}`;
  });

  const pct = ((correct / keys.length) * 100).toFixed(2);
  const record = {
    examId: document.getElementById("ec-exam-id").value.trim() || "UNLABELED",
    student: document.getElementById("ec-student-name").value.trim() || "Unknown Student",
    score: correct,
    total: keys.length,
    percentage: Number(pct),
    createdAt: new Date().toISOString()
  };

  syncRecord(record);
  showResult(
    `<strong>Score: ${correct} / ${keys.length} (${pct}%)</strong> — ${pct >= 60 ? "PASSED" : "NEEDS REMEDIATION"}`,
    breakdown.join("\n"),
    "Evaluated and synced."
  );
}

// Transcribe handwritten essay
document.getElementById("ec-transcribe-btn").addEventListener("click", async () => {
  const files = Array.from(document.getElementById("ec-essay-files").files || []);
  if (!files.length) return alert("Select one or more essay images.");

  try {
    setStatus("Transcribing handwriting with Gemini...");
    const images = await Promise.all(files.map(fileToBase64));
    const text = await callGemini({
      prompt: "Transcribe all handwritten text accurately across these pages in English, Filipino/Tagalog, or Taglish. Return only the transcribed text.",
      images,
      systemInstruction: "You are an expert OCR assistant for handwritten student essays."
    });
    document.getElementById("ec-essay-text").value = text;
    setStatus("Transcription complete.");
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
});

// Grade essay with DepEd-aligned prompt
document.getElementById("ec-grade-essay-btn").addEventListener("click", async () => {
  const essayText = document.getElementById("ec-essay-text").value.trim();
  const maxScore = Number(document.getElementById("ec-essay-max").value) || 20;
  if (!essayText) return alert("Enter or transcribe essay text first.");

  try {
    setStatus("Evaluating essay with Gemini...");
    const analysis = await callGemini({
      prompt: `Grade this student essay using DepEd rubric principles (Content, Organization, Mechanics/Language).
Max Score: ${maxScore}

Essay:
${essayText}

Format strictly as:
SCORE: X/${maxScore}
FEEDBACK: ...`,
      systemInstruction: "You are a fair, constructive DepEd teacher grader."
    });

    const match = analysis.match(/SCORE:\s*(\d+(?:\.\d+)?)\/(\d+)/i);
    const score = match ? Number(match[1]) : 0;
    const pct = ((score / maxScore) * 100).toFixed(2);

    syncRecord({
      examId: document.getElementById("ec-exam-id").value.trim() || "ESSAY",
      student: document.getElementById("ec-student-name").value.trim() || "Unknown Student",
      score,
      total: maxScore,
      percentage: Number(pct),
      createdAt: new Date().toISOString()
    });

    showResult(
      `<strong>Essay Score: ${score} / ${maxScore} (${pct}%)</strong>`,
      analysis,
      "Essay graded and synced."
    );
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
});

async function syncRecord(record) {
  if (firestoreDb && window.firebaseAddDoc && window.firebaseCollection) {
    await window.firebaseAddDoc(window.firebaseCollection(firestoreDb, "exam_results"), record);
  }
  if (JAVA_SYNC_URL) {
    await fetch(JAVA_SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    });
  }
}