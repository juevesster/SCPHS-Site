// xls-parser.js — Parser for LIS-generated SF1 .xls files.
// Uses SheetJS (loaded via CDN) to read the binary xls.
// Returns an array of parsed student objects.

// ------------------------------------------------------------
// LIS column indices (from the SF1 format we've seen)
// ------------------------------------------------------------
const COL = {
  LRN:               0,   // A: LRN
  NAME:              2,   // C: NAME (Last, First, Middle)
  SEX:               6,   // G: M/F
  BIRTHDATE:         7,   // H: mm/dd/yyyy
  AGE:               9,   // J: Age as of 1st Friday June
  MOTHER_TONGUE:     11,  // L
  IP:                13,  // N: IP (Ethnic Group)
  RELIGION:          14,  // O
  ADDR_HOUSE:        15,  // P: House #/Street/Sitio/Purok
  ADDR_BARANGAY:     17,  // R: Barangay
  ADDR_MUNICIPALITY: 19,  // T: Municipality/City
  ADDR_PROVINCE:     21,  // V: Province
  FATHER:            27,  // AB: Father's Name
  MOTHER:            32,  // AG: Mother's Maiden Name
  GUARDIAN:          37,  // AL: Guardian Name
  GUARDIAN_REL:      42,  // AQ: Guardian Relationship
  CONTACT:           44,  // AS: Contact Number
  MODALITY:          46,  // AU: Learning Modality
  REMARKS:           47,  // AV: REMARKS
};

// ------------------------------------------------------------
// Cell value helpers
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Parse name: "LASTNAME,FIRSTNAME, MIDDLENAME" → parts
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Check if row is a marker like "<=== TOTAL MALE"
// ------------------------------------------------------------
function isMarkerRow(row) {
  if (!row) return false;
  const joined = row.map(c => String(c || "")).join(" ").toLowerCase();
  return joined.includes("<===")
      || joined.includes("total male")
      || joined.includes("total female")
      || joined.includes("combined");
}

// ------------------------------------------------------------
// Check if a row looks like a student data row
// ------------------------------------------------------------
function isStudentRow(row) {
  if (!row || !row.length) return false;
  if (isMarkerRow(row)) return false;

  const lrn = cellStr(row, COL.LRN);
  const name = cellStr(row, COL.NAME);
  const sex = cellStr(row, COL.SEX);

  // Valid LRN is 12 digits
  const lrnValid = /^\d{12}$/.test(lrn);
  // Name has a comma (Last, First format)
  const nameValid = name.includes(",");
  // Sex is M or F
  const sexValid = /^[MF]$/i.test(sex);

  return lrnValid && nameValid && sexValid;
}

// ------------------------------------------------------------
// Parse a single student row → object
// ------------------------------------------------------------
function parseStudentRow(row) {
  const fullName = cellStr(row, COL.NAME);
  const nameParts = splitName(fullName);

  // Normalize sex to single letter
  const sexRaw = cellStr(row, COL.SEX).toUpperCase();
  const sex = sexRaw === "M" || sexRaw === "MALE" ? "M"
            : sexRaw === "F" || sexRaw === "FEMALE" ? "F"
            : sexRaw;

  // Clean remarks (may contain <br> tags)
  const remarksRaw = cellStr(row, COL.REMARKS);
  const remarks = remarksRaw.replace(/<br\s*\/?>/gi, " | ").replace(/\s+/g, " ").trim();

  return {
    lrn:               cellStr(row, COL.LRN),
    lastName:          nameParts.lastName,
    firstName:         nameParts.firstName,
    middleName:        nameParts.middleName,
    fullName:          nameParts.fullName,
    sex:               sex,
    birthDate:         cellStr(row, COL.BIRTHDATE),
    age:               cellNum(row, COL.AGE),
    motherTongue:      cellStr(row, COL.MOTHER_TONGUE),
    ip:                cellStr(row, COL.IP),
    religion:          cellStr(row, COL.RELIGION),
    addressHouse:      cellStr(row, COL.ADDR_HOUSE),
    addressBarangay:   cellStr(row, COL.ADDR_BARANGAY),
    addressMunicipality: cellStr(row, COL.ADDR_MUNICIPALITY),
    addressProvince:   cellStr(row, COL.ADDR_PROVINCE),
    fatherName:        cellStr(row, COL.FATHER),
    motherName:        cellStr(row, COL.MOTHER),
    guardianName:      cellStr(row, COL.GUARDIAN),
    guardianRelationship: cellStr(row, COL.GUARDIAN_REL),
    contactNumber:     cellStr(row, COL.CONTACT),
    learningModality:  cellStr(row, COL.MODALITY),
    remarks:           remarks,
  };
}

