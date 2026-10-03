// ============================================================
// bow-store.js — Firestore bridge for BoW data
// Schema: subjects/{code}/bow_terms/{term}
//           subjects/{code}/bow_terms/{term}/competencies/{id}
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, setDoc, serverTimestamp, query, orderBy, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---------- Write ----------
async function saveBoWTerm(subjectCode, term, parsed, meta = {}) {
  const termRef = doc(db, "subjects", subjectCode, "bow_terms", String(term));

  // 1. Save term metadata
  await setDoc(termRef, {
    term,
    termLabel: parsed.termLabel || `Term ${term}`,
    theme: parsed.theme || "",
    contentStandard: parsed.contentStandard || "",
    performanceStandard: parsed.performanceStandard || "",
    totalTopics: parsed.topics.length,
    totalCompetencies: parsed.stats.competenciesFound,
    schoolYear: meta.schoolYear || "2026-2027",
    curriculum: meta.curriculum || "MATATAG",
    source: meta.source || "manual-upload",
    fileName: meta.fileName || "",
    uploadedAt: serverTimestamp(),
    uploadedBy: meta.uploadedBy || "",
  }, { merge: true });

  // 2. Wipe existing competencies (batched in case there are many)
  const compsPath = ["subjects", subjectCode, "bow_terms", String(term), "competencies"];
  const compsRef = collection(db, ...compsPath);
  const existing = await getDocs(compsRef);
  if (existing.docs.length > 0) {
    for (let i = 0; i < existing.docs.length; i += 450) {
      const batch = writeBatch(db);
      existing.docs.slice(i, i + 450).forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  }

  // 3. Flatten all competencies
  const allComps = [];
  parsed.topics.forEach((topic, tIdx) => {
    topic.competencies.forEach((c, cIdx) => {
      allComps.push({
        topicLabel: topic.label,
        topicOrderIndex: topic.orderIndex || tIdx + 1,
        isCrossTerm: !!topic.isCrossTerm,
        isPerformanceTask: !!topic.isPerformanceTask,
        suggestedContent: topic.suggestedContent || "",
        weekNumber: topic.weekNumber || null,
        code: c.code,
        text: c.text,
        isRecurring: !!c.isRecurring,
        orderIndex: cIdx + 1,
      });
    });
  });

  // 4. Write new competencies (batched, with FRESH doc refs)
  for (let i = 0; i < allComps.length; i += 450) {
    const batch = writeBatch(db);
    const slice = allComps.slice(i, i + 450);
    slice.forEach(c => {
      // ✅ FIX: explicitly get a fresh doc ref from the collection path
      const docRef = doc(collection(db, "subjects", subjectCode, "bow_terms", String(term), "competencies"));
      batch.set(docRef, { ...c, createdAt: serverTimestamp() });
    });
    await batch.commit();
  }

  return { topics: parsed.topics.length, competencies: allComps.length };
}

// ---------- Read ----------
async function listBoWTerms(subjectCode) {
  try {
    const ref = collection(db, "subjects", subjectCode, "bow_terms");
    const snap = await getDocs(ref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("[bow-store] listBoWTerms failed:", e);
    return [];
  }
}

async function getBoWTerm(subjectCode, term) {
  try {
    const ref = doc(db, "subjects", subjectCode, "bow_terms", String(term));
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    return null;
  }
}

async function listCompetencies(subjectCode, term) {
  try {
    const ref = collection(db, "subjects", subjectCode, "bow_terms", String(term), "competencies");
    const q = query(ref, orderBy("topicOrderIndex"), orderBy("orderIndex"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("[bow-store] listCompetencies failed:", e);
    return [];
  }
}

// Group competencies by topic (for display)
function groupByTopic(comps) {
  const map = {};
  for (const c of comps) {
    const key = c.topicLabel || "(untitled)";
    if (!map[key]) {
      map[key] = {
        label: key,
        orderIndex: c.topicOrderIndex || 999,
        isCrossTerm: !!c.isCrossTerm,
        isPerformanceTask: !!c.isPerformanceTask,
        suggestedContent: c.suggestedContent || "",
        weekNumber: c.weekNumber,
        items: [],
      };
    }
    map[key].items.push(c);
  }
  return Object.values(map).sort((a, b) => a.orderIndex - b.orderIndex);
}

// ---------- Delete ----------
async function deleteBoWTerm(subjectCode, term) {
  const compsRef = collection(db, "subjects", subjectCode, "bow_terms", String(term), "competencies");
  const snap = await getDocs(compsRef);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  await deleteDoc(doc(db, "subjects", subjectCode, "bow_terms", String(term)));
}

// ------------------------------------------------------------
// Edit operations
// ------------------------------------------------------------
async function updateTermMeta(subjectCode, term, updates) {
  const ref = doc(db, "subjects", subjectCode, "bow_terms", String(term));
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

async function addCompetency(subjectCode, term, data) {
  const ref = collection(db, "subjects", subjectCode, "bow_terms", String(term), "competencies");
  // Find max orderIndex within this topic
  const existing = await listCompetencies(subjectCode, term);
  const sameTopic = existing.filter(c => c.topicLabel === data.topicLabel);
  const maxOrder = sameTopic.reduce((m, c) => Math.max(m, c.orderIndex || 0), 0);

  await addDoc(ref, {
    ...data,
    topicOrderIndex: data.topicOrderIndex || (existing.length + 1),
    orderIndex: maxOrder + 1,
    createdAt: serverTimestamp(),
  });

  // Update term total count
  const newTotal = existing.length + 1;
  await updateDoc(doc(db, "subjects", subjectCode, "bow_terms", String(term)), {
    totalCompetencies: newTotal,
  });
}

async function updateCompetency(subjectCode, term, compId, updates) {
  const ref = doc(db, "subjects", subjectCode, "bow_terms", String(term), "competencies", compId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

async function deleteCompetency(subjectCode, term, compId) {
  const ref = doc(db, "subjects", subjectCode, "bow_terms", String(term), "competencies", compId);
  await deleteDoc(ref);

  // Update term total count
  const remaining = await listCompetencies(subjectCode, term);
  await updateDoc(doc(db, "subjects", subjectCode, "bow_terms", String(term)), {
    totalCompetencies: remaining.length,
  });
}

// ---------- Export to window ----------
window.BoW = {
  saveBoWTerm,
  listBoWTerms,
  getBoWTerm,
  listCompetencies,
  groupByTopic,
  deleteBoWTerm,
  // NEW:
  updateTermMeta,
  addCompetency,
  updateCompetency,
  deleteCompetency,
};