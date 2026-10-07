// ============================================================
// schedule-presets.js — v2 (fixed duplicate-slot bug)
// ============================================================

(function () {
  "use strict";

  /**
   * Ensure a preset exists. NOW MATCHES BY TIME+TYPE, not by ID.
   */
  async function ensurePreset(presetName, currentSlots, saveFn) {
    const preset = window.ProgramTemplates?.getSlotPreset(presetName);
    if (!preset) return { added: 0, skipped: 0, error: "Unknown preset" };

    // Normalize: pad times to HH:MM
    const norm = (t) => String(t || "").padStart(5, "0");

    const existingKey = (s) => `${norm(s.start)}|${norm(s.end)}|${s.type || "class"}`;
    const existingKeys = new Set((currentSlots || []).map(existingKey));

    const toAdd = preset.filter(s => !existingKeys.has(existingKey(s)));

    if (!toAdd.length) {
      return { added: 0, skipped: preset.length };
    }

    const updated = [...(currentSlots || []), ...toAdd];

    if (saveFn) await saveFn(updated);

    return { added: toAdd.length, skipped: preset.length - toAdd.length };
  }

  function missingCount(presetName, currentSlots) {
    const preset = window.ProgramTemplates?.getSlotPreset(presetName);
    if (!preset) return 0;
    const norm = (t) => String(t || "").padStart(5, "0");
    const existingKeys = new Set((currentSlots || []).map(s => `${norm(s.start)}|${norm(s.end)}|${s.type || "class"}`));
    return preset.filter(s => !existingKeys.has(`${norm(s.start)}|${norm(s.end)}|${s.type || "class"}`)).length;
  }

  window.SchedulePresets = { ensurePreset, missingCount };
})();