// ============================================================
// MODAL TOUR — coach-mark style guided tour for modal contents
// Usage:
//   import { runModalTour } from "./assets/js/modal-tour.js";
//   runModalTour([
//     { target: "#elementId", title: "...", body: "...", position: "bottom" },
//     ...
//   ], { tourKey: "las" });
// ============================================================

const STORAGE_PREFIX = "scphs-tour-";

// ------------------------------------------------------------
// Check if a tour has been seen
// ------------------------------------------------------------
export function hasSeenTour(tourKey) {
  try {
    return localStorage.getItem(STORAGE_PREFIX + tourKey) === "seen";
  } catch {
    return false;
  }
}

export function markTourSeen(tourKey) {
  try {
    localStorage.setItem(STORAGE_PREFIX + tourKey, "seen");
  } catch {}
}

export function resetTour(tourKey) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + tourKey);
  } catch {}
}

// ------------------------------------------------------------
// Run the tour
// ------------------------------------------------------------
export function runModalTour(steps, opts = {}) {
  if (!Array.isArray(steps) || !steps.length) return;

  const tourKey = opts.tourKey || "modal";
  const onFinish = opts.onFinish || (() => {});

  // Remove any existing tour
  document.querySelectorAll(".modal-tour-overlay, .modal-tour-popover, .modal-tour-spotlight")
    .forEach(el => el.remove());

  let currentStep = 0;

  // ----- Overlay -----
  const overlay = document.createElement("div");
  overlay.className = "modal-tour-overlay";
  overlay.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(15,23,42,.55);
    z-index: 99998;
    transition: opacity .2s;
    pointer-events: none;
  `;
  document.body.appendChild(overlay);

  // ----- Popover -----
  const popover = document.createElement("div");
  popover.className = "modal-tour-popover";
  popover.style.cssText = `
    position: fixed;
    z-index: 100000;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0,0,0,.28), 0 0 0 3px #4f46e5;
    padding: 18px 20px 14px;
    max-width: 340px;
    min-width: 280px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    transition: top .2s, left .2s;
  `;
  document.body.appendChild(popover);

  // ----- Step rendering -----
  function renderStep() {
    const step = steps[currentStep];
    const target = document.querySelector(step.target);

    // Clean up previous spotlight
    document.querySelectorAll(".modal-tour-spotlight").forEach(el => el.remove());

    if (target) {
      // Scroll into view within its container
      try { target.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {}

      // Create spotlight over the target
      const spot = document.createElement("div");
      spot.className = "modal-tour-spotlight";

      // Wait one frame so scrollIntoView settles
      requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        const pad = 6;
        spot.style.cssText = `
          position: fixed;
          top: ${rect.top - pad}px;
          left: ${rect.left - pad}px;
          width: ${rect.width + pad * 2}px;
          height: ${rect.height + pad * 2}px;
          border-radius: 10px;
          box-shadow: 0 0 0 9999px rgba(15,23,42,.55), 0 0 0 3px #4f46e5;
          z-index: 99999;
          pointer-events: none;
          transition: all .2s;
        `;
        document.body.appendChild(spot);

        // Position the popover relative to target
        positionPopover(rect, step.position || "bottom");
      });
    } else {
      // Target not found — center the popover
      positionPopover(null, "center");
    }

    // Popover content
    popover.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:10px;font-weight:800;color:#4f46e5;text-transform:uppercase;letter-spacing:.06em;">
          Step ${currentStep + 1} of ${steps.length}
        </span>
        <button class="modal-tour-skip" style="background:none;border:none;cursor:pointer;font-size:11px;color:#6b7280;font-family:inherit;">Skip</button>
      </div>
      <div style="font-size:14px;font-weight:800;color:#0f2b4f;margin-bottom:6px;">
        ${escapeHTML(step.title || "")}
      </div>
      <div style="font-size:13px;color:#374151;line-height:1.55;margin-bottom:14px;">
        ${step.body || ""}
      </div>
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
        <label style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#6b7280;cursor:pointer;">
          <input type="checkbox" class="modal-tour-dontshow" style="margin:0;" />
          Don't show again
        </label>
        <div style="display:flex;gap:6px;">
          ${currentStep > 0 ? `<button class="modal-tour-prev" style="padding:7px 14px;border:1px solid #e5e7eb;background:#fff;border-radius:7px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;color:#374151;">← Back</button>` : ""}
          <button class="modal-tour-next" style="padding:7px 16px;border:none;background:#4f46e5;color:#fff;border-radius:7px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;">
            ${currentStep === steps.length - 1 ? "Got it ✓" : "Next →"}
          </button>
        </div>
      </div>
    `;

    // Wire popover buttons
    popover.querySelector(".modal-tour-skip")?.addEventListener("click", finish);
    popover.querySelector(".modal-tour-prev")?.addEventListener("click", () => {
      currentStep--;
      renderStep();
    });
    popover.querySelector(".modal-tour-next")?.addEventListener("click", () => {
      if (currentStep === steps.length - 1) finish();
      else { currentStep++; renderStep(); }
    });
  }

  // ----- Position the popover relative to a target rect -----
  function positionPopover(rect, pos) {
    const margin = 12;
    const pw = popover.offsetWidth || 320;
    const ph = popover.offsetHeight || 200;

    if (!rect || pos === "center") {
      popover.style.top = `${(window.innerHeight - ph) / 2}px`;
      popover.style.left = `${(window.innerWidth - pw) / 2}px`;
      return;
    }

    let top, left;

    if (pos === "bottom") {
      top = rect.bottom + margin;
      left = rect.left + rect.width / 2 - pw / 2;
    } else if (pos === "top") {
      top = rect.top - ph - margin;
      left = rect.left + rect.width / 2 - pw / 2;
    } else if (pos === "right") {
      top = rect.top + rect.height / 2 - ph / 2;
      left = rect.right + margin;
    } else if (pos === "left") {
      top = rect.top + rect.height / 2 - ph / 2;
      left = rect.left - pw - margin;
    } else {
      top = rect.bottom + margin;
      left = rect.left;
    }

    // Keep inside viewport
    left = Math.max(12, Math.min(left, window.innerWidth - pw - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - ph - 12));

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }

  // ----- Finish -----
  function finish() {
    const dontShow = popover.querySelector(".modal-tour-dontshow")?.checked;
    if (dontShow) markTourSeen(tourKey);
    else markTourSeen(tourKey); // always mark as seen so it doesn't repeat

    popover.remove();
    overlay.remove();
    document.querySelectorAll(".modal-tour-spotlight").forEach(el => el.remove());

    onFinish();
  }

  // ----- Keyboard support -----
  function handleKey(e) {
    if (e.key === "Escape") { finish(); }
    else if (e.key === "ArrowRight") {
      if (currentStep < steps.length - 1) { currentStep++; renderStep(); }
    }
    else if (e.key === "ArrowLeft") {
      if (currentStep > 0) { currentStep--; renderStep(); }
    }
  }
  document.addEventListener("keydown", handleKey);

  // ----- Cleanup on finish -----
  const origFinish = finish;
  const newFinish = () => {
    document.removeEventListener("keydown", handleKey);
    origFinish();
  };
  // replace reference
  window.__modalTourFinish = newFinish;

  // ----- Start -----
  renderStep();
}

// ------------------------------------------------------------
// Escape HTML helper
// ------------------------------------------------------------
function escapeHTML(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}