import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// 1. Use your existing SCPHS Firebase app/config
const firebaseConfig = window.SCPHS_FIREBASE_CONFIG || {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Gemini API Config (use gemini-3.5-flash-lite or gemini-3.8-flash for new projects)
const GEMINI_API_KEY = window.SCPHS_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";
const GEMINI_MODEL = "gemini-2.5-flash";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const [, base64 = ""] = String(reader.result).split(",");
      resolve({ base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function callGemini({ prompt, images = [], jsonMode = false, systemInstruction = "" }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const parts = [{ text: prompt }];

  for (const img of images) {
    parts.push({
      inline_data: {
        mime_type: img.mimeType,
        data: img.base64
      }
    });
  }

  const payload = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      ...(jsonMode ? { responseMimeType: "application/json" } : {})
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini HTTP ${response.status}`);
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

function setStatus(message) {
  document.getElementById("ec-result-box").classList.remove("hidden");
  document.getElementById("ec-status-msg").textContent = message;
}

function showResult(summaryHtml, detailText, statusText = "") {
  document.getElementById("ec-result-box").classList.remove("hidden");
  document.getElementById("ec-result-summary").innerHTML = summaryHtml;
  document.getElementById("ec-result-detail").textContent = detailText;
  if (statusText) {
    document.getElementById("ec-status-msg").textContent = statusText;
  }
}

// Switch between MCQ/OMR and Essay modes
document.getElementById("ec-mode").addEventListener("change", (e) => {
  const isEssay = e.target.value === "essay";
  document.getElementById("ec-mcq-panel").classList.toggle("hidden", isEssay);
  document.getElementById("ec-essay-panel").classList.toggle("hidden", !isEssay);
});

// Save Answer Key directly to Firestore: answer_keys/{examId}
document.getElementById("ec-save-key-btn").addEventListener("click", async () => {
  const examId = document.getElementById("ec-exam-id").value.trim();
  const keys = document
    .getElementById("ec-key-input")
    .value.split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (!examId || !keys.length) {
    return alert("Enter an Assessment ID and at least one answer key item.");
  }

  try {
    setStatus("Saving answer key to Firestore...");
    await setDoc(doc(db, "answer_keys", examId), {
      examId,
      keys,
      totalItems: keys.length,
      updatedAt: serverTimestamp()
    });
    setStatus(`Saved ${keys.length}-item key to Firestore (answer_keys/${examId}).`);
  } catch (err) {
    setStatus(`Firestore Save Error: ${err.message}`);
  }
});

// Load Answer Key directly from Firestore: answer_keys/{examId}
document.getElementById("ec-load-key-btn").addEventListener("click", async () => {
  const examId = document.getElementById("ec-exam-id").value.trim();
  if (!examId) return alert("Enter an Assessment ID first.");

  try {
    setStatus("Loading answer key from Firestore...");
    const snap = await getDoc(doc(db, "answer_keys", examId));
    if (!snap.exists()) {
      return setStatus(`No document found at answer_keys/${examId}.`);
    }
    const keys = snap.data().keys || [];
    document.getElementById("ec-key-input").value = keys.join(", ");
    setStatus(`Loaded ${keys.length} items from Firestore.`);
  } catch (err) {
    setStatus(`Firestore Load Error: ${err.message}`);
  }
});

// Scan OMR / Answer Sheet with Gemini Vision
document.getElementById("ec-scan-omr-btn").addEventListener("click", async () => {
  const file = document.getElementById("ec-omr-file").files[0];
  if (!file) return alert("Choose an answer sheet image first.");

  const keys = document
    .getElementById("ec-key-input")
    .value.split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const totalItems = keys.length || 10;

  try {
    setStatus("Scanning answer sheet with Gemini...");
    const img = await fileToBase64(file);
    const rawJson = await callGemini({
      prompt: `Extract student answers for items 1 to ${totalItems} from this sheet. Return strict JSON mapping "1", "2", ... to the chosen letter/answer (e.g. "A", "B", "C", "D") or "" if blank.`,
      images: [img],
      jsonMode: true,
      systemInstruction: "You are an accurate optical mark and answer sheet reader."
    });

    const parsed = JSON.parse(rawJson);
    const extractedList = [];
    for (let i = 1; i <= totalItems; i++) {
      extractedList.push(String(parsed[String(i)] ?? "").trim().toUpperCase());
    }

    document.getElementById("ec-student-answers").value = extractedList.join(", ");
    await gradeAndStoreMcq(keys, extractedList);
  } catch (err) {
    setStatus(`Scan Error: ${err.message}`);
  }
});

async function gradeAndStoreMcq(keys, studentAnswers) {
  if (!keys.length) {
    return showResult("<strong>Scanned Answers</strong>", studentAnswers.join(", "), "Enter or load an Answer Key to score.");
  }

  let correct = 0;
  const breakdown = keys.map((key, idx) => {
    const ans = (studentAnswers[idx] || "").toUpperCase();
    const isCorrect = ans === key.toUpperCase();
    if (isCorrect) correct++;
    return `Q${idx + 1}: Student="${ans || "-"}" | Key="${key}" -> ${isCorrect ? "CORRECT" : "WRONG"}`;
  });

  const percentage = Number(((correct / keys.length) * 100).toFixed(2));
  const passed = percentage >= 60;

  const docRef = await addDoc(collection(db, "exam_results"), {
    examId: document.getElementById("ec-exam-id").value.trim() || "UNLABELED",
    student: document.getElementById("ec-student-name").value.trim() || "Unknown Student",
    mode: "mcq",
    score: correct,
    total: keys.length,
    percentage,
    passed,
    createdAt: serverTimestamp()
  });

  showResult(
    `<strong>Score: ${correct} / ${keys.length} (${percentage}%)</strong> — ${passed ? "PASSED" : "NEEDS REMEDIATION"}`,
    breakdown.join("\n"),
    `Saved directly to Firestore (exam_results/${docRef.id}).`
  );
}

// Transcribe handwritten essay pages with Gemini Vision
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
    setStatus(`Transcription Error: ${err.message}`);
  }
});

// Grade essay with Gemini and write result to Firestore
document.getElementById("ec-grade-essay-btn").addEventListener("click", async () => {
  const essayText = document.getElementById("ec-essay-text").value.trim();
  const maxScore = Number(document.getElementById("ec-essay-max").value) || 20;
  if (!essayText) return alert("Enter or transcribe essay text first.");

  try {
    setStatus("Evaluating essay with Gemini...");
    const feedback = await callGemini({
      prompt: `Grade this student essay using DepEd rubric principles (Content, Organization, Mechanics/Language).
Max Score: ${maxScore}

Essay:
${essayText}

Format strictly as:
SCORE: X/${maxScore}
FEEDBACK: ...`,
      systemInstruction: "You are a fair, constructive DepEd teacher grader."
    });

    const match = feedback.match(/SCORE:\s*(\d+(?:\.\d+)?)\/(\d+)/i);
    const score = match ? Number(match[1]) : 0;
    const percentage = Number(((score / maxScore) * 100).toFixed(2));
    const passed = percentage >= 60;

    const docRef = await addDoc(collection(db, "exam_results"), {
      examId: document.getElementById("ec-exam-id").value.trim() || "ESSAY",
      student: document.getElementById("ec-student-name").value.trim() || "Unknown Student",
      mode: "essay",
      score,
      total: maxScore,
      percentage,
      passed,
      feedback,
      createdAt: serverTimestamp()
    });

    showResult(
      `<strong>Essay Score: ${score} / ${maxScore} (${percentage}%)</strong> — ${passed ? "PASSED" : "NEEDS REMEDIATION"}`,
      feedback,
      `Saved directly to Firestore (exam_results/${docRef.id}).`
    );
  } catch (err) {
    setStatus(`Essay Grading Error: ${err.message}`);
  }
});