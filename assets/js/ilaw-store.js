// ============================================================
// ilaw-store.js — Firestore bridge for ILAW lessons
// Collection: lessons/{lessonId}
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ------------------------------------------------------------
// CREATE / UPDATE
// ------------------------------------------------------------
async function saveLesson(lessonId, data) {
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  if (lessonId) {
    const ref = doc(db, "lessons", lessonId);
    await updateDoc(ref, payload);
    return lessonId;
  } else {
    payload.createdAt = serverTimestamp();
    const ref = collection(db, "lessons");
    const newDoc = await addDoc(ref, payload);
    return newDoc.id;
  }
}

// ------------------------------------------------------------
// READ ONE
// ------------------------------------------------------------
async function getLesson(lessonId) {
  try {
    const ref = doc(db, "lessons", lessonId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    console.warn("[ilaw-store] getLesson failed:", e);
    return null;
  }
}

// ------------------------------------------------------------
// FIND EXISTING LESSON (by teacher + subject + term + week)
// ------------------------------------------------------------
async function findLesson(teacherUid, subjectCode, term, week, schoolYear) {
  try {
    const ref = collection(db, "lessons");
    const q = query(
      ref,
      where("teacherUid", "==", teacherUid),
      where("subjectCode", "==", subjectCode),
      where("term", "==", term),
      where("week", "==", week),
      where("schoolYear", "==", schoolYear)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const first = snap.docs[0];
    return { id: first.id, ...first.data() };
  } catch (e) {
    console.warn("[ilaw-store] findLesson failed:", e);
    return null;
  }
}

// ------------------------------------------------------------
// LIST MY LESSONS
// ------------------------------------------------------------
async function listMyLessons(teacherUid, filters = {}) {
  try {
    const ref = collection(db, "lessons");
    const constraints = [where("teacherUid", "==", teacherUid)];
    // Add optional filters
    if (filters.subjectCode) constraints.push(where("subjectCode", "==", filters.subjectCode));
    if (filters.term) constraints.push(where("term", "==", Number(filters.term)));
    if (filters.schoolYear) constraints.push(where("schoolYear", "==", filters.schoolYear));

    const q = query(ref, ...constraints);
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Sort in JS (avoids compound index requirement)
    items.sort((a, b) => {
      const tA = a.updatedAt?.toMillis?.() || 0;
      const tB = b.updatedAt?.toMillis?.() || 0;
      return tB - tA;
    });

    return items;
  } catch (e) {
    console.warn("[ilaw-store] listMyLessons failed:", e);
    return [];
  }
}

// ------------------------------------------------------------
// DELETE
// ------------------------------------------------------------
async function deleteLesson(lessonId) {
  const ref = doc(db, "lessons", lessonId);
  await deleteDoc(ref);
}

// ------------------------------------------------------------
// DUPLICATE
// ------------------------------------------------------------
async function duplicateLesson(lessonId, overrides = {}) {
  const original = await getLesson(lessonId);
  if (!original) throw new Error("Lesson not found");

  const { id, createdAt, updatedAt, ...rest } = original;
  const copy = {
    ...rest,
    ...overrides,
    status: "draft",
    title: (original.title || "Untitled") + " (Copy)",
  };

  return saveLesson(null, copy);
}

// ------------------------------------------------------------
// EXPORT
// ------------------------------------------------------------
window.ILAW = {
  saveLesson,
  getLesson,
  findLesson,
  listMyLessons,
  deleteLesson,
  duplicateLesson,
};