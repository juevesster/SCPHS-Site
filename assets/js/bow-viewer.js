// ============================================================
// bow-viewer.js — Renders BoW for a subject/term
// Usage: BoWViewer.render(hostElement, subjectCode, term)
// ============================================================

(function () {
  "use strict";

  const esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  async function render(host, subjectCode, term) {
    if (!host) return;
    host.innerHTML = `<div style="text-align:center;padding:40px;color:#6b7280;">
      <div style="width:32px;height:32px;border:3px solid #e5e7eb;border-top-color:#0f4c81;border-radius:50%;animation:bowSpin .8s linear infinite;margin:0 auto 12px;"></div>
      Loading BoW…
    </div>
    <style>@keyframes bowSpin{to{transform:rotate(360deg)}}</style>`;

    const termDoc = await window.BoW.getBoWTerm(subjectCode, term);
    if (!termDoc) {
      host.innerHTML = `<div style="text-align:center;padding:40px;color:#6b7280;">
        <div style="font-size:2.5rem;">📭</div>
        <p style="margin-top:8px;">No BoW uploaded for this term yet.</p>
      </div>`;
      return;
    }

    const comps = await window.BoW.listCompetencies(subjectCode, term);
    const groups = window.BoW.groupByTopic(comps);

    host.innerHTML = renderBoW(termDoc, groups, subjectCode, term);
    attachHandlers(host, subjectCode, term);
  }

  function renderBoW(termDoc, groups, subjectCode, term) {
    let html = "";

    // Header: Term + Theme
    html += `
      <div style="background:linear-gradient(135deg,#1e3c72,#2a5298);color:#fff;padding:16px 20px;border-radius:12px;margin-bottom:16px;">
        <div style="font-size:12px;opacity:.85;letter-spacing:.05em;text-transform:uppercase;">
          ${esc(termDoc.termLabel || ("Term " + term))}
        </div>
        ${termDoc.theme ? `<div style="font-size:1.05rem;font-weight:700;margin-top:4px;">${esc(termDoc.theme)}</div>` : ""}
        <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:12px;opacity:.9;">
          <span>📚 ${termDoc.totalCompetencies || 0} competencies</span>
          <span>📂 ${termDoc.totalTopics || 0} topics</span>
          <span>🎓 ${esc(termDoc.schoolYear || "")}</span>
          <span>📖 ${esc(termDoc.curriculum || "")}</span>
        </div>
      </div>`;

    // Content & Performance Standards
    if (termDoc.contentStandard) {
      html += `
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-left:4px solid #1e40af;border-radius:10px;padding:14px 16px;margin-bottom:12px;">
          <div style="font-size:11px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:.05em;">📘 Content Standard</div>
          <p style="margin:6px 0 0;font-size:13.5px;color:#1e3a8a;line-height:1.55;">${esc(termDoc.contentStandard)}</p>
        </div>`;
    }
    if (termDoc.performanceStandard) {
      html += `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #166534;border-radius:10px;padding:14px 16px;margin-bottom:16px;">
          <div style="font-size:11px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:.05em;">⭐ Performance Standard</div>
          <p style="margin:6px 0 0;font-size:13.5px;color:#14532d;line-height:1.55;">${esc(termDoc.performanceStandard)}</p>
        </div>`;
    }

    // Topics
    if (!groups.length) {
      html += `<div style="text-align:center;padding:30px;color:#9ca3af;">No competencies found.</div>`;
    } else {
      html += `<div style="display:flex;flex-direction:column;gap:12px;">`;
      groups.forEach((g, i) => {
        const crossBadge = g.isCrossTerm
          ? `<span style="background:#fef3c7;color:#92400e;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;margin-left:8px;">CROSS-TERM</span>`
          : "";
        const taskBadge = g.isPerformanceTask
          ? `<span style="background:#fee2e2;color:#991b1b;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;margin-left:8px;">PERFORMANCE TASK</span>`
          : "";

        html += `
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
              <div style="font-size:14px;font-weight:800;color:#0f2b4f;">
                ${esc(g.label)}${crossBadge}${taskBadge}
              </div>
              <span style="font-size:11px;color:#6b7280;background:#f3f4f6;padding:3px 10px;border-radius:999px;">
                ${g.items.length} ${g.items.length === 1 ? "competency" : "competencies"}
              </span>
            </div>

            ${g.suggestedContent ? `
              <div style="font-size:11.5px;color:#6b7280;margin-bottom:10px;padding-left:10px;border-left:2px solid #e5e7eb;">
                📎 <strong>Suggested Content:</strong> ${esc(g.suggestedContent)}
              </div>` : ""}

            <div style="display:flex;flex-direction:column;gap:8px;">
              ${g.items.map(c => renderComp(c, subjectCode, term)).join("")}
            </div>
          </div>`;
      });
      html += `</div>`;
    }

    return html;
  }

  function renderComp(c, subjectCode, term) {
    const recurring = c.isRecurring
      ? `<span title="Recurring competency" style="color:#f59e0b;font-weight:900;margin-left:4px;">*</span>`
      : "";
    return `
      <div style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:8px;padding:10px 12px;display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;">
        <div style="flex:1;min-width:220px;">
          <div style="font-family:monospace;font-size:11px;color:#1e40af;font-weight:700;margin-bottom:4px;">
            ${esc(c.code || "")}${recurring}
          </div>
          <div style="font-size:13px;color:#111827;line-height:1.5;">${esc(c.text)}</div>
        </div>
        <button
          class="bow-use-btn"
          data-code="${esc(c.code || "")}"
          data-text="${esc(c.text)}"
          data-subject="${esc(subjectCode)}"
          data-term="${esc(term)}"
          style="background:#059669;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;"
          title="Use in ILAW Lesson Plan">
          ✨ Use in ILAW
        </button>
      </div>`;
  }

  function attachHandlers(host, subjectCode, term) {
    host.querySelectorAll(".bow-use-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.dataset.code;
        const text = btn.dataset.text;
        // Hand off to ILAW planner (Session F3) — for now, copy + toast
        const payload = { subject: subjectCode, term, code, text };
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        // Fire custom event so host page can react
        host.dispatchEvent(new CustomEvent("bow:use", { detail: payload, bubbles: true }));
        btn.textContent = "✓ Copied";
        btn.style.background = "#0f4c81";
        setTimeout(() => {
          btn.textContent = "✨ Use in ILAW";
          btn.style.background = "#059669";
        }, 1500);
      });
    });
  }

  window.BoWViewer = { render };
})();