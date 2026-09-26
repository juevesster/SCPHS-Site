// school-memos.js — Firestore-backed school memoranda store.
// Same public API as the old localStorage version:
//   SchoolMemos.add(payload)
//   SchoolMemos.list()
//   SchoolMemos.get(id)
//   SchoolMemos.update(id, patch)
//   SchoolMemos.remove(id)
//   SchoolMemos.removeAll()
// All methods are async now (return Promises).

import { auth, db } from "./firebase-config.js";
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const COLLECTION = "memos";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function requireUser() {
  const u = auth.currentUser;
  if (!u) throw new Error("Not signed in.");
  return u;
}

function normalizePayload(p = {}) {
  return {
    title:  String(p.title  || "").trim(),
    series: String(p.series || "").trim(),
    date:   String(p.date   || "").trim(),
    url:    String(p.url    || "").trim(),
    source: String(p.source || "").trim(),
    desc:   String(p.desc   || "").trim(),
  };
}

// Convert Firestore doc → plain object with id
function docToObj(snap) {
  const data = snap.data() || {};
  return {
    id: snap.id,
    title: data.title || "",
    series: data.series || "",
    date: data.date || "",
    url: data.url || "",
    source: data.source || "",
    desc: data.desc || "",
    createdAt: data.createdAt?.toMillis?.() ?? null,
    updatedAt: data.updatedAt?.toMillis?.() ?? null,
    createdBy: data.createdBy || "",
    createdByName: data.createdByName || "",
  };
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------
async function list() {
  const q = query(collection(db, COLLECTION), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(docToObj);
}

async function get(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? docToObj(snap) : null;
}

async function add(payload) {
  const u = requireUser();
  const clean = normalizePayload(payload);
  if (!clean.title) throw new Error("Title is required.");

  const ref = await addDoc(collection(db, COLLECTION), {
    ...clean,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: u.uid,
    createdByName: u.displayName || u.email || "",
  });
  return ref.id;
}

async function update(id, patch) {
  const u = requireUser();
  if (!id) throw new Error("Missing memo id.");
  const clean = normalizePayload(patch);
  if (!clean.title) throw new Error("Title is required.");

  await updateDoc(doc(db, COLLECTION, id), {
    ...clean,
    updatedAt: serverTimestamp(),
    updatedBy: u.uid,
    updatedByName: u.displayName || u.email || "",
  });
}

async function remove(id) {
  requireUser();
  if (!id) throw new Error("Missing memo id.");
  await deleteDoc(doc(db, COLLECTION, id));
}

async function removeAll() {
  requireUser();
  const snap = await getDocs(collection(db, COLLECTION));
  if (snap.empty) return 0;
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}

// ------------------------------------------------------------
// Expose as global so non-module scripts can use it
// ------------------------------------------------------------
window.SchoolMemos = {
  list,
  get,
  add,
  update,
  remove,
  removeAll,
};