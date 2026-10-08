// ============================================================
// LEARNER SHARE — V2
// Enables public sharing, QR code, Messenger, and link copying
// for a Learner Module.
// ============================================================

import { db } from "./firebase-config.js";
import {
  doc, updateDoc, getDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---------- Local helpers ----------
const esc = s => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// ---------- Slug generator ----------
// Makes human-readable slugs like "SCI9-T1W1" from lesson metadata
export function generateSlug(lesson) {
  const code = (lesson.subjectCode || "GEN").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const term = lesson.term ? `T${lesson.term}` : "";
  const week = lesson.week ? `W${lesson.week}` : "";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${code}-${term}${week}-${suffix}`.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

// ---------- Public URL builder ----------
export function buildPublicUrl(slug) {
  const base = location.origin + location.pathname.replace(/[^/]*$/, "");
  return `${base}m.html?slug=${encodeURIComponent(slug)}`;
}

// ---------- Enable public sharing on a lesson ----------
export async function enableSharing(lessonId, lesson) {
  const slug = lesson.publicSlug || generateSlug(lesson);
  const ref = doc(db, "lessons", lessonId);

  await updateDoc(ref, {
    isPublic: true,
    publicSlug: slug,
    sharedAt: serverTimestamp(),
    viewCount: lesson.viewCount || 0,
  });

  return {
    slug,
    url: buildPublicUrl(slug),
  };
}

// ---------- Disable public sharing ----------
export async function disableSharing(lessonId) {
  const ref = doc(db, "lessons", lessonId);
  await updateDoc(ref, {
    isPublic: false,
  });
}

// ---------- Fetch a shared lesson by slug (public read) ----------
export async function getSharedLessonBySlug(slug) {
  // We query the lessons collection publicly (rules allow read if isPublic = true)
  const { collection, query, where, getDocs } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
  );

  const q = query(
    collection(db, "lessons"),
    where("publicSlug", "==", slug),
    where("isPublic", "==", true)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

// ---------- QR code generator (uses free qrserver.com API) ----------
export function generateQrCodeUrl(url, size = 240) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=0f2b4f&bgcolor=ffffff`;
}

// ---------- Open Messenger share dialog ----------
export function shareToMessenger(url, title) {
  const messengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&redirect_uri=${encodeURIComponent(location.origin + location.pathname)}&app_id=`;
  // Note: Facebook's app_id-less dialog works for basic shares; if you have an app_id, add it
  window.open(messengerUrl, "_blank", "noopener,noreferrer,width=600,height=600");
}

// ---------- Copy URL to clipboard ----------
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch (e) {
    console.error("[learner-share] copy failed:", e);
    return false;
  }
}

// ---------- Native share (mobile) with fallback ----------
export async function nativeShare(url, title, text) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (e) {
      if (e.name !== "AbortError") console.warn("[learner-share] share error:", e);
      return false;
    }
  }
  return false;
}

export { esc };