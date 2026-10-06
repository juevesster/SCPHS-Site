// ============================================================
// bow-parser.js — Universal Budget of Work parser v3
// Supports: PDF (via PDF.js), Excel (via XLSX.js), CSV, plain text
// Auto-detects: Terms (EN + FIL), Content/Performance Standards,
//               Topics/Weeks (incl. ranges), Learning Competencies
//
// v3 fixes:
//   1. Tagalog term headers (Unang/Ikalawang/Ikatlong Termino)
//   2. Tagalog standard headers (Pamantayang Pangnilalaman, etc.)
//   3. "Week X to Y" range handling (no more "Week 8 — to 9")
//   4. Duplicate code generation for merged lines (immune counter)
//   5. Numbered-topic guard tightened (won't eat numbered competencies)
// ============================================================

(function () {
  "use strict";

  // ---------- Regex patterns (universal, EN + FIL) ----------
  const RX = {
    // ✅ FIX 1: accept Tagalog + Taglish term headers
    term: /^(first|second|third|fourth|1st|2nd|3rd|4th|term\s*[1-4]|q[1-4]|quarter\s*[1-4]|unang\s*termino|ikalawang\s*termino|ikatlong\s*termino|ikaapat\s*na\s*termino|unang\s*markahan|ikalawang\s*markahan|ikatlong\s*markahan|ikaapat\s*na\s*markahan)[\s:.\-]*(term|quarter|termino|markahan)?$/i,

    // ✅ FIX 2: accept Tagalog standard headers
    contentStandard: /^(content\s*standard|pamantayang\s*pangnilalaman)[\s:]*$/i,
    performanceStandard: /^(performance\s*standard|pamantayan\s*sa\s*pagganap)[\s:]*$/i,

    performanceTask: /^(performance\s*task|gawaing\s*pagganap)/i,
    theme: /^(theme|paksa)[\s:]/i,

    // ✅ FIX 3: handle "Week 8 to 9", "Linggo 1-2", "Week 1–3"
    weekNumbered: /^(?:week|linggo)\s*(\d+)(?:\s*(?:to|-|–|—)\s*(\d+))?[\s:.\-]*(.*)$/i,

    numberedTopic: /^(\d{1,2})[\.\)]\s*(.+)$/,
    bullet: /^[\*\-•●○▪]\s*(.+)$/,
    competencyCode: /\b([A-Z]{1,5}\d{0,3}[A-Z]*[\-–][IVX]+[a-z]?[\-–]?\d*)\b/i,
    recurring: /^\s*\*/,
    crossTerm: /^(literacy\s*and\s*numeracy|across\s*terms|contents?\s*that\s*should)/i,
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
  function looksIncomplete(line) {
    if (!line) return false;
    const s = line.trim();
    if (s.length === 0) return false;

    if (/[.!?;:]\s*$/.test(s)) return false;
    if (/\)\s*$/.test(s)) return false;

    if (s.length < 20 && /[a-z]\s*$/i.test(s) && !/[,(]$/.test(s)) return false;

    if (/[,\-–]\s*$/.test(s)) return true;
    if (/\b(and|or|the|a|an|in|of|to|for|with|by|on|at|that|which|where|when|how|is|are|was|were|be|been|being|this|these|those|ang|ng|sa|na|at|ay)\s*$/i.test(s)) return true;

    if (/[a-z]\s*$/.test(s)) return s.length > 25;

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
  // ✅ FIX 4: competency counter tracked per topic, immune to merging
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
    let bufferStd = [];
    let pendingComp = null;

    const flushPending = () => {
      if (pendingComp && currentTopic && pendingComp.text.trim().length > 3) {
        // Always assign fresh sequential code on flush
        currentTopic._compCounter = (currentTopic._compCounter || 0) + 1;
        pendingComp.code = `T${result.term || 1}-S${String(currentTopic.orderIndex).padStart(2, "0")}-C${String(currentTopic._compCounter).padStart(2, "0")}`;
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

      // ---------- Term ----------
      const termMatch = raw.match(RX.term);
      if (termMatch && raw.length < 40) {
        pushTopic();
        if (result.term == null) {
          result.term = normalizeTermNumber(termMatch[1]);
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
        if (mode === "contentStd") result.contentStandard = bufferStd.join(" ").trim();
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
          _compCounter: 0,
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
          _compCounter: 0,
        };
        mode = "crossTerm";
        continue;
      }

      // ---------- Week / Week Range / Linggo ----------
      const weekMatch = raw.match(RX.weekNumbered);
      if (weekMatch) {
        pushTopic();
        const start = weekMatch[1];
        const end = weekMatch[2];
        const extra = weekMatch[3] ? " — " + weekMatch[3] : "";
        const label = end ? `Week ${start} to ${end}${extra}` : `Week ${start}${extra}`;
        currentTopic = {
          label,
          weekNumber: parseInt(start, 10),
          orderIndex: result.topics.length + 1,
          isCrossTerm: false,
          suggestedContent: "",
          competencies: [],
          _compCounter: 0,
        };
        mode = "inTopic";
        continue;
      }

      // ---------- Numbered topic (tightened) ----------
      const numMatch = raw.match(RX.numberedTopic);
      if (
        numMatch &&
        numMatch[2].length < 70 &&
        !RX.competencyCode.test(raw) &&
        numMatch[2].split(" ").length < 8 &&
        !/[,;]$/.test(numMatch[2])
      ) {
        pushTopic();
        currentTopic = {
          label: `${numMatch[1]}. ${numMatch[2]}`,
          orderIndex: parseInt(numMatch[1], 10) || (result.topics.length + 1),
          isCrossTerm: false,
          suggestedContent: "",
          competencies: [],
          _compCounter: 0,
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
        if (lineText.length < 6 && !isBullet) continue;
        if (RX.contentStandard.test(lineText) || RX.performanceStandard.test(lineText)) continue;

        if (pendingComp) {
          if (looksIncomplete(pendingComp.text) && lineText.length < 80 && !isBullet) {
            pendingComp.text = (pendingComp.text + " " + lineText).replace(/\s+/g, " ").trim();
            if (!looksIncomplete(pendingComp.text)) flushPending();
            continue;
          } else {
            flushPending();
          }
        }

        const codeMatch = lineText.match(RX.competencyCode);
        const text = codeMatch
          ? lineText.replace(codeMatch[1], "").replace(/^[\s\-–:]+/, "").trim()
          : lineText;

        pendingComp = {
          code: "", // assigned at flush
          text,
          isRecurring,
          orderIndex: currentTopic.competencies.length + 1,
        };

        if (!looksIncomplete(text) && text.length > 15) flushPending();
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

  // ✅ Recognize Tagalog number words
  function normalizeTermNumber(label) {
    const s = String(label).toLowerCase();
    if (/first|1st|term\s*1|q1|quarter\s*1|unang/.test(s)) return 1;
    if (/second|2nd|term\s*2|q2|quarter\s*2|ikalawang/.test(s)) return 2;
    if (/third|3rd|term\s*3|q3|quarter\s*3|ikatlong/.test(s)) return 3;
    if (/fourth|4th|q4|quarter\s*4|ikaapat/.test(s)) return 4;
    return 1;
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