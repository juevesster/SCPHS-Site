// visitor-counter.js — Site-wide visitor counter using Firestore.
// Increments BOTH total and daily counters, once per browser session.
// Uses Philippine time zone (Asia/Manila) for date keys.

import { db } from "./firebase-config.js";
import {
  doc, getDoc, setDoc, increment, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const TOTAL_DOC = doc(db, "site_stats", "visits");

// ------------------------------------------------------------
// Philippine date key — "2026-09-28" based on Asia/Manila time
// ------------------------------------------------------------
function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dailyDoc() {
  return doc(db, "site_stats", "daily_" + todayKey());
}

// ------------------------------------------------------------
// Session dedup
// ------------------------------------------------------------
function hasVisitedThisSession() {
  try {
    return sessionStorage.getItem("scphs_counted") === "1";
  } catch {
    return false;
  }
}
function markVisited() {
  try { sessionStorage.setItem("scphs_counted", "1"); } catch {}
}

// ------------------------------------------------------------
// Increment total (site_stats/visits)
// ------------------------------------------------------------
async function bumpTotal() {
  const snap = await getDoc(TOTAL_DOC);
  if (!snap.exists()) {
    await setDoc(TOTAL_DOC, {
      count: 1,
      firstVisit: serverTimestamp(),
      lastVisit: serverTimestamp(),
    });
    return 1;
  }
  const current = snap.data().count || 0;
  await setDoc(TOTAL_DOC, {
    count: increment(1),
    lastVisit: serverTimestamp(),
  }, { merge: true });
  return current + 1;
}

// ------------------------------------------------------------
// Increment daily (site_stats/daily_YYYY-MM-DD)
// ------------------------------------------------------------
async function bumpDaily() {
  const ref = dailyDoc();
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      count: 1,
      date: todayKey(),
      createdAt: serverTimestamp(),
    });
    return 1;
  }
  const current = snap.data().count || 0;
  await setDoc(ref, {
    count: increment(1),
    lastVisit: serverTimestamp(),
  }, { merge: true });
  return current + 1;
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------
export async function trackVisit() {
  try {
    if (hasVisitedThisSession()) {
      // Already counted — just read current values
      const [totalSnap, dailySnap] = await Promise.all([
        getDoc(TOTAL_DOC),
        getDoc(dailyDoc()),
      ]);
      return {
        total: totalSnap.exists() ? (totalSnap.data().count || 0) : 0,
        daily: dailySnap.exists() ? (dailySnap.data().count || 0) : 0,
      };
    }

    // First visit this session — increment both
    const [total, daily] = await Promise.all([
      bumpTotal(),
      bumpDaily(),
    ]);
    markVisited();
    return { total, daily };
  } catch (e) {
    console.warn("[visitor-counter] failed:", e?.code || e?.message);
    return null;
  }
}

export async function getVisitCount() {
  try {
    const snap = await getDoc(TOTAL_DOC);
    return snap.exists() ? (snap.data().count || 0) : 0;
  } catch {
    return 0;
  }
}

export async function getTodayCount() {
  try {
    const snap = await getDoc(dailyDoc());
    return snap.exists() ? (snap.data().count || 0) : 0;
  } catch {
    return 0;
  }
}