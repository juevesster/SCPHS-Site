// counter.js — Reads the visitor counter from Firestore.
// Uses the same docs and time zone as visitor-counter.js.

import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const TOTAL_DOC = doc(db, "site_stats", "visits");

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

(async () => {
  try {
    const [totalSnap, dailySnap] = await Promise.all([
      getDoc(TOTAL_DOC),
      getDoc(doc(db, "site_stats", "daily_" + todayKey())),
    ]);

    const total = totalSnap.exists() ? (totalSnap.data().count || 0) : 0;
    const daily = dailySnap.exists() ? (dailySnap.data().count || 0) : 0;

    setText("views-today", daily.toLocaleString());
    setText("views-total", total.toLocaleString());
  } catch (e) {
    console.warn("[counter] read failed:", e?.code || e?.message);
    setText("views-today", "—");
    setText("views-total", "—");
  }
})();