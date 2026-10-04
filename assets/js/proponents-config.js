// ============================================================
// proponents-config.js — System proponents config
// Stored in: config/proponents (Firestore)
// ============================================================

import { db } from "./firebase-config.js";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ------------------------------------------------------------
// DEFAULT CONFIG (SCPHS pre-filled)
// ------------------------------------------------------------
export const PROPONENTS_DEFAULTS = {
  list: [
    {
      emoji: "👨‍💻",
      name: "RICARDO E. JUEVES JR.",
      role: "System Developer",
      badge: "Lead Developer",
      isLead: true,
    },
    {
      emoji: "👨‍🏫",
      name: "ARMAN P. PUYAO",
      role: "Proponent",
      badge: "",
      isLead: false,
    },
    {
      emoji: "👨‍🎓",
      name: "NISAN K. BINWAG",
      role: "Proponent",
      badge: "",
      isLead: false,
    },
  ],
  poweredBy: "Powered by DepEd LMS v2.0",
  copyright: "© 2026 · All Rights Reserved",
};

// ------------------------------------------------------------
// LOAD
// ------------------------------------------------------------
export async function loadProponents() {
  try {
    const ref = doc(db, "config", "proponents");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...PROPONENTS_DEFAULTS,
        ...data,
        list: data.list && data.list.length ? data.list : PROPONENTS_DEFAULTS.list,
      };
    }
    return { ...PROPONENTS_DEFAULTS };
  } catch (e) {
    console.warn("[proponents] load failed, using defaults:", e);
    return { ...PROPONENTS_DEFAULTS };
  }
}

// ------------------------------------------------------------
// SAVE
// ------------------------------------------------------------
export async function saveProponents(data) {
  const ref = doc(db, "config", "proponents");
  await setDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return true;
}

// ------------------------------------------------------------
// RESET
// ------------------------------------------------------------
export async function resetProponents() {
  await saveProponents({ ...PROPONENTS_DEFAULTS });
  return { ...PROPONENTS_DEFAULTS };
}

// ------------------------------------------------------------
// RENDER HELPER — used by login.html
// ------------------------------------------------------------
export function renderProponents(host, config) {
  if (!host) return;
  const { list, poweredBy, copyright } = config;

  host.innerHTML = `
    <div class="proponents-title">💡 System Proponents</div>
    <div class="proponents-grid">
      ${list.map(p => `
        <div class="proponent-card ${p.isLead ? "lead" : ""}">
          <div class="proponent-avatar">${p.emoji || "👤"}</div>
          <div class="proponent-name">${escapeHtml(p.name || "")}</div>
          <div class="proponent-role">${escapeHtml(p.role || "")}</div>
          ${p.badge ? `<div class="proponent-badge">${escapeHtml(p.badge)}</div>` : ""}
        </div>
      `).join("")}
    </div>
    <div class="proponents-footer">
      ${poweredBy ? `<div class="powered-by">${escapeHtml(poweredBy)}</div>` : ""}
      ${copyright ? `<div class="copyright">${escapeHtml(copyright)}</div>` : ""}
    </div>
  `;
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Expose globally
window.Proponents = {
  DEFAULTS: PROPONENTS_DEFAULTS,
  load: loadProponents,
  save: saveProponents,
  reset: resetProponents,
  render: renderProponents,
};