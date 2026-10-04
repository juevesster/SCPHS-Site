// ============================================================
// doc-parser.js — Universal Lesson Plan Parser (v3)
// Supports: ILAW, DLL (DO 42), MATATAG Lesson Exemplar
// Input formats: .docx (mammoth), .pdf (PDF.js), .txt, plain text
// Output: Universal schema that maps to ILAW editor fields
//
// v3 adds:
//   - extractLearningObjectives() — handles instruction paragraphs,
//     Knowledge/Skills/Values sub-headers, and multi-line numbered items
// ============================================================

(function () {
  "use strict";

  // ============================================================
  // FORMAT MARKERS
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
  // ARTIFACT CLEANUP
  // ============================================================
  function cleanArtifacts(text) {
    return String(text || "")
      .replace(/=====\s*Page\s+\d+\s*=====/gi, "\n")
      .replace(/(\b\d+\b\s+){10,}/g, " ")
      .replace(/(\bFLOW\b\s*\.?\s*){5,}/gi, " ")
      .replace(/(\d+\.\s*FLOW\s*){5,}/gi, " ")
      .replace(/Republic of the Philippines[\s\S]{0,300}?Nueva Vizcaya/gi, " ")
      .replace(/(\b20\d\d[-–]\s*){5,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  // ============================================================
  // FIX 1 — Normalize pasted-text headers
  // ============================================================
  function normalizePastedHeaders(text) {
    const headers = [
      "Lesson\\s*Title",
      "Learning\\s*Area(?:s)?",
      "Name\\s*of\\s*Teacher(?:s)?",
      "Teacher(?:'s)?\\s*Name",
      "Teacher",
      "Grade\\s*Level(?:\\s*and\\s*Section)?",
      "Grade\\s*(?:&|and)\\s*Section",
      "No\\.\\s*of\\s*Sessions",
      "No\\.\\s*of\\s*Days",
      "Section",
      "Quarter",
      "School",
      "References",
      "Content\\s*Standard",
      "Performance\\s*Standard",
      "Learning\\s*Objectives",
      "Learning\\s*Competenc(?:y|ies)",
      "Learner\\s*Context",
      "Pre-?\\s*Lesson",
      "Lesson\\s*Flow",
      "Materials(?:\\s*/?\\s*Resources)?",
      "Integration",
      "Assessment",
      "Extended\\s*Learning",
      "Ways\\s*Forward",
      "Reflections?",
      "Declaration\\s*of\\s*AI\\s*use",
      "Intentions",
      "Meaningful",
      "Prepared\\s*by",
      "Checked\\s*by",
      "Noted",
    ];

    for (const h of headers) {
      text = text.replace(
        new RegExp(`(?<![\\n])\\s*(${h})\\s*:?\\s*`, "gi"),
        "\n$1: "
      );
    }

    text = text.replace(/\n{3,}/g, "\n\n");
    return text;
  }

  // ============================================================
  // FILE READERS
  // ============================================================
  async function readDocx(file) {
    if (typeof mammoth === "undefined") {
      throw new Error("mammoth.js not loaded. Add the script tag.");
    }
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  }

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

  async function readTxt(file) {
    return await file.text();
  }

  async function readFile(file) {
    const name = (file.name || "").toLowerCase();
    if (name.endsWith(".docx")) return { html: await readDocx(file), type: "docx" };
    if (name.endsWith(".pdf")) return { text: await readPdf(file), type: "pdf" };
    return { text: await readTxt(file), type: "txt" };
  }

  // ============================================================
  // HTML → TEXT
  // ============================================================
  function htmlToStructuredText(html) {
    const container = document.createElement("div");
    container.innerHTML = html;

    container.querySelectorAll("tr").forEach(tr => {
      const cells = Array.from(tr.querySelectorAll("td, th"))
        .map(c => (c.innerText || c.textContent || "").trim())
        .filter(Boolean);
      if (cells.length) {
        const joined = cells
          .map(c => c.replace(/\s*\n\s*/g, " \u2028 "))
          .join(" | ");
        const marker = document.createTextNode("\n" + joined + "\n");
        tr.parentNode.replaceChild(marker, tr);
      }
    });

    container.querySelectorAll("p, h1, h2, h3, h4").forEach(el => {
      el.innerText = "\n" + (el.innerText || "") + "\n";
    });

    return (container.innerText || container.textContent || "")
      .replace(/\s*\u2028\s*/g, "\n")
      .trim();
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
    return best[1] >= 1 ? best[0] : "GENERIC";
  }

  // ============================================================
  // SECTION EXTRACTORS
  // ============================================================
  function extractSection(text, startPatterns, stopPatterns) {
    const startRe = Array.isArray(startPatterns) ? startPatterns : [startPatterns];
    let startIdx = -1;
    for (const re of startRe) {
      const m = text.match(re);
      if (m) {
        startIdx = m.index + m[0].length;
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

  function toList(text) {
    if (!text) return [];
    return String(text)
      .split(/\n+|(?=\s+\d+\.\s)|\s*[•●▪‣·]\s+/g)
      .map(l =>
        l
          .replace(/^[\-\*\u2022\u25CF\u25AA\u2023\u00B7\d.)\s]+/, "")
          .replace(/\s*\|\s*$/, "")
          .trim()
      )
      .filter(l => l.length > 3 && l.length < 500);
  }

  function extractHeaderField(text, labels, opts = {}) {
    const maxLen = opts.maxLen || Infinity;
    for (const label of labels) {
      let m = text.match(
        new RegExp(`${label}\\s*\\|\\s*([^|\\n]+?)\\s*(?:\\||\\n|$)`, "i")
      );
      if (m && m[1].trim().length > 0 && m[1].length <= maxLen) {
        return m[1].trim();
      }
      m = text.match(new RegExp(`${label}\\s*:\\s*([^\\n]+)`, "i"));
      if (m && m[1].trim().length > 0 && m[1].length <= maxLen) {
        return m[1].trim();
      }
      m = text.match(new RegExp(`${label}\\s*:?\\s*\\n\\s*([^\\n]+)`, "i"));
      if (m && m[1].trim().length > 0 && m[1].length <= maxLen) {
        return m[1].trim();
      }
    }
    return "";
  }

  // ============================================================
  // 🆕 v3 — DEDICATED LEARNING OBJECTIVES EXTRACTOR
  // Handles: instruction paragraph + Knowledge/Skills/Values
  // sub-headers + numbered items that span multiple lines
  // ============================================================
  function extractLearningObjectives(text) {
    // 1) Find the label
    const labelMatch = text.match(/Learning\s*Objectives?\s*:?\s*\|?\s*\n?/i);
    if (!labelMatch) return [];

    const start = labelMatch.index + labelMatch[0].length;
    const tail = text.slice(start);

    // 2) Cut off at the next major section
    const stopPatterns = [
      /Learner\s*Context\s*:?/i,
      /II\.\s*Learning\s*Experiences?/i,
      /Learning\s*Experiences?\s*:?/i,
      /Pre-?\s*Lesson\s*:?/i,
      /Lesson\s*Flow\s*:?/i,
      /Materials\s*:?/i,
      /Assessment\s*:?/i,
      /References\s*:?/i,
    ];
    let stop = tail.length;
    for (const re of stopPatterns) {
      const m = tail.match(re);
      if (m && m.index > 0 && m.index < stop) stop = m.index;
    }
    let block = tail.slice(0, stop).trim();

    // 3) Skip the descriptive instruction paragraph if present.
    //    Typical cue: "At the end of the ... shall be able to:"
    const cueMatch = block.match(
      /(At\s*the\s*end\s*of[\s\S]{0,300}?able\s*to\s*:?)/i
    );
    if (cueMatch) {
      block = block.slice(cueMatch.index + cueMatch[0].length);
    }

    // 4) Extract numbered items — handles multi-line wrapping and
    //    ignores sub-headers like "Knowledge", "Skills", "Values/Attitudes"
    const items = [];
    const numberedRe =
      /(\d{1,2})\.\s+([\s\S]*?)(?=\s*\d{1,2}\.\s+|\s*(?:Knowledge|Skills?|Values?|Attitudes?)\s*:?\s*$|$)/gi;
    let m;
    while ((m = numberedRe.exec(block)) !== null) {
      let item = m[2]
        .replace(/\s*\n\s*/g, " ")
        .replace(/\s{2,}/g, " ")
        .replace(/^(?:Knowledge|Skills?|Values?|Attitudes?)\s*:?\s*/i, "")
        .trim();
      if (/^(?:Knowledge|Skills?|Values?|Attitudes?)$/i.test(item)) continue;
      if (item.length > 3) items.push(item);
    }

    // 5) Fallback — if no numbered items, split on newlines
    if (!items.length) {
      return toList(block);
    }
    return items;
  }

    // ============================================================
  // ILAW EXTRACTION
  // ============================================================
  function parseILAW(text) {
    const result = baseSchema("ILAW");

    result.lessonTitle = extractHeaderField(text, ["Lesson\\s*Title"]);
    result.learningArea = extractHeaderField(text, ["Learning\\s*Area(?:s)?"]);
    result.teacherName = extractHeaderField(text, [
      "Name\\s*of\\s*Teacher(?:s)?",
      "Teacher(?:'s)?\\s*Name",
      "Teacher",
    ]);
    result.gradeLevel = extractHeaderField(text, [
      "Grade\\s*Level(?:\\s*and\\s*Section)?",
    ]);
    result.noOfSessions = extractHeaderField(text, ["No\\.\\s*of\\s*Sessions"]);

    const refM = text.match(
      /References\s*\|?\s*\n?([\s\S]{10,800}?)(?:\n\n|Intentions|Declaration|Content\s*Standard)/i
    );
    if (refM) result.references = refM[1].trim().replace(/\n+/g, "\n");

    result.aiDeclarationText = extractSection(
      text,
      [/Declaration\s*of\s*AI\s*use/i],
      [/Intentions\./i, /I\.\s*Intentions/i]
    );

    result.contentStandard = extractHeaderField(
      text,
      ["Content\\s*Standard"],
      { maxLen: 2000 }
    );
    if (!result.contentStandard) {
      result.contentStandard = extractSection(
        text,
        [/Content\s*Standard\s*:?/i],
        [/Performance\s*Standard\s*:?/i, /Learning\s*Objectives\s*:?/i]
      );
    }

    result.performanceStandard = extractHeaderField(
      text,
      ["Performance\\s*Standard"],
      { maxLen: 2000 }
    );
    if (!result.performanceStandard) {
      result.performanceStandard = extractSection(
        text,
        [/Performance\s*Standard\s*:?/i],
        [/Learning\s*Objectives\s*:?/i, /Learner\s*Context/i]
      );
    }

    // 🆕 v3 — use the dedicated extractor
    result.learningObjectives = extractLearningObjectives(text);

    // Competencies — try explicit field first, else inherit objectives
    const compPattern = extractSection(
      text,
      [
        /Learning\s*Competenc(?:y|ies)\s*(?:and\s*Curriculum\s*Standards)?\s*:?/i,
      ],
      [/Content\s*Standard/i, /Performance\s*Standard/i, /Learner\s*Context/i]
    );
    if (compPattern) {
      result.competencies = toList(compPattern).slice(0, 20);
    } else if (result.learningObjectives.length) {
      result.competencies = result.learningObjectives.slice(0, 10);
    }

    result.learnerContext = extractSection(
      text,
      [/Learner\s*Context\s*:?/i],
      [/Learning\s*Experiences?/i, /II\./i, /Assessment/i, /Pre-?\s*Lesson/i]
    );

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

    result.assessment = extractSection(
      text,
      [/Assessment\.?/i, /Formative\s*Assessment\s*:?/i],
      [/Ways\s*Forward/i, /Extended\s*Learning/i]
    );

    // =========================================================
    // Extended Learning — picks the LABELED list, skips the
    // instruction paragraph under "Ways Forward."
    // =========================================================
    let extLearning = "";

    // Prefer the capitalized "Extended Learning Opportunities:" list
    let mExt = text.match(
      /Extended\s*Learning\s*Opportunit(?:y|ies)\s*:\s*([\s\S]*?)(?=\n\s*(?:Reflections?|Teacher\s*Reflection|Prepared\s*by|Ways\s*Forward|Next\s*Steps)\b|$)/i
    );
    if (mExt && mExt[1].trim().length > 10) {
      extLearning = mExt[1].trim();
    }

    // Fallback — grab everything under "Ways Forward." if no labeled list
    if (!extLearning) {
      const mWays = text.match(
        /Ways\s*Forward\.?\s*([\s\S]*?)(?=\n\s*(?:Reflections?|Teacher\s*Reflection|Prepared\s*by)\b|$)/i
      );
      if (mWays && mWays[1].trim().length > 10) {
        extLearning = mWays[1].trim();
      }
    }

    // Ways Forward — keep the intro/reflection text
    let waysFwd = extractSection(
      text,
      [/Ways\s*Forward\.?\s*:?/i],
      [
        /Extended\s*Learning\s*Opportunit/i,
        /Reflections?/i,
        /Teacher\s*Reflection/i,
        /Prepared\s*by/i,
      ]
    );
    if (!waysFwd && extLearning) waysFwd = extLearning;

    result.extendedLearning = extLearning;
    result.waysForward = waysFwd;

    // Normalize bullets into newline-separated items for the textarea
    if (result.extendedLearning) {
      result.extendedLearning = result.extendedLearning
        .split(/\s*[•●▪‣·]\s*/)
        .map(s => s.trim())
        .filter(Boolean)
        .join("\n");
    }

    // Teacher Reflections
    result.teacherReflections = extractSection(
      text,
      [/Reflections?\s*:?/i, /Teacher\s*Reflection\s*:?/i],
      [/Next\s*Steps/i, /Ways\s*Forward/i, /Prepared\s*by/i]
    );

    extractSignatories(text, result);
    return result;
  }

  // ============================================================
  // DLL EXTRACTION
  // ============================================================
  function parseDLL(text) {
    const result = baseSchema("DLL");

    result.teacherName = extractHeaderField(text, ["Teacher"]);
    result.gradeLevel = extractHeaderField(text, ["Grade\\s*Level"]);
    result.learningArea = extractHeaderField(text, ["Learning\\s*Area"]);
    result.quarter = extractHeaderField(text, ["Quarter"]);
    result.teachingDates = extractHeaderField(text, [
      "Teaching\\s*Dates\\s*and\\s*Times?",
    ]);

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

    result.content = extractSection(
      text,
      [/II\.\s*CONTENT\s*:?/i],
      [/III\.\s*LEARNING/i]
    );

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

    const procedures = extractSection(
      text,
      [/IV\.\s*PROCEDURES/i],
      [/V\.\s*REMARKS/i, /VI\.\s*REFLECTION/i]
    );
    result.lessonFlow = procedures;

    result.preLesson = extractSection(
      procedures,
      [/A\.?\s*Reviewing\s*previous/i],
      [/D\.?\s*Discussing\s*new\s*concepts\s*#?1/i]
    );

    result.remarks = extractSection(
      text,
      [/V\.\s*REMARKS\s*:?/i],
      [/VI\.\s*REFLECTION/i]
    );

    result.teacherReflections = extractSection(
      text,
      [/VI\.\s*REFLECTION\s*:?/i],
      [/Prepared\s*by/i, /Address:/i]
    );

    extractSignatories(text, result);
    return result;
  }

  // ============================================================
  // MATATAG EXTRACTION
  // ============================================================
  function parseMATATAG(text) {
    const result = baseSchema("MATATAG");

    result.teacherName = extractHeaderField(text, ["Teacher"]);
    result.gradeLevel = extractHeaderField(text, ["Grade\\s*Level"]);
    result.learningArea = extractHeaderField(text, ["Learning\\s*Area"]);
    result.quarter = extractHeaderField(text, ["Quarter"]);
    result.noOfSessions = extractHeaderField(text, ["No\\.\\s*of\\s*Days"]);

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
    result.learningObjectives = toList(
      extractSection(
        objSec,
        [/At\s*the\s*end\s*of\s*the\s*lesson/i],
        [/A\.?\s*Content\s*Standards?/i]
      )
    );

    result.content = extractSection(
      text,
      [/II\.\s*CONTENT\s*:?/i],
      [/III\.\s*LEARNING/i]
    );

    result.references = extractSection(
      text,
      [/III\.\s*LEARNING\s*RESOURCES[\s\S]{0,100}?A\.?\s*References\s*:?/i],
      [/B\.?\s*List\s*of\s*Learning\s*Resources/i, /IV\.\s*PROCEDURES/i]
    );
    result.materials = extractSection(
      text,
      [
        /B\.?\s*List\s*of\s*Learning\s*Resources\s*:?/i,
        /B\.?\s*Other\s*Learning\s*Resources\s*:?/i,
      ],
      [/IV\.\s*PROCEDURES/i]
    );

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

    result.assessment = extractSection(
      text,
      [/V\.\s*ASSESSMENT\s*:?/i, /PRE\/POSTEST-?ASSESSMENT/i],
      [/VI\.\s*REFLECTION/i, /Prepared\s*by/i]
    );

    result.teacherReflections = extractSection(
      text,
      [/VI\.\s*REFLECTION\s*:?/i],
      [/Prepared\s*by/i]
    );

    extractSignatories(text, result);
    return result;
  }

  // ============================================================
  // SIGNATORIES
  // ============================================================
  function extractSignatories(text, result) {
    const prepM = text.match(
      /Prepared\s*by\s*:?\s*\n?\s*([A-Z][A-Za-z\s.,'\-]+?)(?:\n|$)/i
    );
    if (prepM) result.signatories.preparedByName = prepM[1].trim();

    const checkM = text.match(
      /Checked\s*by\s*:?\s*\n?\s*([A-Z][A-Za-z\s.,'\-]+?)(?:\n|$)/i
    );
    if (checkM) result.signatories.checkedByName = checkM[1].trim();

    const noteM = text.match(
      /Noted\s*:?\s*\n?\s*([A-Z][A-Za-z\s.,'\-]+?)(?:\n|$)/i
    );
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
    const read = await readFile(file);

    let text;
    if (read.html) {
      text = htmlToStructuredText(read.html);
    } else {
      text = read.text;
    }

    const cleaned = normalizePastedHeaders(cleanArtifacts(text));
    const format = detectFormat(cleaned);

    let result;
    if (format === "ILAW") result = parseILAW(cleaned);
    else if (format === "DLL") result = parseDLL(cleaned);
    else if (format === "MATATAG") result = parseMATATAG(cleaned);
    else result = parseILAW(cleaned);

    result._stats.charsRead = cleaned.length;
    result._stats.fieldsFound = Object.entries(result).filter(
      ([k, v]) => !k.startsWith("_") && v && String(v).trim().length > 3
    ).length;

    return result;
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  window.DocParser = {
    parse: parseDocument,
    parseText: (rawText) => {
      const cleaned = normalizePastedHeaders(cleanArtifacts(rawText));
      const format = detectFormat(cleaned);
      let result;
      if (format === "ILAW") result = parseILAW(cleaned);
      else if (format === "DLL") result = parseDLL(cleaned);
      else if (format === "MATATAG") result = parseMATATAG(cleaned);
      else result = parseILAW(cleaned);
      result._stats.charsRead = cleaned.length;
      result._stats.fieldsFound = Object.entries(result).filter(
        ([k, v]) => !k.startsWith("_") && v && String(v).trim().length > 3
      ).length;
      return result;
    },
    detectFormat: (rawText) => detectFormat(cleanArtifacts(rawText)),
    cleanArtifacts,
    normalizePastedHeaders,
    extractLearningObjectives, // exposed for debugging
  };
})();