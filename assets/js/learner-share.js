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
  // Reuse existing slug if present — never regenerate
  // (so old QR codes and printed modules keep working)
  let slug = lesson.publicSlug;

  if (!slug) {
    // First time — check if lesson doc already has a slug in Firestore
    const ref = doc(db, "lessons", lessonId);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const existing = snap.data();
        if (existing.publicSlug) {
          slug = existing.publicSlug;
        }
      }
    } catch (e) {
      console.warn("[learner-share] Could not check existing slug:", e);
    }

    // Still none — generate one
    if (!slug) {
      slug = generateSlug(lesson);
    }
  }

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

// ============================================================
// ✅ FIXED: Fetch a shared lesson by slug (public read)
// Flattens signatories so buildLearnerModuleHTML can find them
// ============================================================
export async function getSharedLessonBySlug(slug) {
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
  const data = docSnap.data();
  const sig = data.signatories || {};

  // 🆕 Flatten signatories so buildLearnerModuleHTML finds them at top level
  return {
    id: docSnap.id,
    ...data,

    // Flatten signatories
    preparedByName:     sig.preparedByName     || data.teacherName || "",
    preparedByPosition: sig.preparedByPosition || "Teacher",
    checkedByName:      sig.checkedByName      || "",
    checkedByPosition:  sig.checkedByPosition  || "",
    notedByName:        sig.notedByName        || "",
    notedByPosition:    sig.notedByPosition    || "",
  };
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

// ------------------------------------------------------------
// LAS sharing — same collection, different fields
// ------------------------------------------------------------
export async function enableLASSharing(lessonId, lesson) {
  let slug = lesson.lasPublicSlug;
  if (!slug) {
    const { doc: _doc, getDoc: _getDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    const ref = _doc(db, "lessons", lessonId);
    try {
      const snap = await _getDoc(ref);
      if (snap.exists() && snap.data().lasPublicSlug) {
        slug = snap.data().lasPublicSlug;
      }
    } catch (e) {
      console.warn("[learner-share] Could not check existing LAS slug:", e);
    }
    if (!slug) {
      // Slug uses LAS- prefix so it's distinguishable from module slugs
      slug = "LAS-" + generateSlug(lesson);
    }
  }

  const ref = doc(db, "lessons", lessonId);
  await updateDoc(ref, {
    lasIsPublic: true,
    lasPublicSlug: slug,
    lasSharedAt: serverTimestamp(),
  });

  return {
    slug,
    url: buildLASPublicUrl(slug),
  };
}

export async function disableLASSharing(lessonId) {
  const ref = doc(db, "lessons", lessonId);
  await updateDoc(ref, { lasIsPublic: false });
}

// ============================================================
// ✅ FIXED: Fetch a shared LAS by slug (public read)
// Flattens signatories the same way as the Learner Module
// ============================================================
export async function getSharedLASBySlug(slug) {
  const { collection, query, where, getDocs } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
  );
  const q = query(
    collection(db, "lessons"),
    where("lasPublicSlug", "==", slug),
    where("lasIsPublic", "==", true)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  const data = docSnap.data();
  const sig = data.signatories || {};

  // 🆕 Flatten signatories so buildLASHTML finds them at top level
  return {
    id: docSnap.id,
    ...data,
    preparedByName:     sig.preparedByName     || data.teacherName || "",
    preparedByPosition: sig.preparedByPosition || "Teacher",
    checkedByName:      sig.checkedByName      || "",
    checkedByPosition:  sig.checkedByPosition  || "",
    notedByName:        sig.notedByName        || "",
    notedByPosition:    sig.notedByPosition    || "",
  };
}

export function buildLASPublicUrl(slug) {
  const base = location.origin + location.pathname.replace(/[^/]*$/, "");
  return `${base}las.html?slug=${encodeURIComponent(slug)}`;
}