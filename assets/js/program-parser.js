// ============================================================
// program-parser.js — v2
// Now supports: Word .docx TABLE extraction (in addition to Excel/PDF/text)
// ============================================================

(function () {
  "use strict";

  // ------------------------------------------------------------
  // LIBRARY LOADERS
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
  // MAIN ENTRY
  // ------------------------------------------------------------
  async function parse(source, opts = {}) {
    // Case 1: Excel or Word table with structured rows
    if (source instanceof File) {
      const name = (source.name || "").toLowerCase();

      if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const rows = await extractExcelRows(source);
        return parseRows(rows, opts);
      }

      if (name.endsWith(".docx")) {
        const rows = await extractWordTableRows(source);
        if (rows && rows.length) return parseRows(rows, opts);
        // fallback to plain text if no tables found
        const text = await extractWordText(source);
        return parseText(text, opts);
      }

      if (name.endsWith(".pdf")) {
        const lines = await extractPdfLines(source);
        return parseLines(lines, opts);
      }

      if (name.endsWith(".csv") || name.endsWith(".txt")) {
        const text = await source.text();
        return parseText(text, opts);
      }

      throw new Error("Unsupported file type: " + name);
    }

    // Case 2: String (paste)
    if (typeof source === "string") {
      return parseText(source, opts);
    }

    throw new Error("Unknown source type");
  }

  // ------------------------------------------------------------
  // EXCEL → rows of arrays
  // ------------------------------------------------------------
  async function extractExcelRows(file) {
    await ensureSheetJS();
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf, { type: "array" });
    const allRows = [];

    wb.SheetNames.forEach(sheetName => {
      const sheet = wb.Sheets[sheetName];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
      rows.forEach(row => {
        const cleaned = row.map(c => c == null ? "" : String(c).trim());
        if (cleaned.some(c => c)) allRows.push(cleaned);
      });
    });

    return allRows;
  }

  // ------------------------------------------------------------
  // WORD → rows of arrays (via HTML table extraction)
  // ------------------------------------------------------------
  async function extractWordTableRows(file) {
    await ensureMammoth();
    const buf = await file.arrayBuffer();
    const result = await window.mammoth.convertToHtml({ arrayBuffer: buf });
    const html = result.value || "";

    // Find the biggest table
    const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
    if (!tables.length) return null;

    let biggest = "", maxCells = 0;
    for (const t of tables) {
      const cellCount = (t.match(/<td|<th/gi) || []).length;
      if (cellCount > maxCells) { maxCells = cellCount; biggest = t; }
    }

    // Parse the biggest table into rows/cells
    const rows = [];
    const trMatches = biggest.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    for (const tr of trMatches) {
      const cells = [];
      const cellMatches = tr.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || [];
      for (const cell of cellMatches) {
        // Strip inner tags but preserve <br> as line breaks
        let content = cell
          .replace(/<\/t[dh]>/i, "")
          .replace(/<t[dh][^>]*>/i, "")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/\s*\n\s*/g, "\n")
          .replace(/[ \t]+/g, " ")
          .trim();
        cells.push(content);
      }
      if (cells.length) rows.push(cells);
    }

    return rows;
  }

  // ------------------------------------------------------------
  // WORD → plain text (fallback)
  // ------------------------------------------------------------
  async function extractWordText(file) {
    await ensureMammoth();
    const buf = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer: buf });
    return result.value || "";
  }

  // ------------------------------------------------------------
  // PDF → lines
  // ------------------------------------------------------------
  async function extractPdfLines(file) {
    await ensurePdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    const lines = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      let lastY = null, line = "";
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
    return String(line || "").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
  }

  // ============================================================
  // PARSER — TABLE ROWS
  // ============================================================
  function parseRows(rows, opts = {}) {
    const result = {
      classLabel: null,
      schoolYear: null,
      adviser: null,
      timeSlots: [],
      entries: [],
      warnings: [],
      stats: { linesRead: rows.length, daysFound: 0, slotsFound: 0, entriesFound: 0 },
    };

    // ---- 1. Find the day header row ----
    const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const DAY_RE = [/\bMONDAY\b|\bMON\b/i, /\bTUESDAY\b|\bTUE\b/i, /\bWEDNESDAY\b|\bWED\b/i, /\bTHURSDAY\b|\bTHU\b/i, /\bFRIDAY\b|\bFRI\b/i];

    let headerRowIdx = -1;
    let dayColumnMap = {}; // dayName → column index

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      let found = 0;
      const map = {};
      for (let c = 0; c < row.length; c++) {
        for (let d = 0; d < DAY_RE.length; d++) {
          if (DAY_RE[d].test(row[c])) {
            found++;
            map[DAY_NAMES[d]] = c;
          }
        }
      }
      if (found >= 3) {
        headerRowIdx = r;
        dayColumnMap = map;
        break;
      }
    }

    if (headerRowIdx === -1) {
      result.warnings.push("Could not find a header row with days.");
      return result;
    }

    result.stats.daysFound = Object.keys(dayColumnMap).length;

        // ---- 2. Detect the time column by CONTENT, not position ----
    // Scan the first few data rows to find which column has time patterns
    const timeRxScan = /(\d{1,2}):(\d{2})\s*(?:AM|PM)?\s*[-–—]\s*(\d{1,2}):(\d{2})/i;
    let timeCol = -1;
    for (let r = headerRowIdx + 1; r < Math.min(rows.length, headerRowIdx + 5); r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        if (timeRxScan.test(row[c])) {
          timeCol = c;
          break;
        }
      }
      if (timeCol >= 0) break;
    }

    // Fallback: use column before first day
    if (timeCol === -1) {
      const firstDayCol = Math.min(...Object.values(dayColumnMap));
      timeCol = Math.max(0, firstDayCol - 1);
    }

    // ---- 3. Parse data rows ----
    const timeRx = /(\d{1,2}):(\d{2})\s*(?:AM|PM)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(?:AM|PM)?/i;
    const slotsSeen = new Map();

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.length) continue;

      const timeCell = row[timeCol] || row[0] || "";
      const timeMatch = timeCell.match(timeRx);
      if (!timeMatch) continue;

      const start = to24h(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), timeCell);
      const end = to24h(parseInt(timeMatch[3], 10), parseInt(timeMatch[4], 10), timeCell);
      const slotKey = `${start}-${end}`;

      if (!slotsSeen.has(slotKey)) {
        slotsSeen.set(slotKey, {
          start, end,
          label: guessSlotLabel(start, end),
        });
      }

            // Also skip column that contains "No. of Min." header
      const minColIdx = (rows[headerRowIdx] || []).findIndex(c =>
        /no\.?\s*of\s*min|minutes/i.test(c || "")
      );

      for (const [day, col] of Object.entries(dayColumnMap)) {
        let cell = row[col] || "";
        if (!cell || !cell.trim()) continue;

        // Skip if this is the minutes column (safety)
        if (col === minColIdx) continue;

        // Skip if cell looks like a duration (60 minutes, 25 min, etc.)
        if (/^\d+\s*(min|minutes?|mins?)\b/i.test(cell.trim())) continue;

        // Detect row-spanning filler (FLAG CEREMONY, LUNCH, etc.)
        const upper = cell.toUpperCase().trim();
        if (/^(FLAG|HEALTH BREAK|LUNCH BREAK|RECESS|CLASSROOM|ZONE|CLEANING)/i.test(upper)) {
          continue;
        }

        const parsed = parseCellContent(cell);
        if (!parsed) continue;

        result.entries.push({
          day,
          slotStart: start,
          slotEnd: end,
          subject: parsed.subject,
          teacher: parsed.teacher,
          specialization: parsed.specialization,
        });
      }
    }

    // ---- Compile ----
    result.timeSlots = Array.from(slotsSeen.values()).sort((a, b) => a.start.localeCompare(b.start));
    result.stats.slotsFound = result.timeSlots.length;
    result.stats.entriesFound = result.entries.length;

    return result;
  }

  // ============================================================
  // PARSER — TEXT LINES (fallback for pasted text / PDFs)
  // ============================================================
  function parseText(text, opts = {}) {
    const lines = String(text).split(/\r?\n/).map(cleanLine).filter(Boolean);
    return parseLines(lines, opts);
  }

  function parseLines(lines, opts = {}) {
    const result = {
      classLabel: null, schoolYear: null, adviser: null,
      timeSlots: [], entries: [], warnings: [],
      stats: { linesRead: lines.length, daysFound: 0, slotsFound: 0, entriesFound: 0 },
    };

    // Find day header row
    const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const DAY_RE = [/\bMONDAY\b|\bMON\b/i, /\bTUESDAY\b|\bTUE\b/i, /\bWEDNESDAY\b|\bWED\b/i, /\bTHURSDAY\b|\bTHU\b/i, /\bFRIDAY\b|\bFRI\b/i];

    let dayRowIndex = -1, dayMap = {};
    for (let i = 0; i < lines.length; i++) {
      let count = 0;
      const map = {};
      for (let d = 0; d < DAY_RE.length; d++) {
        if (DAY_RE[d].test(lines[i])) { count++; map[DAY_NAMES[d]] = true; }
      }
      if (count >= 3) { dayRowIndex = i; dayMap = map; break; }
    }

    if (dayRowIndex === -1) {
      result.warnings.push("Could not find a header row with days.");
      return result;
    }

    result.stats.daysFound = Object.keys(dayMap).length;
    const timeRx = /(\d{1,2}):(\d{2})\s*(?:AM|PM)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(?:AM|PM)?/i;
    const slotsSeen = new Map();

    for (let i = dayRowIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const timeMatch = line.match(timeRx);
      if (!timeMatch) continue;

      const start = to24h(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), line);
      const end = to24h(parseInt(timeMatch[3], 10), parseInt(timeMatch[4], 10), line);
      const slotKey = `${start}-${end}`;

      if (!slotsSeen.has(slotKey)) {
        slotsSeen.set(slotKey, { start, end, label: guessSlotLabel(start, end) });
      }

      // Split rest of line into cells
      const rest = line.replace(timeRx, "").trim();
      const cells = rest.split(/\t|\s{3,}/).filter(c => c.trim());
      if (!cells.length) continue;

      const days = Object.keys(dayMap).filter(k => dayMap[k]);
      for (let d = 0; d < days.length; d++) {
        const cell = cells[d] || "";
        if (!cell.trim()) continue;

        const parsed = parseCellContent(cell);
        if (!parsed) continue;

        result.entries.push({
          day: days[d],
          slotStart: start,
          slotEnd: end,
          subject: parsed.subject,
          teacher: parsed.teacher,
          specialization: parsed.specialization,
        });
      }
    }

    result.timeSlots = Array.from(slotsSeen.values()).sort((a, b) => a.start.localeCompare(b.start));
    result.stats.slotsFound = result.timeSlots.length;
    result.stats.entriesFound = result.entries.length;
    return result;
  }

  // ------------------------------------------------------------
  // PARSE ONE CELL — extract subject, teacher, spec
  // ------------------------------------------------------------
  function parseCellContent(cell) {
    if (!cell || !cell.trim()) return null;
    let s = String(cell).replace(/\s+/g, " ").trim();

    // Skip obvious non-subject cells
    if (/^(FLAG|HEALTH BREAK|LUNCH|RECESS|CLASSROOM|ZONE|CLEANING)/i.test(s)) return null;

    // Cell may contain: "HGP\nJoela P. Lunag" or "HGP Joela P. Lunag"
    let subject = "";
    let teacher = "";

    // Newlines were preserved by our extractor
    if (s.includes("\n")) {
      const parts = s.split("\n").map(x => x.trim()).filter(Boolean);
      subject = parts[0] || "";
      teacher = parts.slice(1).join(" ");
    } else {
      // Try splitting on last two capitalized words (heuristic)
      const parts = s.split(/\s{2,}/).map(x => x.trim()).filter(Boolean);
      if (parts.length >= 2) {
        subject = parts[0];
        teacher = parts.slice(1).join(" ");
      } else {
        subject = s;
      }
    }

    // Clean subject
    subject = subject.replace(/^[●○•\-\*]\s*/, "").trim();
    teacher = teacher.replace(/^(Teacher|Tchr)[:\s]+/i, "").trim();

    // Detect specialization for TLE
    let spec = "";
    const specMatch = subject.match(/(Cookery|Dressmaking|Electronics|Carpentry|ICT|Automotive|Welding|Plumbing|Masonry|AFA|FCS|IA)/i);
    if (specMatch) spec = specMatch[1];

    return { subject, teacher, specialization: spec };
  }

  // ------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------
  function to24h(h, m, context) {
    const lower = context.toLowerCase();
    const isPm = /\bpm\b/.test(lower);
    const isAm = /\bam\b/.test(lower);
    let hours = h;
    if (isPm && hours < 12) hours += 12;
    if (!isAm && !isPm && hours >= 1 && hours <= 7) hours += 12; // assume afternoon
    return `${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function guessSlotLabel(start, end) {
    if (start === "07:20" && end === "07:45") return "Flag Ceremony";
    if (start === "09:45" && end === "10:00") return "Health Break";
    if (start === "12:00" && end === "13:00") return "Lunch Break";
    if (start === "16:00" && end === "17:00") return "Aral Program";
    return `${start} - ${end}`;
  }

  // ------------------------------------------------------------
  // PUBLIC API
  // ------------------------------------------------------------
  window.ProgramParser = { parse, parseRows, parseText, parseLines };
})();