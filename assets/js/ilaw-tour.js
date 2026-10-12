// ============================================================
// ILAW GUIDED TOUR — V1
// Uses Driver.js to highlight each step with arrows.
// Auto-shows on first visit; remembers completion.
// ============================================================

import { auth, db } from "./firebase-config.js";
import { doc, getDoc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const TOUR_KEY = "ilaw-tour-completed-v1";

// ---------- Check if tour should run ----------
export function shouldRunTour() {
  const localDone = localStorage.getItem(TOUR_KEY) === "1";
  if (localDone) return false;
  return true;
}

// ---------- Mark tour as done (local + Firestore) ----------
export async function markTourCompleted() {
  localStorage.setItem(TOUR_KEY, "1");
  try {
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "users", user.uid), {
        ilawTourCompletedAt: serverTimestamp(),
      }, { merge: true });
    }
  } catch (e) {
    console.warn("[ilaw-tour] Firestore sync failed:", e);
  }
}

// ---------- Reset tour (for "Replay" button) ----------
export function resetTour() {
  localStorage.removeItem(TOUR_KEY);
}

// ---------- Driver.js loader (CDN auto) ----------
async function ensureDriverLoaded() {
  if (window.driver && window.driver.js) return;
  if (document.getElementById("driver-js-cdn")) return;

  // CSS
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.css";
  document.head.appendChild(css);

  // JS
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "driver-js-cdn";
    script.src = "https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.js.iife.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load Driver.js"));
    document.head.appendChild(script);
  });
}

// ---------- Tour steps ----------
function buildTourSteps() {
  return [
    {
      element: "#pickGrade",
      popover: {
        title: "👋 Step 1 of 9 — Grade Level",
        description: "First, choose the <strong>Grade Level</strong> you teach. Click this dropdown to see all grades from Kindergarten to Grade 12.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "#pickSubject",
      popover: {
        title: "📘 Step 2 of 9 — Subject",
        description: "Now pick the <strong>Subject</strong> for this lesson. Only subjects for the selected grade appear here.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "#pickTerm",
      popover: {
        title: "📅 Step 3 of 9 — Term & Week",
        description: "Select the <strong>Term</strong> and <strong>Week</strong> for this lesson. Default is Term 1, Week 1.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "#btnLoadContext",
      popover: {
        title: "📖 Step 4 of 9 — Load BoW",
        description: "Click <strong>Load BoW</strong> to fetch the competencies from the Budget of Work. This fills in Content Standard, Performance Standard, and Competencies.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#compPicker",
      popover: {
        title: "✅ Step 5 of 9 — Pick Competencies",
        description: "Check the <strong>competencies</strong> you want to cover in this lesson. They'll be saved with your lesson plan.",
        side: "top",
        align: "start",
      },
      onNext: () => {
        // Only run if element exists
        return !!document.querySelector("#compPicker");
      },
    },
    {
      element: "#f-lessonTitle",
      popover: {
        title: "✏️ Step 6 of 9 — Lesson Title",
        description: "Add a <strong>Lesson Title</strong>, number of sessions, and teacher name. These appear on the printed lesson plan.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#btnSaveDraft",
      popover: {
        title: "💾 Step 7 of 9 — Save as Draft",
        description: "Click <strong>Save as Draft</strong> to store your lesson plan. You can edit it later.",
        side: "top",
        align: "start",
      },
    },
    {
      element: "#btnMaterialsPack",
      popover: {
        title: "📚 Step 8 of 9 — Materials Pack",
        description: "Click <strong>Materials Pack</strong> to auto-generate lecture notes, activities, slides, and a quiz for this lesson. Opens in a new tab.",
        side: "top",
        align: "start",
      },
    },
    {
      element: "#btnLearnerModule",
      popover: {
        title: "📘 Step 9 of 9 — Learner Module",
        description: "Click <strong>Generate Learner Module</strong> to create a student-friendly version. Then share it with students via QR code or Messenger.",
        side: "top",
        align: "start",
      },
    },
  ];
}

// ---------- Start tour ----------
export async function runTour(options = {}) {
  await ensureDriverLoaded();

  const driverFactory = window.driver.js.driver;
  const allSteps = buildTourSteps();

  // Optional: start at a specific step
  const startAt = options.startAtIndex || 0;
  const steps = allSteps.slice(startAt);

  const driverObj = driverFactory({
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    progressText: "{{current}} of {{total}}",
    nextBtnText: "Next →",
    prevBtnText: "← Prev",
    doneBtnText: "Finish 🎉",
    allowClose: true,
    overlayOpacity: 0.6,
    stagePadding: 8,
    stageRadius: 10,
    popoverClass: "ilaw-tour-popover",
    onDestroyStarted: () => {
      driverObj.destroy();
      markTourCompleted();
    },
    onDestroyed: () => {
      markTourCompleted();
    },
    steps: steps,
  });

  driverObj.drive();
}

// ---------- Replay button (idempotent) ----------
export function initReplayButton() {
  const btn = document.getElementById("btnReplayTour");
  if (!btn || btn._wired) return;
  btn.addEventListener("click", () => {
    resetTour();
    runTour();
  });
  btn._wired = true;
}