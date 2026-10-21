// xls-parser.js — Parser for LIS-generated SF1 .xls files.
// Supports BOTH JHS (SF1) and SHS (SF1-SHS) formats.
// Uses SheetJS (loaded via CDN) to read the binary xls.

// ============================================================
// COLUMN MAPS
// ============================================================

// Junior High School (SF1)
const JHS_COL = {
  LRN:               0,   // A
  NAME:              2,   // C
  SEX:               6,   // G
  BIRTHDATE:         7,   // H
  AGE:               9,   // J
  MOTHER_TONGUE:     11,  // L
  IP:                13,  // N
  RELIGION:          14,  // O
  ADDR_HOUSE:        15,  // P
  ADDR_BARANGAY:     17,  // R
  ADDR_MUNICIPALITY: 19,  // T
  ADDR_PROVINCE:     21,  // V
  FATHER:            27,  // AB
  MOTHER:            32,  // AG
  GUARDIAN:          37,  // AL
  GUARDIAN_REL:      42,  // AQ
  CONTACT:           44,  // AS
  MODALITY:          46,  // AU
  REMARKS:           47,  // AV
};

// Senior High School (SF1-SHS) — based on the actual Excel layout
// from the 12-ANGELITE sample file.
const SHS_COL = {
  LRN:               0,   // A
  NAME:              2,   // C
  SEX:               10,  // K
  BIRTHDATE:         11,  // L
  AGE:               14,  // O
  RELIGION:          16,  // Q
  ADDR_HOUSE:        21,  // V
  ADDR_BARANGAY:     25,  // Z
  ADDR_MUNICIPALITY: 31,  // AF
  ADDR_PROVINCE:     33,  // AH
  FATHER:            36,  // AJ
  MOTHER:            41,  // AO
  GUARDIAN:          43,  // AQ
  GUARDIAN_REL:      47,  // AU
  CONTACT:           50,  // AX
  MODALITY:          52,  // AZ
  REMARKS:           54,  // BB
};

// ============================================================
// CELL HELPERS
// ============================================================
function cellStr(row, idx) {
  if (!row || idx == null) return "";
  const v = row[idx];
  if (v == null) return "";
  return String(v).trim();
}

