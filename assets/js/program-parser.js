// ============================================================
// program-parser.js
// Universal class program parser
// Supports: Paste (Excel/Word/PDF text), .xlsx, .csv, .txt, .docx, .pdf
// Detects: days, time slots, subjects, teachers, TLE specializations
// ============================================================

(function () {
  "use strict";

  // ------------------------------------------------------------
  // LIBRARY LOADERS (lazy — only load what's needed)
  // ------------------------------------------------------------
  async function ensureSheetJS() {
    if (window.XLSX) return;
    await loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");
  }

  async function ensureMammoth() {
    if (window.mammoth) return;
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
  }

  async function ensurePdfJs() {
    if (window.pdfjsLib) return;
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load: " + src));
      document.head.appendChild(s);
    });
  }

  // ------------------------------------------------------------
  // MAIN ENTRY — parse a file or text
  // ------------------------------------------------------------
  async function parse(source, opts = {}) {
    let lines = [];

    if (typeof source === "string") {
      // Pasted text
      lines = source.split(/\r?\n/).map(cleanLine).filter(Boolean);
    } else if (source instanceof File) {
      lines = await extractFromFile(source);
    } else {
      throw new Error("Unknown source type");
    }

    return parseLines(lines, opts);
  }

  // ------------------------------------------------------------
  // EXTRACT LINES FROM FILE
  // ------------------------------------------------------------
  async function extractFromFile(file) {
    const name = (file.name || "").toLowerCase();

    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      return await extractExcel(file);
    }
    if (name.endsWith(".docx")) {
      return await extractWord(file);
    }
    if (name.endsWith(".pdf")) {
      return await extractPdf(file);
    }
    if (name.endsWith(".csv") || name.endsWith(".txt")) {
      const text = await file.text();
      return text.split(/\r?\n/).map(cleanLine).filter(Boolean);
    }

    throw new Error("Unsupported file type: " + name);
  }

  async function extractExcel(file) {
    await ensureSheetJS();
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf, { type: "array" });
    const lines = [];

    wb.SheetNames.forEach(sheetName => {
      const sheet = wb.Sheets[sheetName];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
      rows.forEach(row => {
        const cleaned = row.map(c => c == null ? "" : String(c).trim());
        const joined = cleaned.join("\t");
        if (joined.trim()) lines.push(joined);
      });
    });

    return lines.map(cleanLine).filter(Boolean);
  }

  async function extractWord(file) {
    await ensureMammoth();
    const buf = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer: buf });
    return result.value.split(/\r?\n/).map(cleanLine).filter(Boolean);
  }

  async function extractPdf(file) {
    await ensurePdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    const lines = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      let lastY = null;
      let line = "";
      for (const item of content.items) {
        const y = Math.round(item.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 3) {
          if (line.trim()) lines.push(line.trim());
          line = "";
        }
        line += item.str + " ";
        lastY = y;
      }
      if (line.trim()) lines.push(line.trim());
    }

    return lines.map(cleanLine).filter(Boolean);
  }

  function cleanLine(line) {
    return String(line || "")
      .replace(/\u00A0/g, " ")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }

  // ------------------------------------------------------------
  // CORE PARSER
  // ------------------------------------------------------------
  function parseLines(lines, opts = {}) {
    const result = {
      classLabel: null,
      schoolYear: null,
      adviser: null,
      timeSlots: [],
      entries: [],
      unmatchedTeachers: new Set(),
      warnings: [],
      stats: {
        linesRead: lines.length,
        daysFound: 0,
        slotsFound: 0,
        entriesFound: 0,
      },
    };

    // ---- 1. Look for class metadata ----
    for (const line of lines) {
      const classMatch = line.match(/Grade\s+(\d+)\s*[-–]?\s*([A-Z][A-Za-z\s]+)/i);
      if (classMatch && !result.classLabel) {
        result.classLabel = `Grade ${classMatch[1]} - ${classMatch[2].trim()}`;
      }
      const yearMatch = line.match(/School Year[:\s]+(\d{4}\s*[-–]\s*\d{4})/i);
      if (yearMatch && !result.schoolYear) {
        result.schoolYear = yearMatch[1].replace(/\s+/g, "");
      }
      const adviserMatch = line.match(/Class Adviser[:\s]+([A-Z][A-Za-z.\s]+?)(?:\s+Position|$)/i);
      if (adviserMatch && !result.adviser) {
        result.adviser = adviserMatch[1].trim();
      }
    }

    // ---- 2. Find days header row ----
    const dayMap = {};
    let dayRowIndex = -1;
    const dayPatterns = [
      { key: "Monday", re: /\bMONDAY\b|\bMON\b|\bLUNES\b/i },
      { key: "Tuesday", re: /\bTUESDAY\b|\bTUE\b|\bMARTES\b/i },
      { key: "Wednesday", re: /\bWEDNESDAY\b|\bWED\b|\bMIYERKULES\b/i },
      { key: "Thursday", re: /\bTHURSDAY\b|\bTHU\b|\bHUWEBES\b/i },
      { key: "Friday", re: /\bFRIDAY\b|\bFRI\b|\bBIYERNES\b/i },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let dayCount = 0;
      const found = {};
      for (const { key, re } of dayPatterns) {
        if (re.test(line)) {
          dayCount++;
          found[key] = true;
        }
      }
      if (dayCount >= 3) {
        dayRowIndex = i;
        Object.assign(dayMap, found);
        break;
      }
    }

    if (dayRowIndex === -1) {
      result.warnings.push("Could not find a header row with days (Monday-Friday).");
      return result;
    }

    // ---- 3. Parse rows after day header ----
    // Detect time pattern (7:45 AM, 7:45-8:45, etc.)
    const timeRx = /(\d{1,2}):(\d{2})\s*(?:AM|PM)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(?:AM|PM)?/i;
    const timeRx2 = /^(\d{1,2}):(\d{2})\s*(?:AM|PM)?$/i;

    const slotsSeen = new Map();

    for (let i = dayRowIndex + 1; i < lines.length; i++) {
      const line = lines[i];

      // Skip metadata lines
      if (/^(prepared|reviewed|approved|school\s+year|class\s+adviser|grade\s+level)/i.test(line)) {
        continue;
      }
      if (/^(SATURNINO|ONOFRE|ROMMEL)/.test(line)) continue;

      // Try to find time range
      const timeMatch = line.match(timeRx);
      if (!timeMatch) continue;

      // Extract start/end times as 24h
      const start = to24h(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), line, "start");
      const end = to24h(parseInt(timeMatch[3], 10), parseInt(timeMatch[4], 10), line, "end");

      const slotKey = `${start}-${end}`;
      if (!slotsSeen.has(slotKey)) {
        slotsSeen.set(slotKey, {
          start: start,
          end: end,
          label: guessSlotLabel(start, end),
        });
      }

      // Split the rest of the line into 5 day-cells
      const rest = line.replace(timeRx, "").trim();
      const cells = rest.split(/\t|\s{3,}|\s*\|\s*/).filter(c => c.trim());

      // If we only got 1 cell (pasted text), try to split by <br>-like patterns
      const dayCells = cells.length >= 3 ? cells : [rest];

      // For each day, if we have a cell, try to extract subject + teacher
      const dayKeys = Object.keys(dayMap).filter(k => dayMap[k]);
      for (let d = 0; d < dayKeys.length; d++) {
        const cell = dayCells[d] || "";
        if (!cell.trim()) continue;

        const parsed = parseCell(cell);
        if (!parsed) continue;

        result.entries.push({
          day: dayKeys[d],
          slotStart: start,
          slotEnd: end,
          subject: parsed.subject,
          teacher: parsed.teacher,
          specialization: parsed.specialization,
        });
      }
    }

    // ---- 4. Compile stats ----
    result.timeSlots = Array.from(slotsSeen.values()).sort((a, b) => a.start.localeCompare(b.start));
    result.stats.daysFound = Object.keys(dayMap).filter(k => dayMap[k]).length;
    result.stats.slotsFound = result.timeSlots.length;
    result.stats.entriesFound = result.entries.length;

    return result;
  }

  // ------------------------------------------------------------
  // PARSE A CELL — extract subject + teacher
  // ------------------------------------------------------------
  function parseCell(cell) {
    const cleaned = cell.trim();
    if (!cleaned) return null;

    // Skip common filler
    if (/^(flag|health\s*break|lunch|recess|classroom|zone|cleaning|aral)/i.test(cleaned)) {
      return null;
    }

    // Split on common separators
    // Format 1: "SUBJECT<br>Teacher Name"
    // Format 2: "SUBJECT\nTeacher Name"
    // Format 3: "SUBJECT Teacher Name"
    let subject = "";
    let teacher = "";
    let spec = "";

    // Try splitting by newline OR double-space (from Excel)
    const parts = cleaned.split(/\n|\s{2,}/).map(p => p.trim()).filter(Boolean);

    if (parts.length >= 2) {
      subject = parts[0];
      teacher = parts.slice(1).join(" ");
    } else {
      // Fallback: try to detect subject code vs name
      const match = cleaned.match(/^([A-Z][A-Z0-9-]{1,15}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(.+)$/);
      if (match) {
        subject = match[1];
        teacher = match[2];
      } else {
        subject = cleaned;
      }
    }

    // Detect TLE specialization from subject
    if (/(TLE|COOKERY|DRESSMAKING|ELECTRONICS|CARPENTRY|ICT|AUTOMOTIVE|WELDING|PLUMBING|MASONRY)/i.test(subject)) {
      const specMatch = subject.match(/(Cookery|Dressmaking|Electronics|Carpentry|ICT|Automotive|Welding|Plumbing|Masonry|AFA|FCS|IA)/i);
      if (specMatch) spec = specMatch[1];
    }

    // Detect multiple teachers (TLE rotation)
    if (teacher && /\//.test(teacher)) {
      // Store as-is for now; the import step can split if needed
    }

    return { subject: subject.trim(), teacher: teacher.trim(), specialization: spec };
  }

  // ------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------
  function to24h(h, m, context, position) {
    let hours = h;
    const lower = context.toLowerCase();
    const isPm = /pm/.test(lower);

    // If hour is 1-7 and there's a PM marker → assume PM
    if (isPm && hours < 12) hours += 12;
    // If hour is 1-7 and no marker → assume PM for afternoon slots
    if (!/am/.test(lower) && !isPm && hours >= 1 && hours <= 7) {
      // ambiguous — leave as-is for now, will refine
    }

    return `${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function guessSlotLabel(start, end) {
    // Simple label guesser based on time
    const [sh] = start.split(":").map(Number);
    if (sh === 7 && start === "07:20") return "Flag Ceremony";
    if (start === "09:45" && end === "10:00") return "Health Break";
    if (start === "12:00" && end === "13:00") return "Lunch Break";
    if (start === "16:00") return "Aral Program";
    return `${start} - ${end}`;
  }

  // ------------------------------------------------------------
  // PUBLIC API
  // ------------------------------------------------------------
  window.ProgramParser = {
    parse,
    extractFromFile,
    parseLines,
  };

})();