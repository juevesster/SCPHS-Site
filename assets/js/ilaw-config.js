// ============================================================
// ilaw-config.js — School-wide ILAW header/signatories config
// Stored in: config/ilaw_settings (Firestore)
// Defaults: SCPHS (pre-filled)
// ============================================================

import { db } from "./firebase-config.js";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ------------------------------------------------------------
// DEFAULT CONFIG (SCPHS pre-filled)
// ------------------------------------------------------------
export const ILAW_DEFAULTS = {
  // Header
  depedLogo: "assets/images/deped-logo.png",
  headerLine1: "Republic of the Philippines",
  headerLine2: "Department of Education",
  region: "Region II – Cagayan Valley",
  division: "Schools Division of Nueva Vizcaya",

  // School identity
  schoolLogo: "assets/images/scphslogo.png",
  schoolName: "STA. CRUZ PINGKIAN HIGH SCHOOL",
  schoolAddress: "Brgy. Sta. Cruz, Pingkian, Nueva Vizcaya",
  rightLogo: "assets/images/Bagong-Pilipinas-Logo.png",

  // Document title
  titleLabel: "ILAW LESSON PLAN",

  // Default signatories
  preparedByLabel: "Prepared by:",
  checkedByLabel: "Checked by:",
  notedByLabel: "Noted by:",
  defaultPrincipalName: "",
  defaultPrincipalPosition: "Principal IV",

  // Footer
  footerLine1: "Republic of the Philippines • Department of Education",
  footerLine2: "",
  showPageNumbers: true,
  showGeneratedDate: true,
};

// ------------------------------------------------------------
// LOAD CONFIG
// ------------------------------------------------------------
export async function loadILAWConfig() {
  try {
    const ref = doc(db, "config", "ilaw_settings");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { ...ILAW_DEFAULTS, ...snap.data() };
    }
    return { ...ILAW_DEFAULTS };
  } catch (e) {
    console.warn("[ilaw-config] load failed, using defaults:", e);
    return { ...ILAW_DEFAULTS };
  }
}

// ------------------------------------------------------------
// SAVE CONFIG
// ------------------------------------------------------------
export async function saveILAWConfig(data) {
  const ref = doc(db, "config", "ilaw_settings");
  await setDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return true;
}

// ------------------------------------------------------------
// RESET TO SCPHS DEFAULTS
// ------------------------------------------------------------
export async function resetILAWConfig() {
  await saveILAWConfig({ ...ILAW_DEFAULTS });
  return { ...ILAW_DEFAULTS };
}

// Expose globally
window.ILAWConfig = {
  DEFAULTS: ILAW_DEFAULTS,
  load: loadILAWConfig,
  save: saveILAWConfig,
  reset: resetILAWConfig,
};