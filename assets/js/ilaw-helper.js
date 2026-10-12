// ============================================================
// ILAW HELPER CHATBOT — V1
// Menu-driven step-by-step help. No AI needed.
// Includes "Show me where" buttons that trigger the tour.
// ============================================================

import { runTour } from "./ilaw-tour.js";

const HELP_TOPICS = {
  "make-lesson": {
    icon: "📝",
    title: "How do I make a lesson plan?",
    steps: [
      "1️⃣ Choose your <strong>Grade Level</strong> from the top dropdown",
      "2️⃣ Pick the <strong>Subject</strong> — only subjects for that grade appear",
      "3️⃣ Select <strong>Term</strong> and <strong>Week</strong>",
      "4️⃣ Click <strong>📖 Load BoW</strong> to fetch competencies",
      "5️⃣ Check the competencies you want to cover",
      "6️⃣ Or click <strong>🤖 Generate with AI</strong> to auto-draft",
      "7️⃣ Add a <strong>Lesson Title</strong> and other details",
      "8️⃣ Click <strong>💾 Save as Draft</strong> to save",
    ],
    tourStep: 0, // Tour start index (Grade Level)
  },
  "generate-materials": {
    icon: "📚",
    title: "How do I generate teaching materials?",
    steps: [
      "1️⃣ <strong>Save your lesson first</strong> (Save as Draft)",
      "2️⃣ Click the <strong>📚 Materials Pack</strong> button (purple)",
      "3️⃣ A new tab opens with 4 material cards",
      "4️⃣ Click <strong>✨ Generate</strong> on any card:",
      "   📖 Lecture Notes · 🎯 Activities · 📊 Slides · ❓ Quiz",
      "5️⃣ Wait 10-30 seconds per material",
      "6️⃣ Or click <strong>✨ Generate All Materials</strong> for all 4",
      "7️⃣ Edit anything with <strong>✏️ Edit</strong>",
      "8️⃣ Click <strong>📥 Download Complete Pack (PDF)</strong>",
    ],
    tourStep: 7, // Materials Pack button
  },
  "learner-module": {
    icon: "📘",
    title: "How do I create a Learner Module?",
    steps: [
      "1️⃣ Save your lesson first",
      "2️⃣ Click <strong>📘 Generate Learner Module</strong>",
      "3️⃣ Preview appears — a student-friendly version",
      "4️⃣ Click <strong>✏️ Edit Module</strong> to customize:",
      "   • Change the greeting",
      "   • Edit activities",
      "   • Adjust school name (for guest teachers)",
      "5️⃣ Click <strong>🖨 Print</strong> or <strong>📥 Download as PDF</strong>",
      "6️⃣ Click <strong>🔗 Enable Sharing</strong> to get a QR code",
    ],
    tourStep: 8, // Learner Module button
  },
  "share-students": {
    icon: "🔗",
    title: "How do I share with students?",
    steps: [
      "<strong>Method 1 — QR Code:</strong>",
      "1️⃣ Generate your Learner Module",
      "2️⃣ Click <strong>🔗 Enable Sharing</strong>",
      "3️⃣ Click <strong>📱 QR Code</strong> to display",
      "4️⃣ Print the QR or show on screen",
      "5️⃣ Students scan → module opens on their phone",
      "",
      "<strong>Method 2 — Messenger:</strong>",
      "1️⃣ Same as above",
      "2️⃣ Click <strong>💬 Send to Messenger</strong>",
      "3️⃣ Pick the chat/group and send",
    ],
  },
  "save-print": {
    icon: "💾",
    title: "How do I save or print?",
    steps: [
      "<strong>Save options:</strong>",
      "• <strong>💾 Save as Draft</strong> — keeps it editable",
      "• <strong>✅ Mark as Final</strong> — marks it complete",
      "",
      "<strong>Print / PDF:</strong>",
      "• <strong>🖨️ Print</strong> — opens print dialog",
      "• <strong>📥 Download PDF</strong> — same, choose 'Save as PDF'",
      "",
      "<strong>Materials Pack:</strong>",
      "• <strong>📥 Download Complete Pack</strong> — all 4 materials in one PDF",
    ],
  },
  "ilaw-format": {
    icon: "🎯",
    title: "What is ILAW format?",
    steps: [
      "<strong>I — Intentions</strong>",
      "• Learning competencies, Content Standard, Performance Standard, Learner Context",
      "",
      "<strong>L — Learning Experience</strong>",
      "• Pre-Lesson, Lesson Flow, Materials, Integration Opportunities",
      "",
      "<strong>A — Assessment</strong>",
      "• How you'll check student learning",
      "",
      "<strong>W — Ways Forward</strong>",
      "• Extended Learning, Reflections, Next Steps (ARAL)",
      "",
      "This is the DepEd-standard lesson plan format.",
    ],
  },

    "edit-header": {
    icon: "🏫",
    title: "How do I edit the school header?",
    steps: [
      "The printed lesson plan and Learner Module show your school name, region, and division.",
      "",
      "<strong>Steps to change it:</strong>",
      "1️⃣ Save your lesson first (<strong>💾 Save as Draft</strong>)",
      "2️⃣ Click <strong>📘 Generate Learner Module</strong>",
      "3️⃣ Click <strong>✏️ Edit Module</strong> (yellow button)",
      "4️⃣ Look for <strong>🏫 School Details</strong> at the top (blue box)",
      "5️⃣ Change Region, Division, School Name, Address",
      "6️⃣ Click <strong>💾 Save Changes</strong>",
      "",
      "<em>This applies to BOTH the Learner Module AND the printed ILAW lesson plan.</em>",
      "<em>SCPHS teachers: defaults are pre-filled.</em>",
      "<em>Guest teachers: change to your own school.</em>",
    ],
    tourStep: 8, // Points to Learner Module button
  },
  
  "edit-header": {
    icon: "🏫",
    title: "How do I edit the school header?",
    steps: [
      "The printed lesson plan and Learner Module show your school name, region, and division.",
      "",
      "1️⃣ Open the <strong>Generate Learner Module</strong> preview",
      "2️⃣ Click <strong>✏️ Edit Module</strong>",
      "3️⃣ Look for <strong>🏫 School Details</strong> at the top",
      "4️⃣ Change Region, Division, School Name, Address",
      "5️⃣ Click <strong>Save Changes</strong>",
      "",
      "The new school info appears on the printed module.",
      "<em>For SCPHS teachers: the SCPHS defaults are pre-filled.</em>",
      "<em>For guest teachers: change these to your own school.</em>",
    ],
  },
};

