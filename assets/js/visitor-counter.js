// visitor-counter.js — Site-wide visitor counter using Firestore.
// Increments once per browser session (not per page load).

import { db } from "./firebase-config.js";
import {
  doc, getDoc, setDoc, updateDoc, increment, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const STATS_DOC = doc(db, "site_stats", "visits");

// Check if this browser has already been counted in this session
function hasVisitedThisSession() {
  try {
    return sessionStorage.getItem("scphs_counted") === "1";
  } catch (e) {
    return false;
  }
}

function markVisited() {
  try { sessionStorage.setItem("scphs_counted", "1"); } catch (e) {}
}

/**
 * Increment the visitor counter (once per session).
 * Returns the new total.
 */
export async function trackVisit() {
  try {
    if (hasVisitedThisSession()) {
      // Already counted this session — just read the current value
      const snap = await getDoc(STATS_DOC);
      return snap.exists() ? (snap.data().count || 0) : 0;
    }

    // First visit this session — increment
    const snap = await getDoc(STATS_DOC);
    if (!snap.exists()) {
      await setDoc(STATS_DOC, {
        count: 1,
        firstVisit: serverTimestamp(),
        lastVisit: serverTimestamp(),
      });
      markVisited();
      return 1;
    }

    await updateDoc(STATS_DOC, {
      count: increment(1),
      lastVisit: serverTimestamp(),
    });
    markVisited();
    return (snap.data().count || 0) + 1;
  } catch (e) {
    console.warn("[visitor-counter] failed:", e?.code || e?.message);
    return null;
  }
}

/**
 * Read the current visitor count without incrementing.
 */
export async function getVisitCount() {
  try {
    const snap = await getDoc(STATS_DOC);
    return snap.exists() ? (snap.data().count || 0) : 0;
  } catch (e) {
    console.warn("[visitor-counter] read failed:", e?.code || e?.message);
    return 0;
  }
}

/**
 * Optionally: get today's visits (requires a different data shape).
 */
export async function getTodayCount() {
  const today = new Date().toISOString().slice(0, 10); // "2026-09-26"
  try {
    const snap = await getDoc(doc(db, "site_stats", "daily_" + today));
    return snap.exists() ? (snap.data().count || 0) : 0;
  } catch (e) {
    return 0;
  }
}