function cellNum(row, idx) {
  if (!row || idx == null) return null;
  const v = row[idx];
  if (v == null || v === "") return null;
  const n = parseInt(String(v).replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? null : n;
}

// ============================================================
// NAME SPLITTER
// "LASTNAME,FIRSTNAME, MIDDLENAME" → parts
// ============================================================
function splitName(fullName) {
  const out = { lastName: "", firstName: "", middleName: "", fullName: fullName || "" };
  if (!fullName) return out;

  const parts = fullName.split(",").map(s => s.trim()).filter(s => s);
  out.lastName   = parts[0] || "";
  out.firstName  = parts[1] || "";
  out.middleName = parts[2] || "";
  out.fullName   = fullName.trim();
  return out;
}

// ============================================================
// ROW CLASSIFIERS
// ============================================================

// Detect marker rows like "<=== TOTAL MALE"
function isMarkerRow(row) {
  if (!row) return false;
  const joined = row.map(c => String(c || "")).join(" ").toLowerCase();
  return joined.includes("<===")
      || joined.includes("total male")
      || joined.includes("total female")
      || joined.includes("combined")
      || joined.includes("legend")
      || joined.includes("indicator");
}

// Detect if a row looks like a real student row (using a specific column map)
function isStudentRow(row, colMap) {
  if (!row || !row.length) return false;
  if (isMarkerRow(row)) return false;

  const lrn = cellStr(row, colMap.LRN);
  const name = cellStr(row, colMap.NAME);
  const sex = cellStr(row, colMap.SEX);

  // Valid LRN is exactly 12 digits
  if (!/^\d{12}$/.test(lrn)) return false;

  // Name must contain a comma AND be a reasonable length (real names are 5+ chars)
  if (!name.includes(",") || name.length < 5) return false;

  // Reject names that contain weird corruption characters (from broken Excel cells)
  // A real name only contains letters, commas, spaces, periods, hyphens, and apostrophes
  if (/[^A-Za-zÀ-ÿ\s,.'\-]/.test(name)) return false;

  // Sex must be M or F (case-insensitive)
  if (!/^[MF]$/i.test(sex) && !/^(MALE|FEMALE)$/i.test(sex)) return false;

  return true;
}

// ============================================================
// SINGLE STUDENT ROW → OBJECT
// ============================================================
function parseStudentRow(row, colMap) {
  const fullName = cellStr(row, colMap.NAME);
  const nameParts = splitName(fullName);

  // Normalize sex
  const sexRaw = cellStr(row, colMap.SEX).toUpperCase();
  const sex = sexRaw === "M" || sexRaw === "MALE" ? "M"
            : sexRaw === "F" || sexRaw === "FEMALE" ? "F"
            : sexRaw;

  // Clean remarks (may contain <br> tags)
  const remarksRaw = cellStr(row, colMap.REMARKS);
  const remarks = remarksRaw.replace(/<br\s*\/?>/gi, " | ").replace(/\s+/g, " ").trim();

  return {
    lrn:               cellStr(row, colMap.LRN),
    lastName:          nameParts.lastName,
    firstName:         nameParts.firstName,
    middleName:        nameParts.middleName,
    fullName:          nameParts.fullName,
    sex:               sex,
    birthDate:         cellStr(row, colMap.BIRTHDATE),
    age:               cellNum(row, colMap.AGE),
    motherTongue:      cellStr(row, colMap.MOTHER_TONGUE),
    ip:                cellStr(row, colMap.IP),
    religion:          cellStr(row, colMap.RELIGION),
    addressHouse:      cellStr(row, colMap.ADDR_HOUSE),
    addressBarangay:   cellStr(row, colMap.ADDR_BARANGAY),
    addressMunicipality: cellStr(row, colMap.ADDR_MUNICIPALITY),
    addressProvince:   cellStr(row, colMap.ADDR_PROVINCE),
    fatherName:        cellStr(row, colMap.FATHER),
    motherName:        cellStr(row, colMap.MOTHER),
    guardianName:      cellStr(row, colMap.GUARDIAN),
    guardianRelationship: cellStr(row, colMap.GUARDIAN_REL),
    contactNumber:     cellStr(row, colMap.CONTACT),
    learningModality:  cellStr(row, colMap.MODALITY),
    remarks:           remarks,
  };
}

// ============================================================
// FORMAT DETECTION
// ============================================================
function detectFormat(rows) {
  const scanLimit = Math.min(20, rows.length);
  for (let i = 0; i < scanLimit; i++) {
    const row = rows[i];
    if (!row) continue;
    const joined = row.map(c => String(c || "")).join(" ").toUpperCase();

    if (joined.includes("SENIOR HIGH") ||
        joined.includes("SF1-SHS") ||
        joined.includes("SCHOOL REGISTER FOR SENIOR HIGH")) {
      return "SHS";
    }
  }
  return "JHS";
}

// ============================================================
// HEADER EXTRACTION (School ID, SY, Grade, Section, etc.)
// ============================================================
function extractHeader(rows, format) {
  const info = { schoolId: "", schoolName: "", schoolYear: "",
                 gradeLevel: "", section: "", region: "", division: "",
                 semester: "", track: "" };

  const scanLimit = format === "SHS" ? Math.min(20, rows.length) : Math.min(10, rows.length);

  for (let i = 0; i < scanLimit; i++) {
    const row = rows[i];
    if (!row) continue;
    const joined = row.map(c => String(c || "")).join(" ").toLowerCase();

    // School ID
    if (joined.includes("school id") && !info.schoolId) {
      const idx = row.findIndex(c => String(c || "").toLowerCase().includes("school id"));
      for (let j = idx + 1; j < row.length; j++) {
        const v = cellStr(row, j);
        if (v && /^\d+$/.test(v)) { info.schoolId = v; break; }
      }
    }

    // Region
    if (joined.includes("region") && !info.region) {
      const idx = row.findIndex(c => String(c || "").toLowerCase().includes("region"));
      for (let j = idx + 1; j < row.length; j++) {
        const v = cellStr(row, j);
        if (v && !v.toLowerCase().includes("region")) { info.region = v; break; }
      }
    }

    // Division
    if (joined.includes("division") && !info.division) {
      const idx = row.findIndex(c => String(c || "").toLowerCase().includes("division"));
      for (let j = idx + 1; j < row.length; j++) {
        const v = cellStr(row, j);
        if (v && !v.toLowerCase().includes("division")) { info.division = v; break; }
      }
    }

    // School Name
    if (joined.includes("school name") && !info.schoolName) {
      const idx = row.findIndex(c => String(c || "").toLowerCase().includes("school name"));
      for (let j = idx + 1; j < row.length; j++) {
        const v = cellStr(row, j);
        if (v && !v.toLowerCase().includes("school name")) {
          info.schoolName = v;
          break;
        }
      }

      // Find School Year
      for (let j = idx + 1; j < row.length; j++) {
        if (String(row[j] || "").toLowerCase().includes("school year")) {
          for (let k = j + 1; k < row.length; k++) {
            const v = cellStr(row, k);
            if (v && /\d{4}\s*-\s*\d{4}/.test(v)) {
              info.schoolYear = v.replace(/\s+/g, "");
              break;
            }
          }
          break;
        }
      }

      // Find Grade Level
      for (let j = idx + 1; j < row.length; j++) {
        if (String(row[j] || "").toLowerCase().includes("grade level")) {
          for (let k = j + 1; k < row.length; k++) {
            const v = cellStr(row, k);
            if (v && v.toLowerCase().includes("grade")) {
              const m = v.match(/grade\s*\d+/i);
              info.gradeLevel = m ? m[0].replace(/grade/i, "Grade").trim() : v;
              break;
            }
          }
          break;
        }
      }
    }

    // SHS-specific: Semester, Section, Track and Strand
    if (format === "SHS") {
      if (joined.includes("semester") && !info.semester) {
        const idx = row.findIndex(c => String(c || "").toLowerCase().includes("semester"));
        for (let j = idx + 1; j < row.length; j++) {
          const v = cellStr(row, j);
          if (v && !v.toLowerCase().includes("semester")) {
            info.semester = v;
            break;
          }
        }
      }

      if (joined.includes("section") && !info.section) {
        const idx = row.findIndex(c => String(c || "").toLowerCase() === "section");
        if (idx >= 0) {
          for (let j = idx + 1; j < row.length; j++) {
            const v = cellStr(row, j);
            if (v) { info.section = v.toUpperCase(); break; }
          }
        }
      }

      if (joined.includes("track and strand") && !info.track) {
        const idx = row.findIndex(c => String(c || "").toLowerCase().includes("track"));
        if (idx >= 0) {
          for (let j = idx + 1; j < row.length; j++) {
            const v = cellStr(row, j);
            if (v && !v.toLowerCase().includes("track")) {
              info.track = v;
              break;
            }
          }
        }
      }
    }
  }

  return info;
}

// ============================================================
// MAIN PARSE FUNCTION
// ============================================================
export function parseLISFile(arrayBuffer) {
  if (typeof XLSX === "undefined") {
    throw new Error("SheetJS (XLSX) library not loaded. Add the CDN script first.");
  }

  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: "",
    blankrows: false,
  });

  const format = detectFormat(rows);
  const colMap = format === "SHS" ? SHS_COL : JHS_COL;
  console.log(`[xls-parser] Detected format: ${format}`);

  const header = extractHeader(rows, format);

  // Find student rows with total tracking
  const students = [];
  const seenLRNs = new Set(); // 🆕 Track duplicates
  let stopMarker = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const joined = row.map(c => String(c || "")).join(" ").toUpperCase();

    // 1. Check for Hard Stops (Only if we've already found students)
    if (students.length > 0) {
      const isCombinedMarker = joined.includes("COMBINED") && (joined.includes("<===") || joined.includes("==="));
      const isLegendRow = joined.includes("LEGEND:") || joined.includes("LEGEND ") || (joined.includes("INDICATOR") && joined.includes("CODE"));

      if (isCombinedMarker) {
        stopMarker = "COMBINED";
        break;
      }
      if (isLegendRow) {
        stopMarker = "LEGEND";
        break;
      }
    }

    // 2. Skip ALL marker/total rows (TOTAL MALE, TOTAL FEMALE, COMBINED, etc.)
    if (joined.includes("<===") ||
        joined.includes("TOTAL MALE") ||
        joined.includes("TOTAL FEMALE") ||
        joined.includes("COMBINED")) {
      continue;
    }

    // 3. Parse student rows
    if (isStudentRow(row, colMap)) {
      try {
        const student = parseStudentRow(row, colMap);
        if (student.lrn && student.lastName) {
          // 🆕 Only add if we haven't seen this LRN yet
          if (!seenLRNs.has(student.lrn)) {
            seenLRNs.add(student.lrn);
            students.push(student);
          } else {
            console.log(`[xls-parser] Skipping duplicate LRN: ${student.lrn}`);
          }
        }
      } catch (e) {
        console.warn(`[xls-parser] Skipped row ${i}:`, e.message);
      }
    }
  }

  console.log(`[xls-parser] Parsed ${students.length} unique students (stopped at: ${stopMarker || "end of file"})`);

  return {
    header,
    students,
    format,
    totalFound: students.length,
    maleCount: students.filter(s => s.sex === "M").length,
    femaleCount: students.filter(s => s.sex === "F").length,
  };
}