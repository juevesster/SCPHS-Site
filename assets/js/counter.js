// counter.js — Firestore-backed visitor counter.
// Reads the shared `site_stats/visits` doc that visitor-counter.js writes to.
// So both `index.html` and `login.html` show the SAME number.

import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const STATS_REF = doc(db, "site_stats", "visits");

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

(async () => {
  try {
    // Total visits (shared doc written by visitor-counter.js)
    const totalSnap = await getDoc(STATS_REF);
    const total = totalSnap.exists() ? (totalSnap.data().count || 0) : 0;

    // Today's visits
    const todaySnap = await getDoc(doc(db, "site_stats", "daily_" + todayKey()));
    const today = todaySnap.exists() ? (todaySnap.data().count || 0) : 0;

    setText("views-today", today.toLocaleString());
    setText("views-total", total.toLocaleString());
  } catch (e) {
    console.warn("[counter] read failed:", e?.code || e?.message);
    setText("views-today", "—");
    setText("views-total", "—");
  }
})();