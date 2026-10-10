// ============================================================
// MODULE EDITOR — V1
// Additive overlay for editing Learner Modules.
// Saves overrides to lessons/{id}.learnerModuleOverrides
// Existing generator (learner-module.js) is UNTOUCHED.
// ============================================================

import { db } from "./firebase-config.js";
import {
  doc, getDoc, updateDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---------- Local helpers ----------
const esc = s => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// ---------- Load existing overrides ----------
export async function loadOverrides(lessonId) {
  if (!lessonId) return {};
  try {
    const snap = await getDoc(doc(db, "lessons", lessonId));
    if (!snap.exists()) return {};
    const data = snap.data();
    return data.learnerModuleOverrides || {};
  } catch (e) {
    console.warn("[module-editor] load failed:", e);
    return {};
  }
}

// ---------- Save overrides ----------
export async function saveOverrides(lessonId, overrides) {
  if (!lessonId) throw new Error("No lesson ID");
  const ref = doc(db, "lessons", lessonId);
  await updateDoc(ref, {
    learnerModuleOverrides: overrides,
    learnerModuleEditedAt: serverTimestamp(),
  });
}

// ---------- Clear all overrides ----------
export async function clearOverrides(lessonId) {
  if (!lessonId) return;
  const ref = doc(db, "lessons", lessonId);
  await updateDoc(ref, {
    learnerModuleOverrides: {},
    learnerModuleEditedAt: serverTimestamp(),
  });
}

// ---------- Open editor modal ----------
export async function openEditorModal(lessonId, currentLesson, onSave) {
  // currentLesson = the object from collectLessonData()
  // Load existing overrides first
  const existing = await loadOverrides(lessonId);
  const state = {
    greeting:     existing.greeting     || null,
    lessonIntro:  existing.lessonIntro  || null,
    materials:    existing.materials    || null,
    howToSubmit:  existing.howToSubmit  || null,
    objectives:   existing.objectives   || null,
    lessonSteps:  existing.lessonSteps  || null,
    activities:   existing.activities   || null,
    selfCheck:    existing.selfCheck    || null,
    hiddenSections: existing.hiddenSections || [],
  };

  // Get template values for placeholders (what shows if not overridden)
  const template = {
    greeting: currentLesson._templateGreeting || "Kumusta! While classes are on hold, let's keep learning. Take your time — this module is for you.",
    lessonIntro: currentLesson.contentStandard || "",
    materials: currentLesson.materials || currentLesson.materialsText || "",
    howToSubmit: "Take a clear photo of your notebook pages. Send to your teacher via Messenger GC or private message.",
    objectives: currentLesson.competencies?.map(c => c.text) || [],
    lessonSteps: (currentLesson.lessonFlow || "").split(/\n+/).filter(Boolean).slice(0, 6),
    activities: [
      { title: "Activity 1 — Look Around You", duration: "10 min", instructions: "Find 3 things at home related to this lesson. Draw or describe them." },
      { title: "Activity 2 — Try It Yourself", duration: "15 min", instructions: "Do a simple hands-on practice. Write what you did and noticed." },
      { title: "Activity 3 — Share & Reflect", duration: "5 min", instructions: "Share what you learned with a family member. Write their reaction." },
    ],
    selfCheck: [],
  };

  // Remove existing modal if present
  const existingModal = document.getElementById("lmEditorModal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "lmEditorModal";
  modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:10001;padding:20px;";

  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;max-width:800px;width:100%;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 24px 48px rgba(0,0,0,.3);">
      <!-- Header -->
      <div style="padding:18px 22px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
        <div>
          <h3 style="margin:0;font-size:1.1rem;color:#0f2b4f;">✏️ Edit Learner Module</h3>
          <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Customize the module for this lesson. Changes are saved to the lesson.</p>
        </div>
        <button class="btn btn-outline small" id="lmeClose">✕</button>
      </div>

      <!-- Body -->
      <div style="flex:1;overflow-y:auto;padding:20px 22px;background:#f9fafb;" id="lmeBody">
        ${renderEditorSections(state, template)}
      </div>

      <!-- Footer -->
      <div style="padding:14px 22px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;gap:10px;background:#fff;flex-wrap:wrap;flex-shrink:0;">
        <button class="btn btn-outline" id="lmeResetAll" style="color:#dc2626;border-color:#dc2626;">🔄 Reset All to Template</button>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline" id="lmeCancel">Cancel</button>
          <button class="btn btn-success" id="lmeSave">💾 Save Changes</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // ---------- Wire close ----------
  const closeModal = () => modal.remove();
  document.getElementById("lmeClose").addEventListener("click", closeModal);
  document.getElementById("lmeCancel").addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

  // ---------- Wire save ----------
  document.getElementById("lmeSave").addEventListener("click", async () => {
    const btn = document.getElementById("lmeSave");
    btn.disabled = true;
    btn.textContent = "Saving…";

    // Collect overrides from form
    const newOverrides = collectOverridesFromForm(state, template);

    try {
      await saveOverrides(lessonId, newOverrides);
      if (typeof onSave === "function") onSave(newOverrides);
      closeModal();
      if (typeof window.__ilawToast === "function") {
        window.__ilawToast("✓ Module saved", "success");
      }
    } catch (e) {
      console.error(e);
      if (typeof window.__ilawToast === "function") {
        window.__ilawToast("⚠️ Save failed: " + e.message, "error");
      }
      btn.disabled = false;
      btn.textContent = "💾 Save Changes";
    }
  });

  // ---------- Wire reset all ----------
  document.getElementById("lmeResetAll").addEventListener("click", async () => {
    if (!confirm("Reset all edits back to the template? This cannot be undone.")) return;
    try {
      await clearOverrides(lessonId);
      if (typeof onSave === "function") onSave({});
      closeModal();
      if (typeof window.__ilawToast === "function") {
        window.__ilawToast("✓ Reset to template", "success");
      }
    } catch (e) {
      console.error(e);
      if (typeof window.__ilawToast === "function") {
        window.__ilawToast("⚠️ Reset failed: " + e.message, "error");
      }
    }
  });

  // ---------- Wire dynamic add/remove buttons ----------
  wireEditorDynamic(modal, state, template);
}

// ============================================================
// RENDER EDITOR SECTIONS
// ============================================================
function renderEditorSections(state, template) {
  return `
    <!-- GREETING -->
    <div class="lme-section" data-section="greeting">
      <div class="lme-section-head">
        <div class="lme-section-title">👋 Hello, Learner!</div>
        <label class="lme-toggle">
          <input type="checkbox" data-lme-show="greeting" ${state.hiddenSections.includes("greeting") ? "" : "checked"} />
          Show this section
        </label>
      </div>
      <textarea class="lme-textarea" data-lme-text="greeting" rows="3"
                placeholder="${esc(template.greeting)}">${esc(state.greeting || "")}</textarea>
      <div class="lme-hint">Leave blank to use template.</div>
    </div>

    <!-- LESSON INTRO -->
    <div class="lme-section" data-section="lessonIntro">
      <div class="lme-section-head">
        <div class="lme-section-title">📖 What This Lesson Is About</div>
        <label class="lme-toggle">
          <input type="checkbox" data-lme-show="lessonIntro" ${state.hiddenSections.includes("lessonIntro") ? "" : "checked"} />
          Show this section
        </label>
      </div>
      <textarea class="lme-textarea" data-lme-text="lessonIntro" rows="4"
                placeholder="${esc(template.lessonIntro)}">${esc(state.lessonIntro || "")}</textarea>
      <div class="lme-hint">Leave blank to use template.</div>
    </div>

    <!-- OBJECTIVES -->
    <div class="lme-section" data-section="objectives">
      <div class="lme-section-head">
        <div class="lme-section-title">🎯 What You Will Learn</div>
        <label class="lme-toggle">
          <input type="checkbox" data-lme-show="objectives" ${state.hiddenSections.includes("objectives") ? "" : "checked"} />
          Show this section
        </label>
      </div>
      <div class="lme-list" data-lme-list="objectives">
        ${renderListItems("objectives", state.objectives || template.objectives, "objective")}
      </div>
      <button class="lme-add-btn" data-lme-add="objectives" type="button">➕ Add Objective</button>
    </div>

    <!-- LESSON STEPS -->
    <div class="lme-section" data-section="lessonSteps">
      <div class="lme-section-head">
        <div class="lme-section-title">📚 The Lesson</div>
        <label class="lme-toggle">
          <input type="checkbox" data-lme-show="lessonSteps" ${state.hiddenSections.includes("lessonSteps") ? "" : "checked"} />
          Show this section
        </label>
      </div>
      <div class="lme-list" data-lme-list="lessonSteps">
        ${renderListItems("lessonSteps", state.lessonSteps || template.lessonSteps, "step")}
      </div>
      <button class="lme-add-btn" data-lme-add="lessonSteps" type="button">➕ Add Step</button>
    </div>

    <!-- MATERIALS -->
    <div class="lme-section" data-section="materials">
      <div class="lme-section-head">
        <div class="lme-section-title">🧰 Materials / Things You Can Use</div>
        <label class="lme-toggle">
          <input type="checkbox" data-lme-show="materials" ${state.hiddenSections.includes("materials") ? "" : "checked"} />
          Show this section
        </label>
      </div>
      <textarea class="lme-textarea" data-lme-text="materials" rows="3"
                placeholder="${esc(template.materials)}">${esc(state.materials || "")}</textarea>
      <div class="lme-hint">Leave blank to use template.</div>
    </div>

    <!-- ACTIVITIES -->
    <div class="lme-section" data-section="activities">
      <div class="lme-section-head">
        <div class="lme-section-title">✏️ Activities</div>
        <label class="lme-toggle">
          <input type="checkbox" data-lme-show="activities" ${state.hiddenSections.includes("activities") ? "" : "checked"} />
          Show this section
        </label>
      </div>
      <div class="lme-list" data-lme-list="activities">
        ${renderActivityItems(state.activities || template.activities)}
      </div>
      <button class="lme-add-btn" data-lme-add="activities" type="button">➕ Add Activity</button>
    </div>

    <!-- HOW TO SUBMIT -->
    <div class="lme-section" data-section="howToSubmit">
      <div class="lme-section-head">
        <div class="lme-section-title">📱 How to Submit Your Work</div>
        <label class="lme-toggle">
          <input type="checkbox" data-lme-show="howToSubmit" ${state.hiddenSections.includes("howToSubmit") ? "" : "checked"} />
          Show this section
        </label>
      </div>
      <textarea class="lme-textarea" data-lme-text="howToSubmit" rows="4"
                placeholder="${esc(template.howToSubmit)}">${esc(state.howToSubmit || "")}</textarea>
      <div class="lme-hint">Leave blank to use template.</div>
    </div>

    <style>
      .lme-section {
        background:#fff;border:1px solid #e5e7eb;border-radius:10px;
        padding:14px 16px;margin-bottom:14px;
      }
      .lme-section-head {
        display:flex;justify-content:space-between;align-items:center;
        gap:10px;margin-bottom:10px;flex-wrap:wrap;
      }
      .lme-section-title {
        font-size:13px;font-weight:800;color:#0f2b4f;
        text-transform:uppercase;letter-spacing:.04em;
      }
      .lme-toggle {
        font-size:11.5px;color:#6b7280;display:flex;align-items:center;gap:6px;
        cursor:pointer;user-select:none;
      }
      .lme-textarea {
        width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;
        font-size:13px;font-family:inherit;resize:vertical;line-height:1.55;
        background:#f9fafb;
      }
      .lme-textarea:focus {
        outline:none;border-color:#1e6bb8;background:#fff;
        box-shadow:0 0 0 3px rgba(30,107,184,.12);
      }
      .lme-hint {
        font-size:11px;color:#9ca3af;margin-top:6px;font-style:italic;
      }
      .lme-list {
        display:flex;flex-direction:column;gap:6px;margin-bottom:10px;
      }
      .lme-item {
        display:flex;gap:6px;align-items:flex-start;
      }
      .lme-item input, .lme-item textarea {
        flex:1;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;
        font-size:13px;font-family:inherit;background:#f9fafb;
      }
      .lme-item textarea { resize:vertical;min-height:34px;line-height:1.5; }
      .lme-item input:focus, .lme-item textarea:focus {
        outline:none;border-color:#1e6bb8;background:#fff;
      }
      .lme-item-del {
        flex-shrink:0;padding:8px 10px;border:1px solid #fee2e2;
        background:#fff;color:#dc2626;border-radius:6px;cursor:pointer;
        font-family:inherit;font-size:12px;
      }
      .lme-item-del:hover { background:#fee2e2; }
      .lme-add-btn {
        padding:8px 14px;border:1px dashed #cbd5e1;background:#fff;
        color:#374151;border-radius:6px;cursor:pointer;font-family:inherit;
        font-size:12px;font-weight:700;
      }
      .lme-add-btn:hover { border-color:#1e6bb8;color:#1e6bb8;background:#eff6ff; }
      .lme-activity-card {
        display:flex;flex-direction:column;gap:6px;padding:10px;
        border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;
        position:relative;
      }
      .lme-activity-card .lme-item-del {
        position:absolute;top:6px;right:6px;
      }
      .lme-activity-card label {
        font-size:10.5px;font-weight:700;color:#6b7280;
        text-transform:uppercase;letter-spacing:.04em;
      }
    </style>
  `;
}

// ============================================================
// RENDER LIST ITEMS (simple strings)
// ============================================================
function renderListItems(name, items, placeholder) {
  return items.map((item, i) => `
    <div class="lme-item">
      <input type="text" data-lme-item="${name}" data-lme-index="${i}"
             value="${esc(item)}" placeholder="${esc(placeholder + " " + (i + 1))}" />
      <button class="lme-item-del" data-lme-del="${name}" data-lme-index="${i}" type="button">🗑️</button>
    </div>
  `).join("");
}

// ============================================================
// RENDER ACTIVITY CARDS (title, duration, instructions)
// ============================================================
function renderActivityItems(activities) {
  return activities.map((a, i) => `
    <div class="lme-activity-card" data-lme-activity="${i}">
      <button class="lme-item-del" data-lme-del-activity="${i}" type="button">🗑️</button>
      <label>Activity ${i + 1} Title</label>
      <input type="text" data-lme-act-title="${i}" value="${esc(a.title || "")}" placeholder="Activity title" />
      <label>Duration</label>
      <input type="text" data-lme-act-duration="${i}" value="${esc(a.duration || "")}" placeholder="e.g., 10 min" />
      <label>Instructions</label>
      <textarea rows="2" data-lme-act-instructions="${i}" placeholder="What should the learner do?">${esc(a.instructions || "")}</textarea>
    </div>
  `).join("");
}

// ============================================================
// WIRE DYNAMIC ADD/REMOVE
// ============================================================
function wireEditorDynamic(modal, state, template) {
  // Add buttons
  modal.querySelectorAll("[data-lme-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.lmeAdd;
      const list = modal.querySelector(`[data-lme-list="${name}"]`);
      if (!list) return;
      if (name === "activities") {
        const i = list.querySelectorAll("[data-lme-activity]").length;
        list.insertAdjacentHTML("beforeend", renderActivityItems([{ title: "", duration: "10 min", instructions: "" }]));
        // Fix index for the new card
        const lastCard = list.querySelector(`[data-lme-activity]:last-child`);
        if (lastCard) {
          lastCard.dataset.lmeActivity = String(i);
          lastCard.querySelector("[data-lme-del-activity]").dataset.lmeDelActivity = String(i);
          lastCard.querySelector("[data-lme-act-title]").dataset.lmeActTitle = String(i);
          lastCard.querySelector("[data-lme-act-duration]").dataset.lmeActDuration = String(i);
          lastCard.querySelector("[data-lme-act-instructions]").dataset.lmeActInstructions = String(i);
        }
      } else {
        const i = list.querySelectorAll(`[data-lme-item="${name}"]`).length;
        list.insertAdjacentHTML("beforeend", `
          <div class="lme-item">
            <input type="text" data-lme-item="${name}" data-lme-index="${i}" value="" placeholder="New item" />
            <button class="lme-item-del" data-lme-del="${name}" data-lme-index="${i}" type="button">🗑️</button>
          </div>
        `);
      }
      wireDeleteButtons(modal);
    });
  });

  wireDeleteButtons(modal);
}