// ---------- Build chatbot UI ----------
function buildHelperUI() {
  const existing = document.getElementById("ilawHelperRoot");
  if (existing) return existing;

  const root = document.createElement("div");
  root.id = "ilawHelperRoot";

  root.innerHTML = `
    <div id="ilawHelperFab" title="Need help? Click here" style="
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
      z-index: 9998;
      transition: all .2s;
      user-select: none;
    ">❓</div>

    <div id="ilawHelperPanel" style="
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: min(380px, 92vw);
      max-height: min(70vh, 620px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 24px 48px rgba(0,0,0,.25);
      border: 1px solid #e5e7eb;
      display: none;
      flex-direction: column;
      z-index: 9999;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    ">
      <div style="
        padding: 16px 20px;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div>
          <div style="font-weight: 800; font-size: 15px;">❓ ILAW Helper</div>
          <div style="font-size: 11.5px; opacity: 0.85; margin-top: 2px;">Step-by-step guides for teachers</div>
        </div>
        <button id="ilawHelperClose" style="
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: #fff;
          width: 30px; height: 30px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        ">✕</button>
      </div>

      <div id="ilawHelperBody" style="
        flex: 1;
        overflow-y: auto;
        padding: 16px 18px;
        background: #f9fafb;
      "></div>
    </div>
  `;

  document.body.appendChild(root);

  // Wire close
  root.querySelector("#ilawHelperClose").addEventListener("click", () => {
    root.querySelector("#ilawHelperPanel").style.display = "none";
  });

  // Wire toggle
  root.querySelector("#ilawHelperFab").addEventListener("click", () => {
    const panel = root.querySelector("#ilawHelperPanel");
    const isOpen = panel.style.display === "flex";
    if (isOpen) {
      panel.style.display = "none";
    } else {
      panel.style.display = "flex";
      renderMenu();
    }
  });

  return root;
}

