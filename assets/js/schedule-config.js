// schedule-config.js — Time slot configuration for SCPHS Portal.
// Contains default templates per curriculum + helper functions.

import { db } from "./firebase-config.js";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================================================
// DEFAULT TIME SLOT TEMPLATES
// ============================================================

export const TIME_SLOT_TEMPLATES = {

  // ----------------------------------------------------------
  // MATATAG Curriculum (DO 009, s. 2026)
  // Used for: JHS Grades 7-10 in MATATAG
  // ----------------------------------------------------------
  "MATATAG": [
    { id: "flag",          label: "Flag Ceremony",  start: "07:20", end: "07:45", type: "ceremony", orderIndex: 1 },
    { id: "period-1",      label: "Period 1",       start: "07:45", end: "08:45", type: "class",    orderIndex: 2 },
    { id: "period-2",      label: "Period 2",       start: "08:45", end: "09:45", type: "class",    orderIndex: 3 },
    { id: "health-break",  label: "Health Break",   start: "09:45", end: "10:00", type: "break",    orderIndex: 4 },
    { id: "period-3",      label: "Period 3",       start: "10:00", end: "11:00", type: "class",    orderIndex: 5 },
    { id: "period-4",      label: "Period 4",       start: "11:00", end: "12:00", type: "class",    orderIndex: 6 },
    { id: "lunch-break",   label: "Lunch Break",    start: "12:00", end: "13:00", type: "break",    orderIndex: 7 },
    { id: "period-5",      label: "Period 5",       start: "13:00", end: "14:00", type: "class",    orderIndex: 8 },
    { id: "period-6",      label: "Period 6",       start: "14:00", end: "15:00", type: "class",    orderIndex: 9 },
    { id: "period-7",      label: "Period 7",       start: "15:00", end: "16:00", type: "class",    orderIndex: 10 },
    { id: "aral",          label: "Aral Program",   start: "16:00", end: "17:00", type: "aral",     orderIndex: 11 },
  ],

  // ----------------------------------------------------------
  // K-12 Curriculum (legacy)
  // Same times, similar structure — can be adjusted per school
  // ----------------------------------------------------------
  "K-12": [
    { id: "flag",          label: "Flag Ceremony",  start: "07:00", end: "07:20", type: "ceremony", orderIndex: 1 },
    { id: "homeroom",      label: "Homeroom",       start: "07:20", end: "08:00", type: "homeroom", orderIndex: 2 },
    { id: "period-1",      label: "Period 1",       start: "08:00", end: "09:00", type: "class",    orderIndex: 3 },
    { id: "health-break",  label: "Health Break",   start: "09:00", end: "09:20", type: "break",    orderIndex: 4 },
    { id: "period-2",      label: "Period 2",       start: "09:20", end: "10:20", type: "class",    orderIndex: 5 },
    { id: "period-3",      label: "Period 3",       start: "10:20", end: "11:20", type: "class",    orderIndex: 6 },
    { id: "lunch-break",   label: "Lunch Break",    start: "11:20", end: "12:20", type: "break",    orderIndex: 7 },
    { id: "period-4",      label: "Period 4",       start: "12:20", end: "13:20", type: "class",    orderIndex: 8 },
    { id: "period-5",      label: "Period 5",       start: "13:20", end: "14:20", type: "class",    orderIndex: 9 },
    { id: "period-6",      label: "Period 6",       start: "14:20", end: "15:20", type: "class",    orderIndex: 10 },
  ],

  // ----------------------------------------------------------
  // Strengthened SHS Curriculum (Grades 11-12)
  // Semester-based, longer periods
  // ----------------------------------------------------------
  "Strengthened-SHS": [
    { id: "flag",          label: "Flag Ceremony",  start: "07:00", end: "07:20", type: "ceremony", orderIndex: 1 },
    { id: "period-1",      label: "Period 1",       start: "07:20", end: "08:40", type: "class",    orderIndex: 2 },
    { id: "period-2",      label: "Period 2",       start: "08:40", end: "10:00", type: "class",    orderIndex: 3 },
    { id: "health-break",  label: "Health Break",   start: "10:00", end: "10:20", type: "break",    orderIndex: 4 },
    { id: "period-3",      label: "Period 3",       start: "10:20", end: "11:40", type: "class",    orderIndex: 5 },
    { id: "lunch-break",   label: "Lunch Break",    start: "11:40", end: "12:40", type: "break",    orderIndex: 6 },
    { id: "period-4",      label: "Period 4",       start: "12:40", end: "14:00", type: "class",    orderIndex: 7 },
    { id: "period-5",      label: "Period 5",       start: "14:00", end: "15:20", type: "class",    orderIndex: 8 },
  ],

  // ----------------------------------------------------------
  // Legacy SHS (for Grade 12 in transition)
  // ----------------------------------------------------------
  "Legacy-SHS": [
    { id: "flag",          label: "Flag Ceremony",  start: "07:00", end: "07:20", type: "ceremony", orderIndex: 1 },
    { id: "period-1",      label: "Period 1",       start: "07:20", end: "08:20", type: "class",    orderIndex: 2 },
    { id: "period-2",      label: "Period 2",       start: "08:20", end: "09:20", type: "class",    orderIndex: 3 },
    { id: "health-break",  label: "Health Break",   start: "09:20", end: "09:40", type: "break",    orderIndex: 4 },
    { id: "period-3",      label: "Period 3",       start: "09:40", end: "10:40", type: "class",    orderIndex: 5 },
    { id: "period-4",      label: "Period 4",       start: "10:40", end: "11:40", type: "class",    orderIndex: 6 },
    { id: "lunch-break",   label: "Lunch Break",    start: "11:40", end: "12:40", type: "break",    orderIndex: 7 },
    { id: "period-5",      label: "Period 5",       start: "12:40", end: "13:40", type: "class",    orderIndex: 8 },
    { id: "period-6",      label: "Period 6",       start: "13:40", end: "14:40", type: "class",    orderIndex: 9 },
    { id: "period-7",      label: "Period 7",       start: "14:40", end: "15:40", type: "class",    orderIndex: 10 },
  ],
};

