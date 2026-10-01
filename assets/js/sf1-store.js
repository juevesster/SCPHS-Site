// sf1-store.js — Firestore data layer for SF1 (School Form 1).
// Handles classes collection + students subcollection.
// Exposed as window.SF1 for the pages to use.

import { db, auth } from "./firebase-config.js";
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, writeBatch, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getSubjects } from "./curricula.js";

const CLASSES = "classes";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function requireUser() {
  const u = auth.currentUser;
  if (!u) throw new Error("Please sign in.");
  return u;
}

function classToObj(snap) {
  const d = snap.data() || {};
  return {
    id: snap.id,
    curriculum: d.curriculum || "MATATAG",
    gradeLevel: d.gradeLevel || "",
    section: d.section || "",
    track: d.track || null,
    schoolYear: d.schoolYear || "",
    classLabel: d.classLabel || "",
    adviserUid: d.adviserUid || "",
    adviserName: d.adviserName || "",
    subjectTeachers: d.subjectTeachers || {},
    teacherUids: d.teacherUids || [],
    principalName: d.principalName || "",
    schoolId: d.schoolId || "",
    schoolName: d.schoolName || "",
    region: d.region || "",
    division: d.division || "",
    totalMale: d.totalMale || 0,
    totalFemale: d.totalFemale || 0,
    createdAt: d.createdAt?.toMillis?.() ?? 0,
    createdBy: d.createdBy || "",
  };
}

function studentToObj(snap) {
  const d = snap.data() || {};
  return {
    id: snap.id,
    lrn: d.lrn || "",
    lastName: d.lastName || "",
    firstName: d.firstName || "",
    middleName: d.middleName || "",
    fullName: d.fullName || "",
    sex: d.sex || "",
    birthDate: d.birthDate || "",
    age: d.age || null,
    motherTongue: d.motherTongue || "",
    ip: d.ip || "",
    religion: d.religion || "",
    addressHouse: d.addressHouse || "",
    addressBarangay: d.addressBarangay || "",
    addressMunicipality: d.addressMunicipality || "",
    addressProvince: d.addressProvince || "",
    fatherName: d.fatherName || "",
    motherName: d.motherName || "",
    guardianName: d.guardianName || "",
    guardianRelationship: d.guardianRelationship || "",
    contactNumber: d.contactNumber || "",
    learningModality: d.learningModality || "",
    remarks: d.remarks || "",
    active: d.active !== false,
    addedAt: d.addedAt?.toMillis?.() ?? 0,
    addedBy: d.addedBy || "",
  };
}