// ------------------------------------------------------------
// Extract header info (School ID, SY, Grade, Section)
// ------------------------------------------------------------
function extractHeader(rows) {
  const info = { schoolId: "", schoolName: "", schoolYear: "",
                 gradeLevel: "", section: "", region: "", division: "" };

  // Scan first 10 rows for header labels
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    const joined = row.map(c => String(c || "")).join(" ").toLowerCase();

    // School ID
    if (joined.includes("school id")) {
      const idx = row.findIndex(c => String(c || "").toLowerCase().includes("school id"));
      for (let j = idx + 1; j < row.length; j++) {
        const v = cellStr(row, j);
        if (v && /^\d+$/.test(v)) { info.schoolId = v; break; }
      }
      // Region (same row, further right)
      for (let j = idx + 1; j < row.length; j++) {
        const v = cellStr(row, j);
        if (v && v.toLowerCase().includes("region")) {
          info.region = cellStr(row, j + 1) || v;
          break;
        }
      }
      // Division
      for (let j = idx + 1; j < row.length; j++) {
        const v = cellStr(row, j);
        if (v && v.toLowerCase().includes("division")) {
          info.division = cellStr(row, j + 2) || cellStr(row, j + 1);
          break;
        }
      }
    }

    // School Name + SY + Grade + Section
    if (joined.includes("school name")) {
      const idx = row.findIndex(c => String(c || "").toLowerCase().includes("school name"));
      for (let j = idx + 1; j < row.length; j++) {
        const v = cellStr(row, j);
        if (v && !v.toLowerCase().includes("school name")) {
          info.schoolName = v;
          break;
        }
      }

      // Find SY
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
              // Extract just "Grade 7" part
              const m = v.match(/grade\s*\d+/i);
              info.gradeLevel = m ? m[0].replace(/grade/i, "Grade").trim() : v;
              break;
            }
          }
          break;
        }
      }

      // Find Section
      for (let j = idx + 1; j < row.length; j++) {
        if (String(row[j] || "").toLowerCase().includes("section")) {
          for (let k = j + 1; k < row.length; k++) {
            const v = cellStr(row, k);
            if (v && !v.toLowerCase().includes("section")) {
              info.section = v.toUpperCase();
              break;
            }
          }
          break;
        }
      }
    }
  }

  return info;
}

// ------------------------------------------------------------
// MAIN PARSE FUNCTION
// ------------------------------------------------------------
export function parseLISFile(arrayBuffer) {
  if (typeof XLSX === "undefined") {
    throw new Error("SheetJS (XLSX) library not loaded. Add the CDN script first.");
  }

  // Read the workbook
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  // Use first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to array of arrays (raw values)
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: "",
    blankrows: false,
  });

  // Extract header info
  const header = extractHeader(rows);

  // Find student rows
  const students = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (isStudentRow(row)) {
      try {
        const student = parseStudentRow(row);
        if (student.lrn && student.lastName) {
          students.push(student);
        }
      } catch (e) {
        console.warn(`[xls-parser] Skipped row ${i}:`, e.message);
      }
    }
  }

  return {
    header,
    students,
    totalFound: students.length,
    maleCount: students.filter(s => s.sex === "M").length,
    femaleCount: students.filter(s => s.sex === "F").length,
  };
}