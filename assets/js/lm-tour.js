// ============================================================
// LEARNER MODULE TOUR — 5-step walkthrough for the LM modal
// ============================================================
import { runModalTour, hasSeenTour, markTourSeen } from "./modal-tour.js";

const LM_STEPS = [
  {
    target: "#lmPreviewHost",
    title: "📘 Your Learner Module",
    body: "This is what students will see on paper or on their phones. " +
          "It's a student-friendly version of your lesson plan — for home learning " +
          "during class suspension.",
    position: "bottom"
  },
  {
    target: "#lmEditModule",
    title: "✏️ Edit Module",
    body: "Change any text, hide sections you don't need, or customize school details. " +
          "Your edits are saved with the lesson, not in this browser.",
    position: "top"
  },
  {
    target: "#lmUseAI",
    title: "✨ Enhance with AI",
    body: "Let AI rewrite the lesson in simpler, warmer language for students. " +
          "Uses only the content from your lesson plan — no external text is copied.",
    position: "top"
  },
  {
    target: "#lmToggleShare",
    title: "🔗 Share with learners",
    body: "Enable sharing to generate a public link and QR code. " +
          "Students can scan the QR to open the module on their phone — " +
          "perfect for home-based learning.",
    position: "bottom"
  },
  {
    target: "#lmPrint",
    title: "🖨 Print or download",
    body: "Print or save as PDF for distribution. Formatted for A4 portrait, " +
          "ready to hand out or send home.",
    position: "top"
  }
];

export function shouldRunLMTour() {
  return !hasSeenTour("lm");
}

export function runLMTour(onFinish) {
  runModalTour(LM_STEPS, { tourKey: "lm", onFinish });
}

export function resetLMTour() {
  try { localStorage.removeItem("scphs-tour-lm"); } catch {}
}