// ------------------------------------------------------------
// CLASSES — CRUD
// ------------------------------------------------------------
async function listClasses({ forUid = null, includeAll = false } = {}) {
  const q = query(collection(db, CLASSES), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  let results = snap.docs.map(classToObj);

  if (forUid && !includeAll) {
    results = results.filter(c =>
      c.adviserUid === forUid || c.teacherUids.includes(forUid)
    );
  }
  return results;
}

async function getClass(classId) {
  if (!classId) return null;
  const snap = await getDoc(doc(db, CLASSES, classId));
  return snap.exists() ? classToObj(snap) : null;
}

async function createClass({
  curriculum, gradeLevel, section, track = null, schoolYear,
  adviserUid = "", adviserName = "",
  principalName = "", schoolId = "", schoolName = "",
  region = "", division = ""
}) {
  const user = requireUser();
  if (!curriculum || !gradeLevel || !section || !schoolYear) {
    throw new Error("Curriculum, grade level, section, and school year are required.");
  }

  const classLabel = `${gradeLevel} - ${section}${track ? " (" + track + ")" : ""}`;
  const subjects = getSubjects(curriculum, gradeLevel, track);

  // Build empty subjectTeachers map
  const subjectTeachers = {};
  subjects.forEach(s => { subjectTeachers[s] = ""; });

  const ref = await addDoc(collection(db, CLASSES), {
    curriculum,
    gradeLevel,
    section,
    track,
    schoolYear,
    classLabel,
    adviserUid,
    adviserName,
    subjectTeachers,
    teacherUids: adviserUid ? [adviserUid] : [],
    principalName,
    schoolId,
    schoolName,
    region,
    division,
    totalMale: 0,
    totalFemale: 0,
    createdAt: serverTimestamp(),
    createdBy: user.email || "",
  });
  return ref.id;
}

async function updateClass(classId, updates) {
  requireUser();
  if (!classId) throw new Error("Missing class id.");

  // Recompute label if gradeLevel/section/track changed
  const current = await getClass(classId);
  const gradeLevel = updates.gradeLevel ?? current.gradeLevel;
  const section = updates.section ?? current.section;
  const track = updates.track ?? current.track;
  updates.classLabel = `${gradeLevel} - ${section}${track ? " (" + track + ")" : ""}`;

  await updateDoc(doc(db, CLASSES, classId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

async function deleteClass(classId) {
  requireUser();
  if (!classId) throw new Error("Missing class id.");

  // Delete all students first
  const studentsSnap = await getDocs(collection(db, CLASSES, classId, "students"));
  const batch = writeBatch(db);
  studentsSnap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();

  // Then delete the class
  await deleteDoc(doc(db, CLASSES, classId));
}

async function assignSubjectTeacher(classId, subject, teacherUid) {
  requireUser();
  const cls = await getClass(classId);
  if (!cls) throw new Error("Class not found.");

  const subjectTeachers = { ...cls.subjectTeachers };
  subjectTeachers[subject] = teacherUid;

  // Rebuild teacherUids from subjectTeachers + adviserUid
  const uids = new Set();
  if (cls.adviserUid) uids.add(cls.adviserUid);
  Object.values(subjectTeachers).forEach(uid => { if (uid) uids.add(uid); });

  await updateDoc(doc(db, CLASSES, classId), {
    subjectTeachers,
    teacherUids: Array.from(uids),
    updatedAt: serverTimestamp(),
  });
}

// ------------------------------------------------------------
// STUDENTS — CRUD (subcollection)
// ------------------------------------------------------------
async function listStudents(classId) {
  if (!classId) return [];
  const q = query(
    collection(db, CLASSES, classId, "students"),
    orderBy("lastName", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(studentToObj);
}

async function addStudent(classId, data) {
  const user = requireUser();
  const ref = await addDoc(collection(db, CLASSES, classId, "students"), {
    ...data,
    active: true,
    addedAt: serverTimestamp(),
    addedBy: user.email || "",
  });
  return ref.id;
}

async function updateStudent(classId, studentId, updates) {
  requireUser();
  await updateDoc(doc(db, CLASSES, classId, "students", studentId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

async function deleteStudent(classId, studentId) {
  requireUser();
  await deleteDoc(doc(db, CLASSES, classId, "students", studentId));
}

// ------------------------------------------------------------
// Expose globally
// ------------------------------------------------------------
window.SF1 = {
  listClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  assignSubjectTeacher,
  listStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  importStudents,   // ← ADD THIS LINE
};

// ------------------------------------------------------------
// BULK IMPORT — for LIS file uploads
// ------------------------------------------------------------
async function importStudents(classId, studentsList) {
  const user = requireUser();
  if (!classId || !studentsList?.length) {
    throw new Error("Missing class ID or students.");
  }

  const batch = writeBatch(db);
  const studentCol = collection(db, CLASSES, classId, "students");

  // Get existing LRNs to prevent duplicates
  const existing = await listStudents(classId);
  const existingLRNs = new Set(existing.map(s => s.lrn));

  let imported = 0;
  let skipped = 0;
  const errors = [];

  for (const student of studentsList) {
    if (!student.lrn) {
      errors.push(`Missing LRN for ${student.fullName}`);
      continue;
    }
    if (existingLRNs.has(student.lrn)) {
      skipped++;
      continue;
    }

    const docRef = doc(studentCol);
    batch.set(docRef, {
      ...student,
      active: true,
      addedAt: serverTimestamp(),
      addedBy: user.email || "",
    });
    imported++;
  }

  await batch.commit();

  return {
    imported,
    skipped,
    errors,
    total: studentsList.length,
  };
}