// ------------------------------------------------------------
// Which template to use for a given curriculum
// ------------------------------------------------------------
export function getTemplateForCurriculum(curriculum) {
  if (curriculum === "MATATAG") return "MATATAG";
  if (curriculum === "K-12") return "K-12";
  if (curriculum === "Strengthened-SHS") return "Strengthened-SHS";
  if (curriculum === "Legacy-SHS") return "Legacy-SHS";
  return "MATATAG"; // safe default
}

// ============================================================
// STORAGE FUNCTIONS (Firestore)
// ============================================================

const CONFIG_PATH = "config/timeSlots";
const CONFIG_DOC = doc(db, "config", "timeSlots");

/**
 * Load the school's time slots configuration from Firestore.
 * Returns the slots array, or null if not configured.
 */
export async function loadTimeSlots() {
  try {
    const snap = await getDoc(CONFIG_DOC);
    if (snap.exists() && Array.isArray(snap.data().slots)) {
      return snap.data().slots;
    }
    return null;
  } catch (e) {
    console.warn("[schedule-config] load failed:", e?.code || e?.message);
    return null;
  }
}

/**
 * Save the time slots configuration to Firestore.
 */
export async function saveTimeSlots(slots) {
  if (!Array.isArray(slots)) throw new Error("Slots must be an array.");

  // Sort by orderIndex before saving
  const sorted = [...slots].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

  await setDoc(CONFIG_DOC, {
    slots: sorted,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return sorted;
}

/**
 * Apply a template — loads defaults and saves to Firestore.
 */
export async function applyTemplate(templateKey) {
  const template = TIME_SLOT_TEMPLATES[templateKey];
  if (!template) throw new Error(`Unknown template: ${templateKey}`);
  return await saveTimeSlots(template);
}

/**
 * If Firestore has no time slots, initialize from MATATAG default.
 * Called once on first run.
 */
export async function ensureTimeSlotsExist() {
  const existing = await loadTimeSlots();
  if (existing) return existing;

  console.info("[schedule-config] No slots found — initializing with MATATAG default.");
  return await applyTemplate("MATATAG");
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Format a time string "07:45" → "7:45 AM"
 */
export function formatTime(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Calculate duration in minutes between two "HH:MM" strings.
 */
export function durationMinutes(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

/**
 * Format duration in minutes → "1 hr 0 min"
 */
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const parts = [];
  if (h > 0) parts.push(`${h} hr${h === 1 ? "" : "s"}`);
  if (m > 0) parts.push(`${m} min`);
  return parts.join(" ") || "0 min";
}

/**
 * Human-readable label for slot type
 */
export function slotTypeLabel(type) {
  const labels = {
    ceremony: "🇵🇭 Ceremony",
    class:    "📚 Class",
    break:    "🍎 Break",
    homeroom: "🏠 Homeroom",
    aral:     "📖 ARAL Program",
  };
  return labels[type] || type;
}

/**
 * CSS class for slot type (used for row colors)
 */
export function slotTypeClass(type) {
  const classes = {
    ceremony: "slot-ceremony",
    class:    "slot-class",
    break:    "slot-break",
    homeroom: "slot-homeroom",
    aral:     "slot-aral",
  };
  return classes[type] || "slot-default";
}

/**
 * Detect slot type from label (helps when migrating existing slots)
 */
export function detectSlotType(label) {
  const l = (label || "").toLowerCase();
  if (l.includes("flag") || l.includes("ceremony")) return "ceremony";
  if (l.includes("break") || l.includes("lunch") || l.includes("recess")) return "break";
  if (l.includes("homeroom")) return "homeroom";
  if (l.includes("aral")) return "aral";
  return "class";
}