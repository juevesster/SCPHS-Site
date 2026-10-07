// ============================================================
// schedule-presets.js
// Auto-apply time slot presets when importing a class program
// ============================================================

(function () {
  "use strict";

  /**
   * Ensure the given slot preset exists in the school's time slots.
   * - If all slots already exist (by ID) → no-op, returns { added: 0, skipped: N }
   * - If some are missing → adds them, returns { added: N, skipped: M }
   *
   * @param {string} presetName - e.g. "ks3", "ks4", "kinder"
   * @param {Array} currentSlots - current time slots array from schedule-config
   * @param {Function} saveFn - function to persist updated slots (optional; if absent, no save)
   */
  async function ensurePreset(presetName, currentSlots, saveFn) {
    const preset = window.ProgramTemplates?.getSlotPreset(presetName);
    if (!preset) return { added: 0, skipped: 0, error: "Unknown preset" };

    const existingIds = new Set((currentSlots || []).map(s => s.id));
    const toAdd = preset.filter(s => !existingIds.has(s.id));

    if (!toAdd.length) {
      return { added: 0, skipped: preset.length };
    }

    const updated = [...(currentSlots || []), ...toAdd];

    if (saveFn) {
      await saveFn(updated);
    }

    return { added: toAdd.length, skipped: preset.length - toAdd.length };
  }

  /**
   * Quick check: how many slots from the preset are missing?
   */
  function missingCount(presetName, currentSlots) {
    const preset = window.ProgramTemplates?.getSlotPreset(presetName);
    if (!preset) return 0;
    const existingIds = new Set((currentSlots || []).map(s => s.id));
    return preset.filter(s => !existingIds.has(s.id)).length;
  }

  window.SchedulePresets = {
    ensurePreset,
    missingCount,
  };

})();