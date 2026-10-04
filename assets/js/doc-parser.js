// ============================================================
// doc-parser.js — Universal Lesson Plan Parser
// Supports: ILAW, DLL (DO 42), MATATAG Lesson Exemplar
// Input formats: .docx (mammoth), .pdf (PDF.js), .txt, plain text
// Output: Universal schema that maps to ILAW editor fields
// ============================================================

(function () {
  "use strict";

  // ============================================================
  // FORMAT MARKERS — detect which DepEd format the file uses
  // ============================================================
  const FORMAT_MARKERS = {
    ILAW: [
      /Declaration of AI use/i,
      /DO 3[, ]*s\.?\s*2026/i,
      /Intentions\.\s*Meaningful/i,
      /Ways Forward\./i,
    ],
    MATATAG: [
      /Most essential Learning Competencies/i,
      /SOLO Taxonomy/i,
      /Prestructural|Unistructural|Multistructural|Relational|Extended Abstract/i,
      /Lesson Exemplar/i,
    ],
    DLL: [
      /DAILY LESSON LOG/i,
      /I\.\s*OBJECTIVES/i,
      /III\.\s*LEARNING RESOURCES/i,
      /VI\.\s*REFLECTION/i,
    ],
  };

  // ============================================================
  // ARTIFACT CLEANUP — strip PDF-extraction garbage
  // ============================================================
  function cleanArtifacts(text) {
    return String(text || "")
      // Page markers
      .replace(/=====\s*Page\s+\d+\s*=====/gi, "\n")
      // Runs of "1 1 1 1 1..."
      .replace(/(\b\d+\b\s+){10,}/g, " ")
      // Runs of "FLOW FLOW FLOW..."
      .replace(/(\bFLOW\b\s*\.?\s*){5,}/gi, " ")
      // Runs of "1. FLOW 2. FLOW..."
      .replace(/(\d+\.\s*FLOW\s*){5,}/gi, " ")
      // Header repetition
      .replace(/Republic of the Philippines[\s\S]{0,300}?Nueva Vizcaya/gi, " ")
      // Year runs
      .replace(/(\b20\d\d[-–]\s*){5,}/g, " ")
      // Multiple blank lines
      .replace(/\n{3,}/g, "\n\n")
      // Multiple spaces
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  // ============================================================
  // FILE READERS
  // ============================================================

  // Read .docx — preserves table structure as HTML
  async function readDocx(file) {
    if (typeof mammoth === "undefined") {
      throw new Error("mammoth.js not loaded. Add the script tag.");
    }
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value; // HTML string with <table>, <p>, etc.
  }

  // Read .pdf via PDF.js
  async function readPdf(file) {
    if (typeof pdfjsLib === "undefined") {
      throw new Error("PDF.js not loaded.");
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
          if (line.trim()) lines.push(line.trim());
          line = "";
        }
        line += item.str + " ";
        lastY = y;
      }
      if (line.trim()) lines.push(line.trim());
      pages.push(lines.join("\n"));
    }
    return pages.join("\n\n");
  }

  // Read plain text
  async function readTxt(file) {
    return await file.text();
  }

  // Universal reader
  async function readFile(file) {
    const name = (file.name || "").toLowerCase();
    if (name.endsWith(".docx")) return { html: await readDocx(file), type: "docx" };
    if (name.endsWith(".pdf")) return { text: await readPdf(file), type: "pdf" };
    return { text: await readTxt(file), type: "txt" };
  }

  // ============================================================
  // HTML → TEXT — flatten but keep table row structure
  // ============================================================
  function htmlToStructuredText(html) {
    // Replace table rows with pipes to preserve cell boundaries
    const container = document.createElement("div");
    container.innerHTML = html;

    // Convert each <tr> to a line with cell separators
    container.querySelectorAll("tr").forEach(tr => {
      const cells = Array.from(tr.querySelectorAll("td, th"))
        .map(c => (c.innerText || c.textContent || "").trim())
        .filter(Boolean);
      if (cells.length) {
        const marker = document.createTextNode("\n" + cells.join(" | ") + "\n");
        tr.parentNode.replaceChild(marker, tr);
      }
    });

    // Convert <p> and headings to newlines
    container.querySelectorAll("p, h1, h2, h3, h4").forEach(el => {
      el.innerText = "\n" + (el.innerText || "") + "\n";
    });

    return (container.innerText || container.textContent || "").trim();
  }

  // ============================================================
  // FORMAT DETECTION
  // ============================================================
  function detectFormat(text) {
    const scores = { ILAW: 0, MATATAG: 0, DLL: 0 };
    for (const [fmt, patterns] of Object.entries(FORMAT_MARKERS)) {
      for (const p of patterns) {
        if (p.test(text)) scores[fmt]++;
      }
    }
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return best[1] >= 2 ? best[0] : (best[1] >= 1 ? best[0] : "GENERIC");
  }

  // ============================================================
  // SECTION EXTRACTORS — pull fields from cleaned text
  // ============================================================

  // Extract text following a label up to the next known label
  function extractSection(text, startPatterns, stopPatterns) {
    const startRe = Array.isArray(startPatterns) ? startPatterns : [startPatterns];
    let startIdx = -1;
    let matchedPattern = null;
    for (const re of startRe) {
      const m = text.match(re);
      if (m) {
        startIdx = m.index + m[0].length;
        matchedPattern = re;
        break;
      }
    }
    if (startIdx === -1) return "";

    const remainder = text.slice(startIdx);
    let stopIdx = remainder.length;
    for (const re of stopPatterns) {
      const m = remainder.match(re);
      if (m && m.index > 0 && m.index < stopIdx) {
        stopIdx = m.index;
      }
    }
    return remainder.slice(0, stopIdx).trim();
  }

  // Convert a paragraph of text into an array of list items
  function toList(text) {
    if (!text) return [];
    return text
      .split(/\n+/)
      .map(l => l.replace(/^[\-\*\u2022\d.)\s]+/, "").trim())
      .filter(l => l.length > 3 && l.length < 500);
  }

  // ============================================================
  // ILAW EXTRACTION
  // ============================================================
  function parseILAW(text) {
    const result = baseSchema("ILAW");

    // Header — extract from table row: "Lesson Title | <content> | Learning Area/s | <content>"
    const titleM = text.match(/Lesson\s*Title\s*\|\s*([^|]+?)\s*\|/i);
    if (titleM) result.lessonTitle = titleM[1].trim();

    const areaM = text.match(/Learning\s*Area\/?s?\s*\|\s*([^|]+?)\s*(?:\||$)/i);
    if (areaM) result.learningArea = areaM[1].trim();

    const teacherM = text.match(/Name\s*of\s*Teacher\/?s?\s*\|\s*([^|]+?)\s*(?:\||$)/i);
    if (teacherM) result.teacherName = teacherM[1].trim();

    const gradeM = text.match(/Grade\s*Level\s*(?:and\s*Section)?\s*\|\s*([^|]+?)\s*(?:\||$)/i);
    if (gradeM) result.gradeLevel = gradeM[1].trim();

    const sessionM = text.match(/No\.\s*of\s*Sessions\s*\|\s*([^|]+?)\s*(?:\||$)/i);
    if (sessionM) result.noOfSessions = sessionM[1].trim();

    const refM = text.match(/References[\s\S]{0,50}?\|\s*([\s\S]+?)(?:\||$|Intentions)/i);
    if (refM) result.references = refM[1].trim();

    // Declaration of AI
    result.aiDeclarationText = extractSection(
      text,
      [/Declaration\s*of\s*AI\s*use/i],
      [/Intentions\./i, /I\.\s*Intentions/i]
    );

    // Intentions
    result.contentStandard = extractSection(
      text,
      [/Content\s*Standard\s*:?/i],
      [/Performance\s*Standard\s*:?/i, /Learning\s*Objectives\s*:?/i]
    );
    result.performanceStandard = extractSection(
      text,
      [/Performance\s*Standard\s*:?/i],
      [/Learning\s*Objectives\s*:?/i, /Learner\s*Context/i]
    );
    const learningObj = extractSection(
      text,
      [/Learning\s*Objectives\s*:?/i],
      [/Learner\s*Context/i, /II\.\s*Learning/i, /Learning\s*Experiences?/i]
    );
    result.learningObjectives = toList(learningObj);

    result.learnerContext = extractSection(
      text,
      [/Learner\s*Context\s*:?/i],
      [/Learning\s*Experiences?/i, /II\./i, /Assessment/i]
    );

    // Learning Experience
    result.preLesson = extractSection(
      text,
      [/Pre-?\s*Lesson\s*:?/i, /Introduction\s*:?/i],
      [/Lesson\s*Flow/i, /Development/i, /Materials/i]
    );
    result.lessonFlow = extractSection(
      text,
      [/Lesson\s*Flow\s*:?/i, /Learning\s*Experiences?\s*:?/i],
      [/Materials/i, /Resources/i, /Integration/i, /Assessment/i]
    );
    result.materials = extractSection(
      text,
      [/Materials\s*(?:\/?\s*Resources)?\s*:?/i, /List\s*of\s*Learning\s*Resources/i],
      [/Integration/i, /Opportunities\s*for\s*integration/i, /Assessment/i]
    );
    result.integration = extractSection(
      text,
      [/Integration\s*Opportunit/i, /Opportunities\s*for\s*integration/i],
      [/Assessment/i, /Formative/i]
    );

    // Assessment
    result.assessment = extractSection(
      text,
      [/Assessment\./i, /Formative\s*Assessment\s*:?/i],
      [/Ways\s*Forward/i, /Extended\s*Learning/i]
    );

    // Ways Forward
    result.extendedLearning = extractSection(
      text,
      [/Extended\s*Learning\s*Opportunit/i],
      [/Reflection/i, /Ways\s*Forward/i]
    );
    result.teacherReflections = extractSection(
      text,
      [/Reflections?\s*:?/i, /Teacher\s*Reflection\s*:?/i],
      [/Next\s*Steps/i, /Prepared\s*by/i]
    );
    result.waysForward = extractSection(
      text,
      [/Next\s*Steps\s*:?/i, /Ways\s*Forward\s*:?/i],
      [/Prepared\s*by/i]
    );

    // Signatories
    extractSignatories(text, result);

    return result;
  }

  // ============================================================
  // DLL EXTRACTION
  // ============================================================
  function parseDLL(text) {
    const result = baseSchema("DLL");

    // Header table
    const teacherM = text.match(/Teacher\s*\|\s*([^|]+)/i);
    if (teacherM) result.teacherName = teacherM[1].trim();

    const gradeM = text.match(/Grade\s*Level\s*\|\s*([^|]+)/i);
    if (gradeM) result.gradeLevel = gradeM[1].trim();

    const areaM = text.match(/Learning\s*Area\s*\|\s*([^|]+)/i);
    if (areaM) result.learningArea = areaM[1].trim();

    const quarterM = text.match(/Quarter\s*\|\s*([^|]+)/i);
    if (quarterM) result.quarter = quarterM[1].trim();

    const datesM = text.match(/(?:Teaching\s*Dates\s*and\s*Times?)\s*\|\s*([^|]+)/i);
    if (datesM) result.teachingDates = datesM[1].trim();

    // I. OBJECTIVES → Content Standards, Performance, Learning Competencies
    const objSec = extractSection(
      text,
      [/I\.\s*OBJECTIVES/i],
      [/II\.\s*CONTENT/i]
    );

    result.contentStandard = extractSection(
      objSec,
      [/A\.?\s*Content\s*Standards?\s*:?/i],
      [/B\.?\s*Performance/i]
    );
    result.performanceStandard = extractSection(
      objSec,
      [/B\.?\s*Performance\s*Standards?\s*:?/i],
      [/C\.?\s*Learning\s*Competencies/i]
    );
    const comps = extractSection(
      objSec,
      [/C\.?\s*Learning\s*Competencies(?:\/?\s*Objectives)?\s*:?/i],
      [/$/]
    );
    result.competencies = toList(comps);

    // II. CONTENT
    result.content = extractSection(
      text,
      [/II\.\s*CONTENT\s*:?/i],
      [/III\.\s*LEARNING/i]
    );

    // III. LEARNING RESOURCES
    result.references = extractSection(
      text,
      [/III\.\s*LEARNING\s*RESOURCES[\s\S]{0,100}?A\.?\s*References\s*:?/i],
      [/B\.?\s*Other\s*Learning\s*Resources/i, /IV\.\s*PROCEDURES/i]
    );
    result.materials = extractSection(
      text,
      [/B\.?\s*Other\s*Learning\s*Resources\s*:?/i],
      [/IV\.\s*PROCEDURES/i]
    );

    // IV. PROCEDURES → Lesson Flow
    const procedures = extractSection(
      text,
      [/IV\.\s*PROCEDURES/i],
      [/V\.\s*REMARKS/i, /VI\.\s*REFLECTION/i]
    );
    result.lessonFlow = procedures;

    // Split procedures into pre-lesson (A-C) and main (D-J)
    result.preLesson = extractSection(
      procedures,
      [/A\.?\s*Reviewing\s*previous/i],
      [/D\.?\s*Discussing\s*new\s*concepts\s*#?1/i]
    );

    // V. REMARKS
    result.remarks = extractSection(
      text,
      [/V\.\s*REMARKS\s*:?/i],
      [/VI\.\s*REFLECTION/i]
    );

    // VI. REFLECTION
    result.teacherReflections = extractSection(
      text,
      [/VI\.\s*REFLECTION\s*:?/i],
      [/Prepared\s*by/i, /Address:/i]
    );

    extractSignatories(text, result);
    return result;
  }

  // ============================================================
  // MATATAG LESSON EXEMPLAR EXTRACTION
  // ============================================================
  function parseMATATAG(text) {
    const result = baseSchema("MATATAG");

    // Header table
    const teacherM = text.match(/Teacher\s*\|\s*([^|]+)/i);
    if (teacherM) result.teacherName = teacherM[1].trim();

    const gradeM = text.match(/Grade\s*Level\s*\|\s*([^|]+)/i);
    if (gradeM) result.gradeLevel = gradeM[1].trim();

    const areaM = text.match(/Learning\s*Area\s*\|\s*([^|]+)/i);
    if (areaM) result.learningArea = areaM[1].trim();

    const quarterM = text.match(/Quarter\s*\|\s*([^|]+)/i);
    if (quarterM) result.quarter = quarterM[1].trim();

    const daysM = text.match(/No\.\s*of\s*Days\s*\|\s*([^|]+)/i);
    if (daysM) result.noOfSessions = daysM[1].trim();

    // I. OBJECTIVES
    const objSec = extractSection(
      text,
      [/I\.\s*OBJECTIVES/i],
      [/II\.\s*CONTENT/i]
    );

    result.contentStandard = extractSection(
      objSec,
      [/A\.?\s*Content\s*Standards?\s*:?/i],
      [/B\.?\s*Performance/i]
    );
    result.performanceStandard = extractSection(
      objSec,
      [/B\.?\s*Performance\s*Standards?\s*:?/i],
      [/C\.?\s*Most\s*essential/i]
    );
    const melc = extractSection(
      objSec,
      [/C\.?\s*Most\s*essential\s*Learning\s*Competencies\s*\(?MELC\)?\s*:?/i],
      [/$/]
    );
    result.competencies = toList(melc);
    result.learningObjectives = toList(extractSection(
      objSec,
      [/At\s*the\s*end\s*of\s*the\s*lesson/i],
      [/A\.?\s*Content\s*Standards?/i]
    ));

    // II. CONTENT
    result.content = extractSection(
      text,
      [/II\.\s*CONTENT\s*:?/i],
      [/III\.\s*LEARNING/i]
    );

    // III. LEARNING RESOURCES
    result.references = extractSection(
      text,
      [/III\.\s*LEARNING\s*RESOURCES[\s\S]{0,100}?A\.?\s*References\s*:?/i],
      [/B\.?\s*List\s*of\s*Learning\s*Resources/i, /IV\.\s*PROCEDURES/i]
    );
    result.materials = extractSection(
      text,
      [/B\.?\s*List\s*of\s*Learning\s*Resources\s*:?/i, /B\.?\s*Other\s*Learning\s*Resources\s*:?/i],
      [/IV\.\s*PROCEDURES/i]
    );

    // IV. PROCEDURES
    const procedures = extractSection(
      text,
      [/IV\.\s*PROCEDURES/i],
      [/V\.\s*(?:ASSESSMENT|REMARKS|PRE\/POST)/i, /PRE\/POSTEST/i]
    );
    result.preLesson = extractSection(
      procedures,
      [/A\.?\s*Introduction\s*:?/i],
      [/B\.?\s*Development/i]
    );
    result.lessonFlow = procedures;

    // V. ASSESSMENT
    result.assessment = extractSection(
      text,
      [/V\.\s*ASSESSMENT\s*:?/i, /PRE\/POSTEST-?ASSESSMENT/i],
      [/VI\.\s*REFLECTION/i, /Prepared\s*by/i]
    );

    // VI. REFLECTION
    result.teacherReflections = extractSection(
      text,
      [/VI\.\s*REFLECTION\s*:?/i],
      [/Prepared\s*by/i]
    );

    extractSignatories(text, result);
    return result;
  }

  // ============================================================
  // SIGNATORIES — common across all 3 formats
  // ============================================================
  function extractSignatories(text, result) {
    const prepM = text.match(/Prepared\s*by\s*:?\s*\n?\s*([A-Z][A-Za-z\s.,'\-]+?)(?:\n|$)/i);
    if (prepM) result.signatories.preparedByName = prepM[1].trim();

    const checkM = text.match(/Checked\s*by\s*:?\s*\n?\s*([A-Z][A-Za-z\s.,'\-]+?)(?:\n|$)/i);
    if (checkM) result.signatories.checkedByName = checkM[1].trim();

    const noteM = text.match(/Noted\s*:?\s*\n?\s*([A-Z][A-Za-z\s.,'\-]+?)(?:\n|$)/i);
    if (noteM) result.signatories.notedByName = noteM[1].trim();
  }

  // ============================================================
  // BASE SCHEMA
  // ============================================================
  function baseSchema(format) {
    return {
      format,
      lessonTitle: "",
      learningArea: "",
      teacherName: "",
      gradeLevel: "",
      section: "",
      noOfSessions: "",
      references: "",
      contentStandard: "",
      performanceStandard: "",
      competencies: [],
      learningObjectives: [],
      learnerContext: "",
      preLesson: "",
      lessonFlow: "",
      materials: "",
      integration: "",
      assessment: "",
      extendedLearning: "",
      waysForward: "",
      teacherReflections: "",
      quarter: "",
      teachingDates: "",
      content: "",
      remarks: "",
      aiDeclarationText: "",
      signatories: {
        preparedByName: "",
        checkedByName: "",
        notedByName: "",
      },
      _stats: {
        charsRead: 0,
        fieldsFound: 0,
        format: format,
      },
    };
  }

  // ============================================================
  // MAIN PARSE FUNCTION
  // ============================================================
  async function parseDocument(file) {
    // 1. Read file (returns { html } or { text })
    const read = await readFile(file);

    // 2. Convert to structured text
    let text;
    if (read.html) {
      text = htmlToStructuredText(read.html);
    } else {
      text = read.text;
    }

    // 3. Clean artifacts
    const cleaned = cleanArtifacts(text);

    // 4. Detect format
    const format = detectFormat(cleaned);

    // 5. Parse accordingly
    let result;
    if (format === "ILAW") result = parseILAW(cleaned);
    else if (format === "DLL") result = parseDLL(cleaned);
    else if (format === "MATATAG") result = parseMATATAG(cleaned);
    else result = parseILAW(cleaned); // default

    // 6. Stats
    result._stats.charsRead = cleaned.length;
    result._stats.fieldsFound = Object.entries(result)
      .filter(([k, v]) => !k.startsWith("_") && v && String(v).trim().length > 3)
      .length;

    return result;
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  window.DocParser = {
    parse: parseDocument,
    parseText: (rawText) => {
      const cleaned = cleanArtifacts(rawText);
      const format = detectFormat(cleaned);
      let result;
      if (format === "ILAW") result = parseILAW(cleaned);
      else if (format === "DLL") result = parseDLL(cleaned);
      else if (format === "MATATAG") result = parseMATATAG(cleaned);
      else result = parseILAW(cleaned);
      result._stats.charsRead = cleaned.length;
      return result;
    },
    detectFormat: (rawText) => detectFormat(cleanArtifacts(rawText)),
    cleanArtifacts,
  };
})();