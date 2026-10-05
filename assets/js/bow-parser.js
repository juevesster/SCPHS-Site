// ============================================================
// bow-parser.js — Universal Budget of Work parser v2
// Supports: PDF (via PDF.js), Excel (via XLSX.js), CSV, plain text
// Auto-detects: Terms, Content/Performance Standards, Topics/Weeks,
//               Learning Competencies, Recurring flags
// v2: Smart line-merging for fragmented competencies
// ============================================================

(function () {
  "use strict";

  // ---------- Regex patterns (universal) ----------
  const RX = {
    term: /^(first|second|third|1st|2nd|3rd|term\s*[123]|q[1-4]|quarter\s*[1-4])[\s:.\-]*(term|quarter)?$/i,
    contentStandard: /^content\s*standard[\s:]*$/i,
    performanceStandard: /^performance\s*standard[\s:]*$/i,
    performanceTask: /^performance\s*task/i,
    theme: /^theme[\s:]/i,
    weekNumbered: /^(?:week|linggo)\s*(\d+)[\s:.\-]*(.*)$/i,
    numberedTopic: /^(\d{1,2})[\.\)]\s*(.+)$/,
    bullet: /^[\*\-•●○▪]\s*(.+)$/,
    competencyCode: /\b([A-Z]{1,5}\d{0,3}[A-Z]*[\-–][IVX]+[a-z]?[\-–]?\d*)\b/i,
    recurring: /^\s*\*/,
    crossTerm: /^(literacy\s*and\s*numeracy|across\s*terms|contents?\s*that\s*should)/i,
    // NEW: detect incomplete sentences (no ending punctuation)
    // A "complete" competency typically ends with a period, or has 40+ chars
    pageFooter: /^page\s+\d+\s+of\s+\d+/i,
  };

  // ---------- Text cleaning ----------
  function cleanLine(line) {
    return String(line || "")
      .replace(/\u00A0/g, " ")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "–")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isPageFooter(line) {
    return /^page\s+\d+\s+of\s+\d+/i.test(line) ||
           /^last\s+updated/i.test(line) ||
           (/^budget\s+of\s+work/i.test(line) && line.length < 60) ||
           /^\d+\s*$/.test(line);
  }

  // ---------- Line-merge helper ----------
  // Determines if a line looks like a continuation of the previous one
  function looksIncomplete(line) {
    if (!line) return false;
    const s = line.trim();
    if (s.length === 0) return false;

    // Ends with sentence punctuation → complete
    if (/[.!?;:]\s*$/.test(s)) return false;

    // Ends with a closing paren → complete
    if (/\)\s*$/.test(s)) return false;

    // Very short lines (like "feelings.") — likely NOT continuation
    if (s.length < 20 && /[a-z]\s*$/i.test(s) && !/[,(]$/.test(s)) {
      // Check if previous ended mid-sentence
      return false;
    }

    // Ends with comma, "and", "or", "the", "a", "in", "of", etc. → incomplete
    if (/[,\-–]\s*$/.test(s)) return true;
    if (/\b(and|or|the|a|an|in|of|to|for|with|by|on|at|that|which|where|when|how|is|are|was|were|be|been|being|this|these|those)\s*$/i.test(s)) return true;

    // Ends without punctuation but has lowercase last char (mid-sentence)
    if (/[a-z]\s*$/.test(s)) {
      // Only treat as incomplete if reasonably long (likely wrapped)
      return s.length > 25;
    }

    return false;
  }

  // ---------- Extract text from formats ----------

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

  async function extractPlainText(file) {
    const text = await file.text();
    return text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  }

  async function extractLines(file) {
    const name = (file.name || "").toLowerCase();
    if (name.endsWith(".pdf")) return extractPdfText(file);
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) return extractExcelText(file);
    return extractPlainText(file);
  }

  // ---------- Core parser ----------
  function parseLines(lines, meta = {}) {
    const result = {
      term: null,
      termLabel: null,
      theme: null,
      contentStandard: "",
      performanceStandard: "",
      topics: [],
      stats: { linesRead: lines.length, topicsFound: 0, competenciesFound: 0 },
    };

    let mode = "idle";
    let currentTopic = null;
    let currentTerm = null;
    let bufferStd = [];

    // Pending competency buffer for line-merging
    let pendingComp = null;
    const flushPending = () => {
      if (pendingComp && currentTopic && pendingComp.text.trim().length > 3) {
        currentTopic.competencies.push(pendingComp);
      }
      pendingComp = null;
    };

    const pushTopic = () => {
      flushPending();
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
        currentTerm = { label: raw, num: normalizeTermNumber(termMatch[1]) };
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

      // ---------- Performance Task ----------
      if (RX.performanceTask.test(raw) && raw.length < 60) {
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

      // Numbered topic — but ONLY if it's short and doesn't look like a competency
      const numMatch = raw.match(RX.numberedTopic);
      if (numMatch && numMatch[2].length < 80 && !RX.competencyCode.test(raw) && numMatch[2].split(" ").length < 10) {
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

      // ---------- Standard body ----------
      if (mode === "contentStd") {
        if (raw.length > 20) bufferStd.push(raw);
        continue;
      }
      if (mode === "perfStd") {
        if (raw.length > 20) bufferStd.push(raw);
        continue;
      }

      // ---------- Competency lines ----------
      const bulletMatch = raw.match(RX.bullet);
      const isBullet = !!bulletMatch;
      const lineText = bulletMatch ? bulletMatch[1].trim() : raw;
      const isRecurring = RX.recurring.test(raw) || (isBullet && /^\*\s/.test(raw));

      if (currentTopic) {
        // Detect if this is a NEW competency start vs continuation
        const startsNew = isBullet ||
          /^[A-Z]/.test(lineText) ||
          lineText.length > 60 ||
          /[.!?]\s*$/.test(lineText);

        // Skip if too short and not a start (likely noise)
        if (lineText.length < 6 && !startsNew) continue;

        // Skip obvious headers
        if (RX.contentStandard.test(lineText) || RX.performanceStandard.test(lineText)) continue;

        // Handle pending from previous line
        if (pendingComp) {
          // If this line looks incomplete and short → merge
          if (looksIncomplete(pendingComp.text) && lineText.length < 80 && !isBullet) {
            // Merge continuation
            pendingComp.text = (pendingComp.text + " " + lineText).replace(/\s+/g, " ").trim();
            // If merged text now looks complete → flush
            if (!looksIncomplete(pendingComp.text)) {
              flushPending();
            }
            continue;
          } else {
            // Previous is complete enough or this is a new bullet → flush and start fresh
            flushPending();
          }
        }

        // Start a new pending competency
        const codeMatch = lineText.match(RX.competencyCode);
        const code = codeMatch ? codeMatch[1] : generateCode(result, currentTopic, isRecurring);
        const text = codeMatch
          ? lineText.replace(codeMatch[1], "").replace(/^[\s\-–:]+/, "").trim()
          : lineText;

        pendingComp = {
          code,
          text,
          isRecurring,
          orderIndex: currentTopic.competencies.length + 1,
        };

        // If this line already looks complete, flush immediately
        if (!looksIncomplete(text) && text.length > 15) {
          flushPending();
        }
      }
    }

    // Final flush
    if (mode === "contentStd") result.contentStandard = bufferStd.join(" ").trim();
    if (mode === "perfStd") result.performanceStandard = bufferStd.join(" ").trim();
    pushTopic();

    if (result.term == null) result.term = meta.term || 1;

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

  function generateCode(result, topic, isRecurring) {
    const t = result.term || 1;
    const sIdx = topic.orderIndex || 1;
    const cIdx = topic.competencies.length + (topic._pendingIndex || 0) + 1;
    return `T${t}-S${String(sIdx).padStart(2, "0")}-C${String(cIdx).padStart(2, "0")}`;
  }

  // ---------- Public API ----------
  window.BoWParser = {
    async parse(file, meta = {}) {
      const lines = await extractLines(file);
      return parseLines(lines, meta);
    },
    parseText(text, meta = {}) {
      const lines = String(text).split(/\r?\n/).map(cleanLine).filter(Boolean);
      return parseLines(lines, meta);
    },
  };
})();