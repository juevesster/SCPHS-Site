// ============================================================
// bow-parser.js — Universal Budget of Work parser
// Supports: PDF (via PDF.js), Excel (via XLSX.js), CSV, plain text
// Auto-detects: Terms, Content/Performance Standards, Topics/Weeks,
//               Learning Competencies, Recurring flags
// Output: Universal schema (works for K-12, all curricula)
// ============================================================

(function () {
  "use strict";

  // ---------- Regex patterns (universal) ----------
  const RX = {
    // Term markers
    term: /^(first|second|third|1st|2nd|3rd|term\s*[123]|q[1-4]|quarter\s*[1-4])[\s:.\-]*(term|quarter)?$/i,

    // Structural labels
    contentStandard: /^content\s*standard[\s:]*$/i,
    performanceStandard: /^performance\s*standard[\s:]*$/i,
    performanceTask: /^performance\s*task/i,
    theme: /^theme[\s:]/i,

    // Topic markers (week or subtheme)
    weekNumbered: /^week\s*(\d+)[\s:.\-]*(.*)$/i,
    numberedTopic: /^(\d{1,2})[\.\)]\s*(.+)$/,

    // Competency markers
    bullet: /^[\*\-•●○▪]\s*(.+)$/,
    competencyCode: /\b([A-Z]{1,5}\d{0,3}[A-Z]*[\-–][IVX]+[a-z]?[\-–]?\d*)\b/i,

    // Recurring flag
    recurring: /^\s*\*/,

    // Cross-term section
    crossTerm: /^(literacy\s*and\s*numeracy|across\s*terms|contents?\s*that\s*should)/i,
  };

  // ---------- Text cleaning ----------
  function cleanLine(line) {
    return String(line || "")
      .replace(/\u00A0/g, " ")              // non-breaking space
      .replace(/[\u2018\u2019]/g, "'")       // smart quotes
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "–")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isPageFooter(line) {
    return /^page\s+\d+\s+of\s+\d+/i.test(line) ||
           /^last\s+updated/i.test(line) ||
           /^budget\s+of\s+work/i.test(line) && line.length < 40 ||
           /^\d+\s*$/.test(line);
  }

  // ---------- Extract text from different formats ----------

  // PDF via PDF.js
  async function extractPdfText(file) {
    if (typeof pdfjsLib === "undefined") {
      throw new Error("PDF.js not loaded. Add the script tag before using this parser.");
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // Reconstruct lines by grouping items with similar Y
      let lastY = null;
      let line = "";
      const lines = [];
      for (const item of content.items) {
        const y = Math.round(item.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 3) {
          lines.push(line.trim());
          line = "";
        }
        line += item.str + " ";
        lastY = y;
      }
      if (line.trim()) lines.push(line.trim());
      pages.push(lines);
    }
    return pages.flat().map(cleanLine).filter(Boolean);
  }

  // Excel via XLSX.js
  async function extractExcelText(file) {
    if (typeof XLSX === "undefined") {
      throw new Error("XLSX library not loaded.");
    }
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const lines = [];
    wb.SheetNames.forEach(sheetName => {
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
      rows.forEach(row => {
        const joined = row.map(c => c == null ? "" : String(c).trim()).filter(Boolean).join(" | ");
        if (joined) lines.push(joined);
      });
    });
    return lines.map(cleanLine).filter(Boolean);
  }

  // Plain text / CSV
  async function extractPlainText(file) {
    const text = await file.text();
    return text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  }

  // Auto-detect format
  async function extractLines(file) {
    const name = (file.name || "").toLowerCase();
    if (name.endsWith(".pdf")) return extractPdfText(file);
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) return extractExcelText(file);
    return extractPlainText(file);
  }

  // ---------- Core parser ----------
  // Takes an array of cleaned lines, returns universal schema
  function parseLines(lines, meta = {}) {
    const result = {
      term: null,
      termLabel: null,
      theme: null,
      contentStandard: "",
      performanceStandard: "",
      topics: [],       // { label, orderIndex, isCrossTerm, suggestedContent, competencies: [] }
      stats: { linesRead: lines.length, topicsFound: 0, competenciesFound: 0 },
    };

    let mode = "idle";     // idle | contentStd | perfStd | inTopic | crossTerm
    let currentTopic = null;
    let currentTerm = null;
    let bufferStd = [];

    const pushTopic = () => {
      if (currentTopic && (currentTopic.competencies.length || currentTopic.label)) {
        result.topics.push(currentTopic);
      }
      currentTopic = null;
    };

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      if (!raw || isPageFooter(raw)) continue;

      // ---------- Term detection ----------
      const termMatch = raw.match(RX.term);
      if (termMatch && raw.length < 40) {
        pushTopic();
        currentTerm = {
          label: raw,
          num: normalizeTermNumber(termMatch[1]),
        };
        if (result.term == null) {
          result.term = currentTerm.num;
          result.termLabel = raw;
        }
        mode = "idle";
        continue;
      }

      // ---------- Theme ----------
      if (RX.theme.test(raw)) {
        result.theme = raw.replace(RX.theme, "").trim();
        continue;
      }

      // ---------- Content Standard ----------
      if (RX.contentStandard.test(raw)) {
        pushTopic();
        mode = "contentStd";
        bufferStd = [];
        continue;
      }

      // ---------- Performance Standard ----------
      if (RX.performanceStandard.test(raw)) {
        if (mode === "contentStd") {
          result.contentStandard = bufferStd.join(" ").trim();
        }
        mode = "perfStd";
        bufferStd = [];
        continue;
      }

      // ---------- Theme fallback ----------
      if (/^theme[\s:]/i.test(raw) && !result.theme) {
        result.theme = raw.replace(/^theme[\s:]*/i, "").trim();
        continue;
      }

      // ---------- Performance Task ----------
      if (RX.performanceTask.test(raw) && raw.length < 60) {
        // Capture line as a topic
        pushTopic();
        currentTopic = {
          label: raw,
          orderIndex: result.topics.length + 1,
          isCrossTerm: false,
          isPerformanceTask: true,
          suggestedContent: "",
          competencies: [],
        };
        mode = "inTopic";
        continue;
      }

      // ---------- Cross-term section ----------
      if (RX.crossTerm.test(raw)) {
        pushTopic();
        currentTopic = {
          label: raw,
          orderIndex: result.topics.length + 1,
          isCrossTerm: true,
          suggestedContent: "",
          competencies: [],
        };
        mode = "crossTerm";
        continue;
      }

      // ---------- Numbered topic / week ----------
      const weekMatch = raw.match(RX.weekNumbered);
      if (weekMatch) {
        pushTopic();
        currentTopic = {
          label: `Week ${weekMatch[1]}${weekMatch[2] ? " — " + weekMatch[2] : ""}`,
          weekNumber: parseInt(weekMatch[1], 10),
          orderIndex: result.topics.length + 1,
          isCrossTerm: false,
          suggestedContent: "",
          competencies: [],
        };
        mode = "inTopic";
        continue;
      }

      const numMatch = raw.match(RX.numberedTopic);
      if (numMatch && numMatch[2].length < 80 && !RX.competencyCode.test(raw)) {
        pushTopic();
        currentTopic = {
          label: `${numMatch[1]}. ${numMatch[2]}`,
          orderIndex: parseInt(numMatch[1], 10) || (result.topics.length + 1),
          isCrossTerm: false,
          suggestedContent: "",
          competencies: [],
        };
        mode = "inTopic";
        continue;
      }

      // ---------- Content / Performance standard body ----------
      if (mode === "contentStd") {
        if (raw.length > 20) bufferStd.push(raw);
        continue;
      }
      if (mode === "perfStd") {
        if (raw.length > 20) bufferStd.push(raw);
        continue;
      }

      // ---------- Competency lines (bullets or plain) ----------
      const bulletMatch = raw.match(RX.bullet);
      const lineText = bulletMatch ? bulletMatch[1].trim() : raw;
      const isRecurring = RX.recurring.test(raw);

      if (currentTopic) {
        // If it looks like a competency (reasonable length, not a header)
        if (lineText.length > 8 && lineText.length < 500 &&
            !RX.contentStandard.test(lineText) &&
            !RX.performanceStandard.test(lineText)) {

          // Extract competency code if present
          const codeMatch = lineText.match(RX.competencyCode);
          const code = codeMatch ? codeMatch[1] : generateCode(result, currentTopic);

          // Remove code from text if it's duplicated
          const text = codeMatch
            ? lineText.replace(codeMatch[1], "").replace(/^[\s\-–:]+/, "").trim()
            : lineText;

          if (text.length > 5) {
            currentTopic.competencies.push({
              code,
              text,
              isRecurring,
              orderIndex: currentTopic.competencies.length + 1,
            });
          }
        } else if (mode === "inTopic" && lineText.length > 3 && lineText.length < 120) {
          // Short line — likely suggested content
          currentTopic.suggestedContent = (currentTopic.suggestedContent
            ? currentTopic.suggestedContent + " · "
            : "") + lineText;
        }
      }
    }

    // Flush trailing
    if (mode === "contentStd") result.contentStandard = bufferStd.join(" ").trim();
    if (mode === "perfStd") result.performanceStandard = bufferStd.join(" ").trim();
    pushTopic();

    // If no explicit term was found, assume Term 1
    if (result.term == null) result.term = meta.term || 1;

    // Stats
    result.stats.topicsFound = result.topics.length;
    result.stats.competenciesFound = result.topics.reduce((s, t) => s + t.competencies.length, 0);

    return result;
  }

  function normalizeTermNumber(label) {
    const s = String(label).toLowerCase();
    if (/first|1st|term\s*1|q1|quarter\s*1/.test(s)) return 1;
    if (/second|2nd|term\s*2|q2|quarter\s*2/.test(s)) return 2;
    if (/third|3rd|term\s*3|q3|quarter\s*3/.test(s)) return 3;
    if (/fourth|4th|q4|quarter\s*4/.test(s)) return 4;
    return 1;
  }

  function generateCode(result, topic) {
    const t = result.term || 1;
    const sIdx = topic.orderIndex || 1;
    const cIdx = topic.competencies.length + 1;
    return `T${t}-S${String(sIdx).padStart(2, "0")}-C${String(cIdx).padStart(2, "0")}`;
  }

  // ---------- Public API ----------
  window.BoWParser = {
    async parse(file, meta = {}) {
      const lines = await extractLines(file);
      return parseLines(lines, meta);
    },

    // For pasting raw text directly (no file)
    parseText(text, meta = {}) {
      const lines = String(text).split(/\r?\n/).map(cleanLine).filter(Boolean);
      return parseLines(lines, meta);
    },
  };
})();