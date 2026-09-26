// bulletin.js — Firestore-backed bulletin board store.
// Auth is handled by memo-guard.js (in bulletin.html).
// This module only handles data operations. Rendered by the page's inline script.

import { auth, db } from "./firebase-config.js";
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, writeBatch, increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const COLLECTION = "bulletins";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function requireUser() {
  const u = auth.currentUser;
  if (!u) throw new Error("Please sign in to post.");
  return u;
}

function escapeHTML(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function formatDate(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return ''; }
}
function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function docToObj(snap) {
  const d = snap.data() || {};
  return {
    id: snap.id,
    text: d.text || "",
    category: d.category || "Announcements",
    image: d.image || null,
    author: d.author || "",
    authorUid: d.authorUid || "",
    likes: d.likes || 0,
    dateISO: d.dateISO || (d.createdAt?.toDate?.().toISOString?.()) || "",
    createdAt: d.createdAt?.toMillis?.() ?? 0,
  };
}

// ------------------------------------------------------------
// Public API (async)
// ------------------------------------------------------------
async function list() {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(docToObj);
}

async function add({ text, category, image }) {
  const u = requireUser();
  const clean = String(text || "").trim();
  if (!clean) throw new Error("Write something first.");

  const ref = await addDoc(collection(db, COLLECTION), {
    text: escapeHTML(clean),
    category: category || "Announcements",
    image: image || null,
    author: u.displayName || u.email || "user",
    authorUid: u.uid,
    likes: 0,
    dateISO: new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

async function updatePost(id, { text, category }) {
  requireUser();
  const clean = String(text || "").trim();
  if (!clean) throw new Error("Text cannot be empty.");
  await updateDoc(doc(db, COLLECTION, id), {
    text: escapeHTML(clean),
    category: category || "Announcements",
    updatedAt: serverTimestamp(),
  });
}

async function remove(id) {
  requireUser();
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

async function like(id) {
  // Public — even signed-out visitors can like
  await updateDoc(doc(db, COLLECTION, id), { likes: increment(1) });
}

// ------------------------------------------------------------
// Expose for the page's inline script
// ------------------------------------------------------------
window.Bulletin = {
  list, add, updatePost, remove, removeAll, like,
  escapeHTML, formatDate, truncate, fileToDataURL,
};