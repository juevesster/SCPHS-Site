// ============================================================
// bulk-tools.js
// Three bulk operations for SCPHS admin:
//   1. Word (.docx) → Excel (.xlsx) converter (many files → 1 workbook)
//   2. Multi-class Excel import (1 workbook, many sheets → many classes)
//   3. Bulk Copy Terms (Term 1 → Term 2 & 3 for many classes at once)
// ============================================================

(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  // ============================================================
  // LIBRARY LOADERS
  // ============================================================
  async function ensureSheetJS() {
    if (window.XLSX) return;
    await loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");
  }
  async function ensureMammoth() {
    if (window.mammoth) return;
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
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

  // ============================================================
  // MAIN ENTRY
  // ============================================================
  function init() {
    const main = document.getElementById("bkMain");
    if (!main) return;

    main.innerHTML = `
      <div class="bk-tabs">
        <button class="bk-tab active" data-tab="word-to-excel">
          <span class="ico">📄</span> Word → Excel
        </button>
        <button class="bk-tab" data-tab="bulk-import">
          <span class="ico">📤</span> Multi-Class Import
        </button>
        <button class="bk-tab" data-tab="bulk-copy">
          <span class="ico">📋</span> Bulk Copy Terms
        </button>
      </div>

      <div id="tabContent"></div>
    `;

    document.querySelectorAll(".bk-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".bk-tab").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderTab(btn.dataset.tab);
      });
    });

    renderTab("word-to-excel");
  }

  function renderTab(tab) {
    const host = document.getElementById("tabContent");
    if (!host) return;

    if (tab === "word-to-excel") renderWordToExcel(host);
    else if (tab === "bulk-import") renderBulkImport(host);
    else if (tab === "bulk-copy") renderBulkCopy(host);
  }

  // ============================================================
  // TAB 1 — WORD → EXCEL CONVERTER
  // ============================================================
  function renderWordToExcel(host) {
    host.innerHTML = `
      <div class="bk-card">
        <h2>📄 Word → Excel Converter</h2>
        <p class="sub">
          Drop all your Word (.docx) class program files here. The system will read each one and
          bundle them into a single Excel workbook — one sheet per class. Then you can use
          <strong>Multi-Class Import</strong> to load everything at once.
        </p>

        <div class="bk-info">
          <strong>💡 How it works:</strong>
          <ol>
            <li>Drop multiple <code>.docx</code> files below</li>
            <li>System extracts the schedule table from each file</li>
            <li>Combines them into one <code>.xlsx</code> — one sheet per class</li>
            <li>Download the combined file</li>
          </ol>
        </div>

        <div class="bk-drop" id="w2eDrop">
          <div class="bk-drop-icon">📄</div>
          <div class="bk-drop-title">Drop .docx files here</div>
          <div class="bk-drop-sub">or click to browse · multiple files supported</div>
          <input type="file" id="w2eInput" accept=".docx" multiple style="display:none;" />
        </div>

        <div id="w2eFileList" style="display:none;"></div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">
          <button class="bk-btn success" id="w2eConvertBtn" disabled>🔄 Convert to Excel</button>
          <button class="bk-btn outline" id="w2eClearBtn">Clear Files</button>
        </div>

        <div id="w2eStatus"></div>
      </div>
    `;

    const dropZone = $("w2eDrop");
    const fileInput = $("w2eInput");
    const listHost = $("w2eFileList");
    const convertBtn = $("w2eConvertBtn");
    const clearBtn = $("w2eClearBtn");
    const status = $("w2eStatus");

    let files = [];

    function renderFileList() {
      if (!files.length) {
        listHost.style.display = "none";
        convertBtn.disabled = true;
        return;
      }
      listHost.style.display = "block";
      listHost.innerHTML = `
        <div class="bk-file-list">
          ${files.map((f, i) => `
            <div class="bk-file-item">
              <span class="bk-file-name">📄 ${esc(f.name)}</span>
              <span style="color:#6b7280;font-size:11px;">${(f.size / 1024).toFixed(1)} KB</span>
            </div>
          `).join("")}
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:12px;">
          <strong>${files.length}</strong> file${files.length > 1 ? "s" : ""} ready to convert
        </div>
      `;
      convertBtn.disabled = false;
    }

    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("dragover"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
    dropZone.addEventListener("drop", e => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith(".docx"));
      files.push(...dropped);
      renderFileList();
    });

    fileInput.addEventListener("change", e => {
      const selected = Array.from(e.target.files).filter(f => f.name.toLowerCase().endsWith(".docx"));
      files.push(...selected);
      renderFileList();
      fileInput.value = "";
    });

    clearBtn.addEventListener("click", () => {
      files = [];
      renderFileList();
      status.innerHTML = "";
    });

    convertBtn.addEventListener("click", async () => {
      if (!files.length) return;
      convertBtn.disabled = true;
      convertBtn.textContent = "Converting…";

      status.innerHTML = `<div class="bk-info">📄 Reading ${files.length} Word file${files.length > 1 ? "s" : ""}…</div>`;

      try {
        await ensureSheetJS();
        await ensureMammoth();

        const wb = window.XLSX.utils.book_new();
        let successful = 0, failed = 0;

        for (const file of files) {
          try {
            const sheetName = guessClassFromFilename(file.name);
            const rows = await extractWordTable(file);
            if (!rows || !rows.length) throw new Error("No table found");

            const sheet = window.XLSX.utils.aoa_to_sheet(rows);
            // Ensure sheet name is unique and valid (Excel limit 31 chars)
            const safeName = makeUniqueSheetName(wb.SheetNames, sheetName);
            window.XLSX.utils.book_append_sheet(wb, sheet, safeName);
            successful++;
          } catch (e) {
            console.error("Failed to convert:", file.name, e);
            failed++;
          }
        }

        if (!successful) {
          throw new Error("No files could be converted");
        }

        // Download
        const filename = `SCPHS-Programs-${new Date().toISOString().slice(0,10)}.xlsx`;
        window.XLSX.writeFile(wb, filename);

        status.innerHTML = `
          <div class="bk-success">
            ✅ Converted <strong>${successful}</strong> file${successful > 1 ? "s" : ""}!
            ${failed ? `<br>⚠️ ${failed} file${failed > 1 ? "s" : ""} failed (check file format)` : ""}
            <br><br>
            📥 Downloaded: <strong>${filename}</strong>
            <br><br>
            Next step: go to <strong>📤 Multi-Class Import</strong> tab and upload this file.
          </div>
        `;
      } catch (e) {
        console.error(e);
        status.innerHTML = `<div class="bk-error">⚠️ ${esc(e.message || "Conversion failed")}</div>`;
      } finally {
        convertBtn.disabled = false;
        convertBtn.textContent = "🔄 Convert to Excel";
      }
    });
  }

  async function extractWordTable(file) {
    const buf = await file.arrayBuffer();
    const result = await window.mammoth.convertToHtml({ arrayBuffer: buf });
    const html = result.value || "";

    const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
    if (!tables.length) return null;

    // Pick biggest table
    let biggest = "", maxCells = 0;
    for (const t of tables) {
      const cellCount = (t.match(/<td|<th/gi) || []).length;
      if (cellCount > maxCells) { maxCells = cellCount; biggest = t; }
    }

    const rows = [];
    const trMatches = biggest.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    for (const tr of trMatches) {
      const cells = [];
      const cellMatches = tr.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || [];
      for (const cell of cellMatches) {
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

  function guessClassFromFilename(name) {
    // Strip extension
    let base = name.replace(/\.docx?$/i, "").trim();
    // Strip common prefixes/suffixes
    base = base.replace(/^(SCPHS[-_ ]?)/i, "");
    base = base.replace(/[-_ ](class[-_ ]?program|program|bow|sy\d{4}[-_ ]?\d{4})$/i, "").trim();
    return base.slice(0, 31) || "Sheet";
  }

  function makeUniqueSheetName(existing, wanted) {
    if (!existing.includes(wanted)) return wanted;
    let i = 2;
    let candidate = `${wanted} (${i})`;
    while (existing.includes(candidate)) {
      i++;
      candidate = `${wanted} (${i})`;
    }
    return candidate;
  }

  // ============================================================
  // TAB 2 — MULTI-CLASS IMPORT
  // ============================================================
  function renderBulkImport(host) {
    const classes = window.bkClasses || [];

    host.innerHTML = `
      <div class="bk-card">
        <h2>📤 Multi-Class Import</h2>
        <p class="sub">
          Upload one Excel file with <strong>multiple sheets</strong>. Each sheet should be one class's program.
          The system matches sheet names to class labels and imports everything at once.
        </p>

        <div class="bk-info">
          <strong>💡 Sheet name → Class name matching:</strong>
          <ul>
            <li>Sheet <code>Grade 7 Diamond</code> → class "Grade 7 Diamond" ✅</li>
            <li>Sheet <code>G7-Diamond</code> → normalizes and matches "Grade 7 Diamond" ✅</li>
            <li>Sheet <code>Random Name</code> → you'll be asked to map it manually</li>
          </ul>
        </div>

        <div class="bk-field">
          <label>Term</label>
          <select id="biTerm">
            <option value="1" selected>Term 1</option>
            <option value="2">Term 2</option>
            <option value="3">Term 3</option>
          </select>
        </div>

        <div class="bk-drop" id="biDrop">
          <div class="bk-drop-icon">📊</div>
          <div class="bk-drop-title">Drop one .xlsx file here</div>
          <div class="bk-drop-sub">or click to browse · multi-sheet workbook required</div>
          <input type="file" id="biInput" accept=".xlsx,.xls" style="display:none;" />
        </div>

        <div id="biPreview"></div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
          <button class="bk-btn primary" id="biParseBtn" disabled>🔍 Parse Workbook</button>
          <button class="bk-btn success" id="biImportBtn" style="display:none;">✅ Import All</button>
        </div>

        <div id="biStatus"></div>
      </div>
    `;

    const dropZone = $("biDrop");
    const fileInput = $("biInput");
    const parseBtn = $("biParseBtn");
    const importBtn = $("biImportBtn");
    const preview = $("biPreview");
    const status = $("biStatus");

    let pendingFile = null;
    let parsedSheets = null;

    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("dragover"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
    dropZone.addEventListener("drop", e => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      const f = Array.from(e.dataTransfer.files).find(f => /\.(xlsx|xls)$/i.test(f.name));
      if (f) setPendingFile(f);
    });

    fileInput.addEventListener("change", e => {
      const f = e.target.files[0];
      if (f) setPendingFile(f);
    });

    function setPendingFile(file) {
      pendingFile = file;
      parseBtn.disabled = false;
      dropZone.querySelector(".bk-drop-title").textContent = `📊 ${file.name}`;
      dropZone.querySelector(".bk-drop-sub").textContent = `${(file.size / 1024).toFixed(1)} KB · click Parse Workbook`;
      preview.innerHTML = "";
      importBtn.style.display = "none";
    }

    parseBtn.addEventListener("click", async () => {
      if (!pendingFile) return;
      parseBtn.disabled = true;
      parseBtn.textContent = "Parsing…";
      status.innerHTML = "";

      try {
        await ensureSheetJS();
        const buf = await pendingFile.arrayBuffer();
        const wb = window.XLSX.read(buf, { type: "array" });

        const sheets = wb.SheetNames.map(name => {
          const sheet = wb.Sheets[name];
          const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
          const cleaned = rows.map(row => row.map(c => c == null ? "" : String(c).trim()));
          return { name, rows: cleaned };
        });

        parsedSheets = sheets.map(s => {
          const matched = matchSheetToClass(s.name, classes);
          const { entries, warnings } = extractEntriesFromRows(s.rows);
          return {
            sheetName: s.name,
            classId: matched?.classId || null,
            className: matched?.className || null,
            matchScore: matched?.score || 0,
            entries,
            warnings,
          };
        });

        renderPreview();
        importBtn.style.display = parsedSheets.some(s => s.entries.length) ? "inline-flex" : "none";
      } catch (e) {
        console.error(e);
        status.innerHTML = `<div class="bk-error">⚠️ ${esc(e.message || "Parse failed")}</div>`;
      } finally {
        parseBtn.disabled = false;
        parseBtn.textContent = "🔍 Parse Workbook";
      }
    });

    function renderPreview() {
      if (!parsedSheets) return;
      const totalEntries = parsedSheets.reduce((sum, s) => sum + s.entries.length, 0);
      const matchedCount = parsedSheets.filter(s => s.classId).length;

      preview.innerHTML = `
        <div class="bk-success" style="margin-top:16px;">
          ✅ Parsed <strong>${parsedSheets.length}</strong> sheet${parsedSheets.length > 1 ? "s" : ""},
          <strong>${totalEntries}</strong> total entries.
          <strong>${matchedCount}</strong> matched to classes.
        </div>

        <div style="overflow-x:auto;margin-top:14px;">
          <table class="bk-preview-table">
            <thead>
              <tr>
                <th>Sheet Name</th>
                <th>Matched Class</th>
                <th>Entries</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${parsedSheets.map(s => `
                <tr>
                  <td><strong>${esc(s.sheetName)}</strong></td>
                  <td>${s.className ? `✅ ${esc(s.className)}` : `<span style="color:#dc2626;">❌ no match</span>`}</td>
                  <td>${s.entries.length}</td>
                  <td>
                    ${s.entries.length === 0 ? `<span style="color:#dc2626;">⚠️ no entries</span>` : ""}
                    ${!s.classId ? `<span style="color:#dc2626;">⚠️ unmapped</span>` : ""}
                    ${s.classId && s.entries.length ? `<span style="color:#059669;">✅ ready</span>` : ""}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        ${matchedCount < parsedSheets.length ? `
          <div class="bk-warn" style="margin-top:14px;">
            ⚠️ <strong>${parsedSheets.length - matchedCount}</strong> sheet(s) couldn't be matched to a class.
            Rename the sheets to match class labels (e.g., "Grade 7 Diamond") and re-parse.
          </div>
        ` : ""}
      `;
    }

    importBtn.addEventListener("click", async () => {
      if (!parsedSheets) return;

      const ready = parsedSheets.filter(s => s.classId && s.entries.length);
      if (!ready.length) {
        window.bkToast("⚠️ No sheets ready to import", "error");
        return;
      }

      const term = parseInt($("biTerm").value, 10);
      const totalEntries = ready.reduce((sum, s) => sum + s.entries.length, 0);

      if (!confirm(`Import ${totalEntries} entries across ${ready.length} classes into Term ${term}?\n\nDuplicates will be skipped.`)) return;

      importBtn.disabled = true;
      importBtn.textContent = "Importing…";

      try {
        const result = await window.BulkImport.importSheets(ready, term, (current, total, label) => {
          status.innerHTML = `<div class="bk-info">⏳ Importing class ${current} of ${total}: <strong>${esc(label)}</strong></div>`;
        });

        status.innerHTML = `
          <div class="bk-success">
            ✅ <strong>Import complete!</strong><br><br>
            📚 Classes imported: <strong>${result.classesImported}</strong><br>
            ✅ Entries inserted: <strong>${result.inserted}</strong><br>
            ⏭️ Skipped (duplicates): <strong>${result.skipped}</strong>
            ${result.errors ? `<br>❌ Errors: <strong>${result.errors}</strong>` : ""}
          </div>
        `;

        window.bkToast(`✓ Imported ${result.inserted} entries across ${result.classesImported} classes`, "success");
      } catch (e) {
        console.error(e);
        status.innerHTML = `<div class="bk-error">⚠️ ${esc(e.message || "Import failed")}</div>`;
      } finally {
        importBtn.disabled = false;
        importBtn.textContent = "✅ Import All";
      }
    });
  }

  function matchSheetToClass(sheetName, classes) {
    if (!classes?.length) return null;

    const normalize = s => String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const target = normalize(sheetName);

    // 1. Exact normalize match
    for (const cls of classes) {
      const label = normalize(cls.classLabel);
      if (label === target) {
        return { classId: cls.id, className: cls.classLabel, score: 100 };
      }
    }

    // 2. Contains match — "grade7diamond" contains "g7diamond"
    const targetCompact = target
      .replace(/grade(\d+)/g, "g$1")
      .replace(/(\d+)/g, "$1");

    for (const cls of classes) {
      const label = normalize(cls.classLabel)
        .replace(/grade(\d+)/g, "g$1");

      if (label === targetCompact || targetCompact.includes(label) || label.includes(targetCompact)) {
        return { classId: cls.id, className: cls.classLabel, score: 80 };
      }
    }

    // 3. Word-by-word: all words in sheet name appear in class label
    const sheetWords = String(sheetName).toLowerCase().split(/[\s\-_]+/).filter(Boolean);
    let best = null;
    for (const cls of classes) {
      const labelWords = String(cls.classLabel || "").toLowerCase().split(/[\s\-_]+/).filter(Boolean);
      const matches = sheetWords.filter(w => labelWords.some(lw => lw.includes(w) || w.includes(lw)));
      const score = matches.length / Math.max(sheetWords.length, labelWords.length);
      if (!best || score > best.score) {
        best = { classId: cls.id, className: cls.classLabel, score: Math.round(score * 100) };
      }
    }

    if (best && best.score >= 50) return best;
    return null;
  }

  function extractEntriesFromRows(rows) {
    const entries = [];
    const warnings = [];

    // Find header row with day names
    const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const DAY_RE = [
      /\bMONDAY\b|\bMON\b/i,
      /\bTUESDAY\b|\bTUE\b/i,
      /\bWEDNESDAY\b|\bWED\b/i,
      /\bTHURSDAY\b|\bTHU\b/i,
      /\bFRIDAY\b|\bFRI\b/i,
    ];

    let headerRowIdx = -1;
    let dayColMap = {};

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      let found = 0;
      const map = {};
      for (let c = 0; c < row.length; c++) {
        for (let d = 0; d < DAY_RE.length; d++) {
          if (DAY_RE[d].test(row[c])) { found++; map[DAY_NAMES[d]] = c; }
        }
      }
      if (found >= 3) {
        headerRowIdx = r;
        dayColMap = map;
        break;
      }
    }

    if (headerRowIdx === -1) {
      warnings.push("No header row with days (Monday-Friday) found.");
      return { entries, warnings };
    }

    // Find time column
    const timeRx = /(\d{1,2}):(\d{2})\s*(?:AM|PM)?\s*[-–—]\s*(\d{1,2}):(\d{2})/i;
    let timeCol = -1;
    for (let r = headerRowIdx + 1; r < Math.min(rows.length, headerRowIdx + 5); r++) {
      for (let c = 0; c < rows[r].length; c++) {
        if (timeRx.test(rows[r][c])) { timeCol = c; break; }
      }
      if (timeCol >= 0) break;
    }
    if (timeCol === -1) {
      const firstDayCol = Math.min(...Object.values(dayColMap));
      timeCol = Math.max(0, firstDayCol - 1);
    }

    // Detect "No. of Min." column to skip
    const minColIdx = (rows[headerRowIdx] || []).findIndex(c =>
      /no\.?\s*of\s*min|minutes/i.test(c || "")
    );

    // Parse data rows
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.length) continue;

      const timeCell = row[timeCol] || row[0] || "";
      const tMatch = timeCell.match(timeRx);
      if (!tMatch) continue;

      const start = to24h(parseInt(tMatch[1], 10), parseInt(tMatch[2], 10), timeCell);
      const end = to24h(parseInt(tMatch[3], 10), parseInt(tMatch[4], 10), timeCell);

      for (const [day, col] of Object.entries(dayColMap)) {
        let cell = row[col] || "";
        if (!cell || !cell.trim()) continue;
        if (col === minColIdx) continue;
        if (/^\d+\s*(min|minutes?|mins?)\b/i.test(cell.trim())) continue;

        const upper = cell.toUpperCase().trim();
        if (/^(FLAG|HEALTH BREAK|LUNCH BREAK|RECESS|CLASSROOM|ZONE|CLEANING)/i.test(upper)) continue;

        const parsed = parseCell(cell);
        if (!parsed) continue;

        entries.push({
          day,
          slotStart: start,
          slotEnd: end,
          subject: parsed.subject,
          teacher: parsed.teacher,
          specialization: parsed.spec,
        });
      }
    }

    return { entries, warnings };
  }

  function parseCell(cell) {
    if (!cell || !cell.trim()) return null;
    let s = String(cell).replace(/\s+/g, " ").trim();
    if (/^(FLAG|HEALTH BREAK|LUNCH|RECESS|CLASSROOM|ZONE|CLEANING)/i.test(s)) return null;

    let subject = "", teacher = "";

    if (s.includes("\n")) {
      const parts = s.split("\n").map(x => x.trim()).filter(Boolean);
      subject = parts[0] || "";
      teacher = parts.slice(1).join(" ");
    } else {
      const parts = s.split(/\s{2,}/).map(x => x.trim()).filter(Boolean);
      if (parts.length >= 2) {
        subject = parts[0];
        teacher = parts.slice(1).join(" ");
      } else {
        subject = s;
      }
    }

    subject = subject.replace(/^[●○•\-\*]\s*/, "").trim();
    teacher = teacher.replace(/^(Teacher|Tchr)[:\s]+/i, "").trim();

    let spec = "";
    const specMatch = subject.match(/(Cookery|Dressmaking|Electronics|Carpentry|ICT|Automotive|Welding|Plumbing|Masonry|AFA|FCS|IA)/i);
    if (specMatch) spec = specMatch[1];

    return { subject, teacher, spec };
  }

  function to24h(h, m, context) {
    const lower = String(context).toLowerCase();
    const isPm = /\bpm\b/.test(lower);
    const isAm = /\bam\b/.test(lower);
    let hours = h;
    if (isPm && hours < 12) hours += 12;
    if (!isAm && !isPm && hours >= 1 && hours <= 6) hours += 12;
    return `${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // ============================================================
  // TAB 3 — BULK COPY TERMS
  // ============================================================
  function renderBulkCopy(host) {
    const classes = window.bkClasses || [];

    // Group classes by grade for easy pickers
    const byGrade = {};
    classes.forEach(c => {
      const grade = c.gradeLevel || "Other";
      if (!byGrade[grade]) byGrade[grade] = [];
      byGrade[grade].push(c);
    });

    host.innerHTML = `
      <div class="bk-card">
        <h2>📋 Bulk Copy Terms</h2>
        <p class="sub">
          Copy all entries from one term to another, for multiple classes at once.
          Duplicates are skipped automatically. Term 1 stays as history.
        </p>

        <div class="bk-info">
          <strong>💡 Common use:</strong> After importing Term 1 for all classes,
          copy Term 1 → Term 2 & Term 3 in one click. Then Admin edits the differences.
        </div>

        <div class="bk-field">
          <label>Copy FROM</label>
          <select id="bcFrom">
            <option value="1" selected>Term 1</option>
            <option value="2">Term 2</option>
            <option value="3">Term 3</option>
          </select>
        </div>

        <div class="bk-field">
          <label>Copy TO</label>
          <div class="bk-checkbox-group">
            <label><input type="checkbox" id="bcTo2" /> Term 2</label>
            <label><input type="checkbox" id="bcTo3" /> Term 3</label>
          </div>
          <div class="hint">Existing entries with the same day + slot + subject + teacher will be skipped.</div>
        </div>

        <div class="bk-field">
          <label>Scope</label>
          <select id="bcScope">
            <option value="all" selected>All classes (${classes.length})</option>
            ${Object.entries(byGrade).sort().map(([grade, list]) =>
              `<option value="grade:${esc(grade)}">${esc(grade)} only (${list.length} classes)</option>`
            ).join("")}
            <option value="custom">Custom selection</option>
          </select>
        </div>

        <div id="bcCustomScope" class="bk-field" style="display:none;">
          <label>Pick Classes</label>
          <div style="max-height:220px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;padding:10px;">
            ${classes.map(c => `
              <label style="display:flex;align-items:center;gap:8px;padding:6px;font-size:13px;cursor:pointer;">
                <input type="checkbox" class="bcClassPick" value="${esc(c.id)}" />
                ${esc(c.classLabel)}
              </label>
            `).join("")}
          </div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
          <button class="bk-btn warning" id="bcRunBtn">📋 Run Bulk Copy</button>
        </div>

        <div id="bcStatus"></div>
      </div>
    `;

    $("bcScope").addEventListener("change", e => {
      $("bcCustomScope").style.display = e.target.value === "custom" ? "block" : "none";
    });

    $("bcRunBtn").addEventListener("click", async () => {
      const fromTerm = parseInt($("bcFrom").value, 10);
      const toTerms = [];
      if ($("bcTo2").checked) toTerms.push(2);
      if ($("bcTo3").checked) toTerms.push(3);

      if (!toTerms.length) {
        window.bkToast("⚠️ Pick at least one destination term", "error");
        return;
      }
      if (toTerms.includes(fromTerm)) {
        window.bkToast("⚠️ Cannot copy a term into itself", "error");
        return;
      }

      // Resolve scope
      const scope = $("bcScope").value;
      let targetClasses = [];

      if (scope === "all") {
        targetClasses = classes;
      } else if (scope.startsWith("grade:")) {
        const grade = scope.slice(6);
        targetClasses = classes.filter(c => (c.gradeLevel || "Other") === grade);
      } else if (scope === "custom") {
        const pickedIds = Array.from(document.querySelectorAll(".bcClassPick:checked")).map(cb => cb.value);
        targetClasses = classes.filter(c => pickedIds.includes(c.id));
      }

      if (!targetClasses.length) {
        window.bkToast("⚠️ No classes selected", "error");
        return;
      }

      const termList = toTerms.map(t => `Term ${t}`).join(" & ");
      if (!confirm(`Copy Term ${fromTerm} → ${termList} for ${targetClasses.length} classes?\n\nDuplicates will be skipped.`)) return;

      const btn = $("bcRunBtn");
      btn.disabled = true;
      btn.textContent = "Copying…";

      const status = $("bcStatus");
      status.innerHTML = `<div class="bk-info">⏳ Starting…</div>`;

      try {
        const result = await window.BulkImport.bulkCopyTerms(
          targetClasses,
          fromTerm,
          toTerms,
          (current, total, label, stats) => {
            status.innerHTML = `
              <div class="bk-info">
                ⏳ Processing class <strong>${current}</strong> of <strong>${total}</strong>:
                ${esc(label)}
                <br>
                <span style="font-size:12px;color:#6b7280;">
                  ✅ Copied: <strong>${stats.copied}</strong> ·
                  ⏭️ Skipped: <strong>${stats.skipped}</strong>
                </span>
              </div>
            `;
          }
        );

        status.innerHTML = `
          <div class="bk-success">
            ✅ <strong>Bulk Copy Complete!</strong><br><br>
            📚 Classes processed: <strong>${result.classesProcessed}</strong><br>
            ✅ Total entries copied: <strong>${result.totalCopied}</strong><br>
            ⏭️ Total skipped (duplicates): <strong>${result.totalSkipped}</strong>
            ${result.errors ? `<br>❌ Errors: <strong>${result.errors}</strong>` : ""}
          </div>
        `;

        window.bkToast(`✓ Copied ${result.totalCopied} entries across ${result.classesProcessed} classes`, "success");
      } catch (e) {
        console.error(e);
        status.innerHTML = `<div class="bk-error">⚠️ ${esc(e.message || "Copy failed")}</div>`;
      } finally {
        btn.disabled = false;
        btn.textContent = "📋 Run Bulk Copy";
      }
    });
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  window.BulkTools = { init, renderTab };
})();