function wireDeleteButtons(modal) {
  modal.querySelectorAll("[data-lme-del]").forEach(btn => {
    btn.onclick = () => {
      const parent = btn.closest(".lme-item");
      if (parent) parent.remove();
    };
  });
  modal.querySelectorAll("[data-lme-del-activity]").forEach(btn => {
    btn.onclick = () => {
      const parent = btn.closest(".lme-activity-card");
      if (parent) parent.remove();
    };
  });
}

// ============================================================
// COLLECT OVERRIDES FROM FORM
// ============================================================
function collectOverridesFromForm(state, template) {
  const result = {};

  // Text fields
  ["greeting", "lessonIntro", "materials", "howToSubmit"].forEach(name => {
    const el = document.querySelector(`[data-lme-text="${name}"]`);
    if (!el) return;
    const val = el.value.trim();
    if (val) result[name] = val;
  });

  // List fields
  ["objectives", "lessonSteps"].forEach(name => {
    const items = Array.from(document.querySelectorAll(`[data-lme-item="${name}"]`))
      .map(el => el.value.trim())
      .filter(Boolean);
    if (items.length) result[name] = items;
  });

  // Activities
  const activityCards = Array.from(document.querySelectorAll("[data-lme-activity]"));
  const activities = activityCards.map(card => {
    const idx = card.dataset.lmeActivity;
    return {
      title:        card.querySelector(`[data-lme-act-title="${idx}"]`)?.value.trim() || "",
      duration:     card.querySelector(`[data-lme-act-duration="${idx}"]`)?.value.trim() || "10 min",
      instructions: card.querySelector(`[data-lme-act-instructions="${idx}"]`)?.value.trim() || "",
    };
  }).filter(a => a.title || a.instructions);
  if (activities.length) result.activities = activities;

  // Hidden sections
  const hidden = [];
  document.querySelectorAll("[data-lme-show]").forEach(cb => {
    if (!cb.checked) hidden.push(cb.dataset.lmeShow);
  });
  if (hidden.length) result.hiddenSections = hidden;

  return result;
}