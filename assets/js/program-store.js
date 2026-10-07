// program-store.js — Firestore data layer for class program (schedule grid).
// Supports: multi-teacher entries (TLE rotation), term switching, subject+specialization.

import { db, auth } from "./firebase-config.js";
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const CLASSES = "classes";
const PROGRAM = "program";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function requireUser() {
  const u = auth.currentUser;
  if (!u) throw new Error("Please sign in.");
  return u;
}

function entryToObj(snap) {
  const d = snap.data() || {};
  return {
    id: snap.id,
    day: d.day || "",
    timeSlotId: d.timeSlotId || "",
    term: d.term || 1,
    subject: d.subject || "",
    subjectName: d.subjectName || "",
    teacherUid: d.teacherUid || "",
    teacherName: d.teacherName || "",
    specialization: d.specialization || "",
    room: d.room || "",
    entryType: d.entryType || "primary",   // "primary" | "additional"
    groupIndex: d.groupIndex || 0,
    notes: d.notes || "",
    createdAt: d.createdAt?.toMillis?.() ?? 0,
    updatedAt: d.updatedAt?.toMillis?.() ?? 0,
    createdBy: d.createdBy || "",
  };
}

// ------------------------------------------------------------
// READ — List all program entries for a class + term
// ------------------------------------------------------------
async function listProgram(classId, term = 1) {
  if (!classId) return [];

  const q = query(
    collection(db, CLASSES, classId, PROGRAM),
    where("term", "==", Number(term))
  );
  const snap = await getDocs(q);
  return snap.docs.map(entryToObj);
}

// ------------------------------------------------------------
// READ — Get one entry
// ------------------------------------------------------------
async function getEntry(classId, entryId) {
  if (!classId || !entryId) return null;
  const snap = await getDoc(doc(db, CLASSES, classId, PROGRAM, entryId));
  return snap.exists() ? entryToObj(snap) : null;
}

// ------------------------------------------------------------
// CREATE — Add a program entry
// ------------------------------------------------------------
async function addEntry(classId, data) {
  const user = requireUser();
  if (!classId) throw new Error("Missing class ID.");
  if (!data.day || !data.timeSlotId || !data.subject) {
    throw new Error("Day, time slot, and subject are required.");
  }

  const ref = await addDoc(collection(db, CLASSES, classId, PROGRAM), {
    day: data.day,
    timeSlotId: data.timeSlotId,
    term: Number(data.term || 1),
    subject: data.subject.trim(),
    subjectName: (data.subjectName || data.subject).trim(),
    teacherUid: data.teacherUid || "",
    teacherName: (data.teacherName || "").trim(),
    specialization: (data.specialization || "").trim(),
    room: (data.room || "").trim(),
    entryType: data.entryType || "primary",
    groupIndex: data.groupIndex || 0,
    notes: (data.notes || "").trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: user.email || "",
  });
  return ref.id;
}

// ------------------------------------------------------------
// UPDATE — Modify an existing entry
// ------------------------------------------------------------
async function updateEntry(classId, entryId, updates) {
  requireUser();
  if (!classId || !entryId) throw new Error("Missing class ID or entry ID.");

  const clean = {};
  const allowed = [
    "day", "timeSlotId", "term", "subject", "subjectName",
    "teacherUid", "teacherName", "specialization", "room",
    "entryType", "groupIndex", "notes"
  ];
  allowed.forEach(k => {
    if (updates[k] !== undefined) clean[k] = updates[k];
  });
  clean.updatedAt = serverTimestamp();

  await updateDoc(doc(db, CLASSES, classId, PROGRAM, entryId), clean);
}

// ------------------------------------------------------------
// DELETE — Remove one entry
// ------------------------------------------------------------
async function deleteEntry(classId, entryId) {
  requireUser();
  await deleteDoc(doc(db, CLASSES, classId, PROGRAM, entryId));
}

