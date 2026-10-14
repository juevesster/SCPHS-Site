// ============================================================
// LAS TOUR — 5-step walkthrough for the Learning Activity Sheet modal
// ============================================================
import { runModalTour, hasSeenTour, markTourSeen } from "./modal-tour.js";

const LAS_STEPS = [
  {
    target: "#lasPreviewHost",
    title: "📝 This is your Activity Sheet",
    body: "This preview shows what the sheet will look like when printed or shared. " +
          "It's aligned to the BoW competency you selected in the lesson.",
    position: "bottom"
  },
  {
    target: "#lasUseAI",
    title: "✨ Enhance with AI",
    body: "Click this to generate ORIGINAL content — activity title, objective, " +
          "materials, instructions, and analysis questions. The AI writes it; " +
          "you review and edit. <strong>Nothing is copied from any DepEd LAS.</strong>",
    position: "top"
  },
  {
    target: "#lasStatus",
    title: "💾 Auto-save",
    body: "Your work saves automatically after each enhancement. " +
          "You can close the modal and come back — your content is safe.",
    position: "top"
  },
  {
    target: "#lasToggleShare",
    title: "🔗 Sharing is optional",
    body: "When you're ready to share with students, click here to generate a " +
          "public link and QR code. Sharing is <strong>not required</strong> — " +
          "you can enhance and keep the sheet private.",
    position: "bottom"
  },
  {
    target: "#lasPrint",
    title: "🖨 Print or download",
    body: "Print the sheet or save as PDF any time. Formatted for A4 portrait — " +
          "ready for classroom handouts or home learning packets.",
    position: "top"
  }
];

export function shouldRunLASTour() {
  return !hasSeenTour("las");
}

export function runLASTour(onFinish) {
  runModalTour(LAS_STEPS, { tourKey: "las", onFinish });
}

export function resetLASTour() {
  markTourSeen("las"); // no-op marker
  try { localStorage.removeItem("scphs-tour-las"); } catch {}
}