// ---------- Render menu ----------
function renderMenu() {
  const body = document.querySelector("#ilawHelperBody");
  body.innerHTML = `
    <div style="
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 14px;
      font-size: 13px;
      color: #374151;
      line-height: 1.5;
    ">
      👋 Hi! What do you need help with?
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${Object.entries(HELP_TOPICS).map(([key, t]) => `
        <button data-help-topic="${key}" style="
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: #0f2b4f;
          text-align: left;
          transition: all .15s;
        ">
          <span style="font-size: 18px;">${t.icon}</span>
          <span>${t.title}</span>
          <span style="margin-left: auto; color: #9ca3af;">→</span>
        </button>
      `).join("")}
      <div style="
        margin-top: 10px;
        padding-top: 12px;
        border-top: 1px solid #e5e7eb;
        font-size: 11.5px;
        color: #6b7280;
        text-align: center;
      ">
        Need more help? Ask your school admin or DM the developer.
      </div>
    </div>
  `;

  body.querySelectorAll("[data-help-topic]").forEach(btn => {
    btn.addEventListener("click", () => renderTopic(btn.dataset.helpTopic));
    btn.addEventListener("mouseover", () => {
      btn.style.background = "#eff6ff";
      btn.style.borderColor = "#bfdbfe";
    });
    btn.addEventListener("mouseout", () => {
      btn.style.background = "#fff";
      btn.style.borderColor = "#e5e7eb";
    });
  });
}

// ---------- Render a specific topic ----------
function renderTopic(key) {
  const topic = HELP_TOPICS[key];
  if (!topic) return;

  const body = document.querySelector("#ilawHelperBody");
  body.innerHTML = `
    <button id="ilawHelperBack" style="
      background: #fff;
      border: 1px solid #e5e7eb;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      color: #4f46e5;
      margin-bottom: 12px;
    ">← Back to menu</button>

    <div style="
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 12px;
    ">
      <div style="font-size: 15px; font-weight: 800; color: #0f2b4f; margin-bottom: 8px;">
        ${topic.icon} ${topic.title}
      </div>
      <div style="font-size: 13px; color: #374151; line-height: 1.7;">
        ${topic.steps.map(s => `<div style="margin-bottom: 4px;">${s}</div>`).join("")}
      </div>
    </div>

    ${typeof topic.tourStep === "number" ? `
      <button id="ilawHelperShowMe" style="
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: #fff;
        border: none;
        border-radius: 10px;
        font-family: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all .15s;
      ">🗺️ Show me where (arrow tour)</button>
    ` : ""}
  `;

  document.querySelector("#ilawHelperBack").addEventListener("click", renderMenu);

  const showMeBtn = document.querySelector("#ilawHelperShowMe");
  if (showMeBtn) {
    showMeBtn.addEventListener("click", () => {
      // Close the panel
      document.querySelector("#ilawHelperPanel").style.display = "none";
      // Start tour at the specific step
      setTimeout(() => {
        runTour({ startAtIndex: topic.tourStep });
      }, 300);
    });
  }
}

// ---------- Init ----------
export function initHelper() {
  buildHelperUI();
}

// Auto-init on module load
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHelper);
  } else {
    initHelper();
  }
}