// ------------------------------------------------------------
// BULK DELETE — Remove all entries for a class + term
// ------------------------------------------------------------
async function clearProgram(classId, term) {
  requireUser();
  if (!classId) throw new Error("Missing class ID.");

  const q = query(
    collection(db, CLASSES, classId, PROGRAM),
    where("term", "==", Number(term))
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;

  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}

// ------------------------------------------------------------
// BULK CREATE — Add many entries at once (for templates)
// ------------------------------------------------------------
async function bulkAddEntries(classId, entries) {
  const user = requireUser();
  if (!classId || !entries?.length) {
    throw new Error("Missing class ID or entries.");
  }

  const batch = writeBatch(db);
  const colRef = collection(db, CLASSES, classId, PROGRAM);

  entries.forEach(entry => {
    const docRef = doc(colRef);
    batch.set(docRef, {
      day: entry.day || "",
      timeSlotId: entry.timeSlotId || "",
      term: Number(entry.term || 1),
      subject: entry.subject || "",
      subjectName: entry.subjectName || entry.subject || "",
      teacherUid: entry.teacherUid || "",
      teacherName: entry.teacherName || "",
      specialization: entry.specialization || "",
      room: entry.room || "",
      entryType: entry.entryType || "primary",
      groupIndex: entry.groupIndex || 0,
      notes: entry.notes || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.email || "",
    });
  });

  await batch.commit();
  return entries.length;
}

// ------------------------------------------------------------
// QUERY — Get unique teachers assigned to a class
// ------------------------------------------------------------
async function listAssignedTeachers(classId, term = 1) {
  const entries = await listProgram(classId, term);
  const teacherMap = new Map();
  entries.forEach(e => {
    if (e.teacherUid && !teacherMap.has(e.teacherUid)) {
      teacherMap.set(e.teacherUid, {
        uid: e.teacherUid,
        name: e.teacherName,
        subjects: new Set(),
        specializations: new Set(),
      });
    }
    if (e.teacherUid) {
      const t = teacherMap.get(e.teacherUid);
      if (e.subject) t.subjects.add(e.subject);
      if (e.specialization) t.specializations.add(e.specialization);
    }
  });

  return Array.from(teacherMap.values()).map(t => ({
    uid: t.uid,
    name: t.name,
    subjects: Array.from(t.subjects),
    specializations: Array.from(t.specializations),
  }));
}

// ------------------------------------------------------------
// Expose globally
// ------------------------------------------------------------
window.ProgramStore = {
  listProgram,
  getEntry,
  addEntry,
  updateEntry,
  deleteEntry,
  clearProgram,
  bulkAddEntries,
  listAssignedTeachers,
  copyTerm,   // ← ADD THIS
};

// ------------------------------------------------------------
// COPY TERM — Duplicate all entries from one term to another
// ------------------------------------------------------------
async function copyTerm(classId, fromTerm, toTerm) {
  requireUser();
  if (!classId) throw new Error("Missing class ID.");
  if (Number(fromTerm) === Number(toTerm)) {
    throw new Error("Cannot copy a term into itself.");
  }

  const colRef = collection(db, CLASSES, classId, PROGRAM);

  // 1. Load all entries
  const allSnap = await getDocs(colRef);
  const all = allSnap.docs.map(entryToObj);

  const sourceEntries = all.filter(e => Number(e.term) === Number(fromTerm));
  const targetEntries = all.filter(e => Number(e.term) === Number(toTerm));

  if (!sourceEntries.length) {
    return { copied: 0, skipped: 0, sourceCount: 0 };
  }

  // 2. Build dedupe set from existing target entries
  const targetKeys = new Set();
  targetEntries.forEach(e => {
    targetKeys.add(`${e.day}|${e.timeSlotId}|${e.subject}|${e.teacherUid || ""}`);
  });

  // 3. Copy each source entry
  let copied = 0, skipped = 0, errors = 0;

  for (const e of sourceEntries) {
    const key = `${e.day}|${e.timeSlotId}|${e.subject}|${e.teacherUid || ""}`;
    if (targetKeys.has(key)) { skipped++; continue; }

    try {
      await addDoc(colRef, {
        day: e.day,
        timeSlotId: e.timeSlotId,
        term: Number(toTerm),
        subject: e.subject || "",
        subjectName: e.subjectName || e.subject || "",
        teacherUid: e.teacherUid || "",
        teacherName: e.teacherName || "",
        specialization: e.specialization || "",
        room: e.room || "",
        entryType: e.entryType || "primary",
        groupIndex: e.groupIndex || 0,
        notes: e.notes || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: e.createdBy || "",
        copiedFromTerm: Number(fromTerm),
      });
      copied++;
      targetKeys.add(key);
    } catch (err) {
      console.error("[copyTerm] failed to copy entry:", err);
      errors++;
    }
  }

  return { copied, skipped, errors, sourceCount: sourceEntries.length };
}