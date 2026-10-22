// assets/js/ecr-bridge.js
// Bridges Smart Checker exam results → ECR grade scores

import { db } from "./firebase-config.js";
import {
  collection, doc, getDoc, getDocs, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function pushExamToECR({
  examId, classId, subjectCode, term,
  component = "ww", stType = "st1",
  examTitle = "Assessment",
  highestPossibleScore = 100,
}) {
  // 1. Load exam results
  const resultsSnap = await getDocs(collection(db, "exams", examId, "results"));
  if (resultsSnap.empty) {
    throw new Error("No results found — has the exam been graded?");
  }

  // 2. Load ECR config
  const ecrRef = doc(db, "classes", classId, "ecr", subjectCode);
  const ecrSnap = await getDoc(ecrRef);
  const ecrData = ecrSnap.exists() ? ecrSnap.data() : {};
  const termConfig = ecrData.terms?.[String(term)] || {
    ww: [], pt: [], st: [], status: "draft"
  };

  // 3. Determine assessment slot
  let assessmentId, assessmentName, maxScore = highestPossibleScore;

  if (component === "ww") {
    const existing = termConfig.ww.find(a => a.examId === examId);
    if (existing) {
      assessmentId = existing.id;
      assessmentName = existing.name;
      maxScore = existing.max;
    } else {
      const nextIdx = termConfig.ww.length + 1;
      if (nextIdx > 10) throw new Error("Maximum 10 Written Works already reached");
      assessmentId = `ww${nextIdx}`;
      assessmentName = examTitle || `WW${nextIdx}`;
      termConfig.ww.push({ id: assessmentId, name: assessmentName, max: maxScore, examId });
    }
  } else if (component === "pt") {
    const existing = termConfig.pt.find(a => a.examId === examId);
    if (existing) {
      assessmentId = existing.id;
      assessmentName = existing.name;
      maxScore = existing.max;
    } else {
      const nextIdx = termConfig.pt.length + 1;
      if (nextIdx > 10) throw new Error("Maximum 10 Performance Tasks already reached");
      assessmentId = `pt${nextIdx}`;
      assessmentName = examTitle || `PT${nextIdx}`;
      termConfig.pt.push({ id: assessmentId, name: assessmentName, max: maxScore, examId });
    }
  } else if (component === "st") {
    if (!["st1", "st2", "te"].includes(stType)) {
      throw new Error("stType must be st1, st2, or te");
    }
    const existing = termConfig.st.find(a => a.id === stType);
    if (existing) {
      assessmentId = stType;
      assessmentName = existing.name;
      maxScore = existing.max;
    } else {
      assessmentId = stType;
      assessmentName = stType === "te" ? "Term Exam" : `Summative Test ${stType.slice(-1)}`;
      termConfig.st.push({ id: stType, name: assessmentName, max: maxScore, examId });
    }
  } else {
    throw new Error("Invalid component: " + component);
  }

  // 4. Save ECR config
  await setDoc(ecrRef, {
    subjectCode,
    terms: { [String(term)]: termConfig },
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // 5. Write each student's score
  let pushed = 0;
  for (const docSnap of resultsSnap.docs) {
    const r = docSnap.data();
    const studentId = r.studentId || docSnap.id;

    // Get student name from SF1
    let studentName = r.studentName || "";
    try {
      const sSnap = await getDoc(doc(db, "classes", classId, "students", studentId));
      if (sSnap.exists()) {
        const s = sSnap.data();
        studentName = s.fullName || `${s.lastName || ""}, ${s.firstName || ""}`.replace(/^,\s*/, "");
      }
    } catch {}

    const rawScore = Number(r.score ?? r.totalScore ?? 0);

    // Load existing scores doc
    const scoreRef = doc(
      db, "classes", classId, "ecr", subjectCode,
      "terms", String(term), "scores", studentId
    );
    const scoreSnap = await getDoc(scoreRef);
    const existing = scoreSnap.exists() ? scoreSnap.data() : {
      wwItems: [], ptItems: [], stItems: {}
    };

    // Insert/update score
    if (component === "ww") {
      const idx = termConfig.ww.findIndex(a => a.id === assessmentId);
      existing.wwItems = existing.wwItems || [];
      existing.wwItems[idx] = { name: assessmentName, max: maxScore, score: rawScore, examId };
    } else if (component === "pt") {
      const idx = termConfig.pt.findIndex(a => a.id === assessmentId);
      existing.ptItems = existing.ptItems || [];
      existing.ptItems[idx] = { name: assessmentName, max: maxScore, score: rawScore, examId };
    } else if (component === "st") {
      existing.stItems = existing.stItems || {};
      existing.stItems[stType] = { name: assessmentName, max: maxScore, score: rawScore, examId };
    }

    await setDoc(scoreRef, {
      studentName,
      ...existing,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    pushed++;
  }

  return { pushed };
}