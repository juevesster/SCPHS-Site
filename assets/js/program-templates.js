// ============================================================
// program-templates.js
// Full K-12 class program template library
// Sources:
//   - DepEd DO 009 s. 2026 (Key Stages 1-4 + Multigrade)
//   - DO 010 s. 2024 (Kindergarten)
//   - SCPHS Admin-created class programs (SY 2026-2027)
// ============================================================

(function () {
  "use strict";

  // ------------------------------------------------------------
  // TIME SLOT PRESETS (one per Key Stage)
  // ------------------------------------------------------------
  const SLOT_PRESETS = {
    // ----------------------------------------------------------
    // KINDERGARTEN — Blocks of Time (DO 010 s. 2024)
    // ----------------------------------------------------------
    kinder: [
      { id: "k-block-1", label: "Arrival / Meeting Time",         start: "07:30", end: "07:50", type: "class",    orderIndex: 1 },
      { id: "k-block-2", label: "Meeting Time 2 / Prayer",        start: "07:50", end: "08:10", type: "class",    orderIndex: 2 },
      { id: "k-block-3", label: "Work Period 1",                  start: "08:10", end: "08:50", type: "class",    orderIndex: 3 },
      { id: "k-block-4", label: "Health Break / Snack Time",      start: "08:50", end: "09:10", type: "break",    orderIndex: 4 },
      { id: "k-block-5", label: "Work Period 2",                  start: "09:10", end: "09:50", type: "class",    orderIndex: 5 },
      { id: "k-block-6", label: "Story Time",                     start: "09:50", end: "10:10", type: "class",    orderIndex: 6 },
      { id: "k-block-7", label: "Outdoor / Free Play",            start: "10:10", end: "10:40", type: "class",    orderIndex: 7 },
      { id: "k-block-8", label: "Indoor / Manipulative Play",     start: "10:40", end: "11:10", type: "class",    orderIndex: 8 },
      { id: "k-block-9", label: "Dismissal / Pack-up",            start: "11:10", end: "11:30", type: "class",    orderIndex: 9 },
    ],

    // ----------------------------------------------------------
    // KEY STAGE 1 — Grades 1-3 (DO 009 s. 2026, Table 3)
    // ----------------------------------------------------------
    ks1: [
      { id: "ks1-flag",   label: "Flag Ceremony / Daily Routine", start: "07:00", end: "07:20", type: "ceremony", orderIndex: 1 },
      { id: "ks1-p1",     label: "Period 1",                      start: "07:20", end: "08:20", type: "class",    orderIndex: 2 },
      { id: "ks1-p2",     label: "Period 2",                      start: "08:20", end: "09:20", type: "class",    orderIndex: 3 },
      { id: "ks1-break",  label: "Health Break",                  start: "09:20", end: "09:40", type: "break",    orderIndex: 4 },
      { id: "ks1-p3",     label: "Period 3",                      start: "09:40", end: "10:40", type: "class",    orderIndex: 5 },
      { id: "ks1-p4",     label: "Period 4",                      start: "10:40", end: "11:40", type: "class",    orderIndex: 6 },
      { id: "ks1-lunch",  label: "Lunch Break",                   start: "11:40", end: "12:40", type: "break",    orderIndex: 7 },
      { id: "ks1-p5",     label: "Period 5",                      start: "12:40", end: "01:40", type: "class",    orderIndex: 8 },
      { id: "ks1-aral",   label: "ARAL Program",                  start: "01:40", end: "02:40", type: "aral",     orderIndex: 9 },
    ],

    // ----------------------------------------------------------
    // KEY STAGE 2 — Grades 4-6 (DO 009 s. 2026, Table 4)
    // ----------------------------------------------------------
    ks2: [
      { id: "ks2-flag",   label: "Flag Ceremony / Daily Routine", start: "07:00", end: "07:20", type: "ceremony", orderIndex: 1 },
      { id: "ks2-p1",     label: "Period 1",                      start: "07:20", end: "08:20", type: "class",    orderIndex: 2 },
      { id: "ks2-p2",     label: "Period 2",                      start: "08:20", end: "09:20", type: "class",    orderIndex: 3 },
      { id: "ks2-break",  label: "Health Break",                  start: "09:20", end: "09:40", type: "break",    orderIndex: 4 },
      { id: "ks2-p3",     label: "Period 3",                      start: "09:40", end: "10:40", type: "class",    orderIndex: 5 },
      { id: "ks2-p4",     label: "Period 4",                      start: "10:40", end: "11:40", type: "class",    orderIndex: 6 },
      { id: "ks2-lunch",  label: "Lunch Break",                   start: "11:40", end: "12:40", type: "break",    orderIndex: 7 },
      { id: "ks2-p5",     label: "Period 5",                      start: "12:40", end: "01:40", type: "class",    orderIndex: 8 },
      { id: "ks2-p6",     label: "Period 6",                      start: "01:40", end: "02:40", type: "class",    orderIndex: 9 },
      { id: "ks2-aral",   label: "ARAL Program",                  start: "02:40", end: "03:40", type: "aral",     orderIndex: 10 },
    ],

    // ----------------------------------------------------------
    // KEY STAGE 3 — Grades 7-10 (DO 009 s. 2026, Table 5 + SCPHS JHS)
    // ----------------------------------------------------------
    ks3: [
      { id: "ks3-flag",   label: "Flag Ceremony / Daily Routine", start: "07:20", end: "07:45", type: "ceremony", orderIndex: 1 },
      { id: "ks3-p1",     label: "Period 1",                      start: "07:45", end: "08:45", type: "class",    orderIndex: 2 },
      { id: "ks3-p2",     label: "Period 2",                      start: "08:45", end: "09:45", type: "class",    orderIndex: 3 },
      { id: "ks3-break",  label: "Health Break",                  start: "09:45", end: "10:00", type: "break",    orderIndex: 4 },
      { id: "ks3-p3",     label: "Period 3",                      start: "10:00", end: "11:00", type: "class",    orderIndex: 5 },
      { id: "ks3-p4",     label: "Period 4",                      start: "11:00", end: "12:00", type: "class",    orderIndex: 6 },
      { id: "ks3-lunch",  label: "Lunch Break",                   start: "12:00", end: "01:00", type: "break",    orderIndex: 7 },
      { id: "ks3-p5",     label: "Period 5",                      start: "01:00", end: "02:00", type: "class",    orderIndex: 8 },
      { id: "ks3-p6",     label: "Period 6",                      start: "02:00", end: "03:00", type: "class",    orderIndex: 9 },
      { id: "ks3-p7",     label: "Period 7",                      start: "03:00", end: "04:00", type: "class",    orderIndex: 10 },
      { id: "ks3-aral",   label: "ARAL / Classroom Cleaning",     start: "04:00", end: "05:00", type: "aral",     orderIndex: 11 },
    ],

    // ----------------------------------------------------------
    // KEY STAGE 4 — SHS (DO 009 s. 2026, Table 6 + SCPHS SHS)
    // ----------------------------------------------------------
    ks4: [
      { id: "ks4-flag",   label: "Flag Ceremony",                 start: "07:20", end: "07:45", type: "ceremony", orderIndex: 1 },
      { id: "ks4-p1",     label: "Period 1",                      start: "07:45", end: "08:45", type: "class",    orderIndex: 2 },
      { id: "ks4-p2",     label: "Period 2",                      start: "08:45", end: "09:45", type: "class",    orderIndex: 3 },
      { id: "ks4-break",  label: "Health Break / Recess",         start: "09:45", end: "10:00", type: "break",    orderIndex: 4 },
      { id: "ks4-p3",     label: "Period 3",                      start: "10:00", end: "11:00", type: "class",    orderIndex: 5 },
      { id: "ks4-p4",     label: "Period 4",                      start: "11:00", end: "12:00", type: "class",    orderIndex: 6 },
      { id: "ks4-lunch",  label: "Lunch Break",                   start: "12:00", end: "01:00", type: "break",    orderIndex: 7 },
      { id: "ks4-p5",     label: "Period 5",                      start: "01:00", end: "02:00", type: "class",    orderIndex: 8 },
      { id: "ks4-p6",     label: "Period 6",                      start: "02:00", end: "03:00", type: "class",    orderIndex: 9 },
      { id: "ks4-p7",     label: "Period 7",                      start: "03:00", end: "04:00", type: "class",    orderIndex: 10 },
      { id: "ks4-clean",  label: "Classroom / Zone Cleaning",     start: "04:00", end: "05:00", type: "aral",     orderIndex: 11 },
    ],

    // ----------------------------------------------------------
    // MULTIGRADE 1-2 (DO 009 s. 2026, Table 7)
    // ----------------------------------------------------------
    mg12: [
      { id: "mg12-flag",  label: "Flag Ceremony / Daily Routine", start: "07:30", end: "08:00", type: "ceremony", orderIndex: 1 },
      { id: "mg12-b1",    label: "GMRC Block",                    start: "08:00", end: "08:40", type: "class",    orderIndex: 2 },
      { id: "mg12-b2",    label: "Reading & Literacy / Filipino", start: "08:40", end: "10:00", type: "class",    orderIndex: 3 },
      { id: "mg12-break", label: "Health Break",                  start: "10:00", end: "10:20", type: "break",    orderIndex: 4 },
      { id: "mg12-b3",    label: "Language / English",            start: "10:20", end: "11:00", type: "class",    orderIndex: 5 },
      { id: "mg12-aral1", label: "ARAL Program",                  start: "11:00", end: "11:40", type: "aral",     orderIndex: 6 },
      { id: "mg12-break2",label: "Health Break / Lunch",          start: "11:40", end: "01:00", type: "break",    orderIndex: 7 },
      { id: "mg12-b4",    label: "Language / Makabansa",          start: "01:00", end: "01:40", type: "class",    orderIndex: 8 },
      { id: "mg12-aral2", label: "ARAL Program",                  start: "01:40", end: "02:40", type: "aral",     orderIndex: 9 },
      { id: "mg12-b5",    label: "HGP / Library / Culminating",   start: "02:40", end: "03:40", type: "class",    orderIndex: 10 },
      { id: "mg12-tr",    label: "Teaching-Related Tasks",        start: "03:40", end: "04:30", type: "class",    orderIndex: 11 },
    ],

    // ----------------------------------------------------------
    // MULTIGRADE 3-4 (DO 009 s. 2026, Table 8)
    // ----------------------------------------------------------
    mg34: [
      { id: "mg34-flag",  label: "Flag Ceremony / Daily Routine", start: "07:30", end: "08:00", type: "ceremony", orderIndex: 1 },
      { id: "mg34-b1",    label: "GMRC Block",                    start: "08:00", end: "08:45", type: "class",    orderIndex: 2 },
      { id: "mg34-b2",    label: "Filipino Block",                start: "08:45", end: "10:15", type: "class",    orderIndex: 3 },
      { id: "mg34-break", label: "Health Break",                  start: "10:15", end: "10:30", type: "break",    orderIndex: 4 },
      { id: "mg34-b3",    label: "English / Science Block",       start: "10:30", end: "12:00", type: "class",    orderIndex: 5 },
      { id: "mg34-break2",label: "Health Break",                  start: "12:00", end: "01:00", type: "break",    orderIndex: 6 },
      { id: "mg34-b4",    label: "MAPEH Block",                   start: "01:00", end: "01:45", type: "class",    orderIndex: 7 },
      { id: "mg34-b5",    label: "Makabansa / AP / EPP",          start: "01:45", end: "03:15", type: "class",    orderIndex: 8 },
      { id: "mg34-aral",  label: "ARAL Program",                  start: "03:15", end: "04:00", type: "aral",     orderIndex: 9 },
      { id: "mg34-hgp",   label: "HGP / Teaching-Related Tasks",  start: "04:00", end: "04:30", type: "class",    orderIndex: 10 },
    ],

    // ----------------------------------------------------------
    // MULTIGRADE 5-6 (DO 009 s. 2026, Table 9)
    // ----------------------------------------------------------
    mg56: [
      { id: "mg56-flag",  label: "Flag Ceremony / Daily Routine", start: "07:30", end: "08:00", type: "ceremony", orderIndex: 1 },
      { id: "mg56-b1",    label: "GMRC Block",                    start: "08:00", end: "08:45", type: "class",    orderIndex: 2 },
      { id: "mg56-b2",    label: "English / Math Block",          start: "08:45", end: "10:15", type: "class",    orderIndex: 3 },
      { id: "mg56-break", label: "Health Break",                  start: "10:15", end: "10:30", type: "break",    orderIndex: 4 },
      { id: "mg56-b3",    label: "Filipino / Science Block",      start: "10:30", end: "12:00", type: "class",    orderIndex: 5 },
      { id: "mg56-break2",label: "Health Break",                  start: "12:00", end: "01:00", type: "break",    orderIndex: 6 },
      { id: "mg56-b4",    label: "EPP / AP Block",                start: "01:00", end: "02:30", type: "class",    orderIndex: 7 },
      { id: "mg56-b5",    label: "MAPEH Block",                   start: "02:30", end: "03:15", type: "class",    orderIndex: 8 },
      { id: "mg56-aral",  label: "ARAL Program",                  start: "03:15", end: "04:00", type: "aral",     orderIndex: 9 },
      { id: "mg56-hgp",   label: "HGP / Teaching-Related Tasks",  start: "04:00", end: "04:30", type: "class",    orderIndex: 10 },
    ],
  };

  // ------------------------------------------------------------
  // TEMPLATE LIBRARY
  // ------------------------------------------------------------
  // Each template has:
  //   - label:         Human-readable name
  //   - category:      Grouping for dropdown
  //   - slotPreset:    Which SLOT_PRESETS key to use
  //   - entries:       Array of { day, slot, subject, teacher, spec }
  // ------------------------------------------------------------

  const TEMPLATES = {

    // ==========================================================
    // DO 009 REFERENCE TEMPLATES (DepEd official samples)
    // ==========================================================

    "do009-ks1": {
      label: "DO 009 — Key Stage 1 (Grades 1-3)",
      category: "DepEd DO 009 Reference",
      slotPreset: "ks1",
      entries: [
        // Monday
        { day: "Monday",    slot: "ks1-p1",    subject: "HGP",            teacher: "", spec: "" },
        { day: "Monday",    slot: "ks1-p2",    subject: "Filipino",       teacher: "", spec: "" },
        { day: "Monday",    slot: "ks1-p3",    subject: "English",        teacher: "", spec: "" },
        { day: "Monday",    slot: "ks1-p4",    subject: "Mathematics",    teacher: "", spec: "" },
        { day: "Monday",    slot: "ks1-p5",    subject: "Makabansa",      teacher: "", spec: "" },
        // Tuesday
        { day: "Tuesday",   slot: "ks1-p1",    subject: "GMRC",           teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks1-p2",    subject: "Filipino",       teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks1-p3",    subject: "English",        teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks1-p4",    subject: "Mathematics",    teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks1-p5",    subject: "Science",        teacher: "", spec: "" },
        // Wednesday
        { day: "Wednesday", slot: "ks1-p1",    subject: "GMRC",           teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks1-p2",    subject: "Filipino",       teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks1-p3",    subject: "English",        teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks1-p4",    subject: "Makabansa",      teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks1-p5",    subject: "Science",        teacher: "", spec: "" },
        // Thursday
        { day: "Thursday",  slot: "ks1-p1",    subject: "GMRC",           teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks1-p2",    subject: "Filipino",       teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks1-p3",    subject: "English",        teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks1-p4",    subject: "Mathematics",    teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks1-p5",    subject: "Makabansa",      teacher: "", spec: "" },
        // Friday
        { day: "Friday",    slot: "ks1-p1",    subject: "GMRC",           teacher: "", spec: "" },
        { day: "Friday",    slot: "ks1-p2",    subject: "English",        teacher: "", spec: "" },
        { day: "Friday",    slot: "ks1-p3",    subject: "Mathematics",    teacher: "", spec: "" },
        { day: "Friday",    slot: "ks1-p4",    subject: "Makabansa",      teacher: "", spec: "" },
        { day: "Friday",    slot: "ks1-p5",    subject: "Science",        teacher: "", spec: "" },
      ],
    },

    "do009-ks2": {
      label: "DO 009 — Key Stage 2 (Grades 4-6)",
      category: "DepEd DO 009 Reference",
      slotPreset: "ks2",
      entries: [
        // Monday
        { day: "Monday",    slot: "ks2-p1",    subject: "HGP",                 teacher: "", spec: "" },
        { day: "Monday",    slot: "ks2-p2",    subject: "Filipino",            teacher: "", spec: "" },
        { day: "Monday",    slot: "ks2-p3",    subject: "English",             teacher: "", spec: "" },
        { day: "Monday",    slot: "ks2-p4",    subject: "Science",             teacher: "", spec: "" },
        { day: "Monday",    slot: "ks2-p5",    subject: "Mathematics",         teacher: "", spec: "" },
        { day: "Monday",    slot: "ks2-p6",    subject: "Araling Panlipunan",  teacher: "", spec: "" },
        // Tuesday
        { day: "Tuesday",   slot: "ks2-p1",    subject: "GMRC",                teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks2-p2",    subject: "English",             teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks2-p3",    subject: "Science",             teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks2-p4",    subject: "Mathematics",         teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks2-p5",    subject: "EPP",                 teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks2-p6",    subject: "MAPEH",               teacher: "", spec: "" },
        // Wednesday
        { day: "Wednesday", slot: "ks2-p1",    subject: "GMRC",                teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks2-p2",    subject: "Filipino",            teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks2-p3",    subject: "English",             teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks2-p4",    subject: "Araling Panlipunan",  teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks2-p5",    subject: "EPP",                 teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks2-p6",    subject: "MAPEH",               teacher: "", spec: "" },
        // Thursday
        { day: "Thursday",  slot: "ks2-p1",    subject: "GMRC",                teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks2-p2",    subject: "Filipino",            teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks2-p3",    subject: "Science",             teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks2-p4",    subject: "Mathematics",         teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks2-p5",    subject: "Araling Panlipunan",  teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks2-p6",    subject: "MAPEH",               teacher: "", spec: "" },
        // Friday
        { day: "Friday",    slot: "ks2-p1",    subject: "GMRC",                teacher: "", spec: "" },
        { day: "Friday",    slot: "ks2-p2",    subject: "Filipino",            teacher: "", spec: "" },
        { day: "Friday",    slot: "ks2-p3",    subject: "English",             teacher: "", spec: "" },
        { day: "Friday",    slot: "ks2-p4",    subject: "Mathematics",         teacher: "", spec: "" },
        { day: "Friday",    slot: "ks2-p5",    subject: "Araling Panlipunan",  teacher: "", spec: "" },
        { day: "Friday",    slot: "ks2-p6",    subject: "EPP",                 teacher: "", spec: "" },
      ],
    },

    "do009-ks3": {
      label: "DO 009 — Key Stage 3 (Grades 7-10)",
      category: "DepEd DO 009 Reference",
      slotPreset: "ks3",
      entries: [
        // Monday
        { day: "Monday",    slot: "ks3-p1",    subject: "HGP",                teacher: "", spec: "" },
        { day: "Monday",    slot: "ks3-p2",    subject: "English",            teacher: "", spec: "" },
        { day: "Monday",    slot: "ks3-p3",    subject: "Science",            teacher: "", spec: "" },
        { day: "Monday",    slot: "ks3-p4",    subject: "Mathematics",        teacher: "", spec: "" },
        { day: "Monday",    slot: "ks3-p5",    subject: "Araling Panlipunan", teacher: "", spec: "" },
        { day: "Monday",    slot: "ks3-p6",    subject: "EPP/TLE",            teacher: "", spec: "" },
        { day: "Monday",    slot: "ks3-p7",    subject: "MAPEH",              teacher: "", spec: "" },
        // Tuesday
        { day: "Tuesday",   slot: "ks3-p1",    subject: "Values Education",   teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks3-p2",    subject: "Filipino",           teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks3-p3",    subject: "Mathematics",        teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks3-p4",    subject: "Araling Panlipunan", teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks3-p5",    subject: "EPP/TLE",            teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks3-p6",    subject: "MAPEH",              teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks3-p7",    subject: "ARAL Program",       teacher: "", spec: "" },
        // Wednesday
        { day: "Wednesday", slot: "ks3-p1",    subject: "Values Education",   teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks3-p2",    subject: "Filipino",           teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks3-p3",    subject: "English",            teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks3-p4",    subject: "Science",            teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks3-p5",    subject: "Araling Panlipunan", teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks3-p6",    subject: "MAPEH",              teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks3-p7",    subject: "ARAL Program",       teacher: "", spec: "" },
        // Thursday
        { day: "Thursday",  slot: "ks3-p1",    subject: "Values Education",   teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks3-p2",    subject: "Filipino",           teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks3-p3",    subject: "English",            teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks3-p4",    subject: "Science",            teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks3-p5",    subject: "Mathematics",        teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks3-p6",    subject: "EPP/TLE",            teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks3-p7",    subject: "MAPEH",              teacher: "", spec: "" },
        // Friday
        { day: "Friday",    slot: "ks3-p1",    subject: "Values Education",   teacher: "", spec: "" },
        { day: "Friday",    slot: "ks3-p2",    subject: "Filipino",           teacher: "", spec: "" },
        { day: "Friday",    slot: "ks3-p3",    subject: "English",            teacher: "", spec: "" },
        { day: "Friday",    slot: "ks3-p4",    subject: "Science",            teacher: "", spec: "" },
        { day: "Friday",    slot: "ks3-p5",    subject: "Mathematics",        teacher: "", spec: "" },
        { day: "Friday",    slot: "ks3-p6",    subject: "EPP/TLE",            teacher: "", spec: "" },
        { day: "Friday",    slot: "ks3-p7",    subject: "Araling Panlipunan", teacher: "", spec: "" },
      ],
    },

    "do009-ks4": {
      label: "DO 009 — Key Stage 4 (SHS Grade 11-12)",
      category: "DepEd DO 009 Reference",
      slotPreset: "ks4",
      entries: [
        // Monday
        { day: "Monday",    slot: "ks4-p1",    subject: "Human Movement 1 (Elective)",     teacher: "", spec: "" },
        { day: "Monday",    slot: "ks4-p2",    subject: "Human Movement 1 (Elective)",     teacher: "", spec: "" },
        { day: "Monday",    slot: "ks4-p3",    subject: "Effective Communication",         teacher: "", spec: "" },
        { day: "Monday",    slot: "ks4-p4",    subject: "General Science",                 teacher: "", spec: "" },
        { day: "Monday",    slot: "ks4-p5",    subject: "General Mathematics",             teacher: "", spec: "" },
        { day: "Monday",    slot: "ks4-p6",    subject: "Pag-aaral ng Kasaysayan at Lipunang Pilipino", teacher: "", spec: "" },
        // Tuesday
        { day: "Tuesday",   slot: "ks4-p1",    subject: "Human Movement 1 (Elective)",     teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks4-p2",    subject: "Human Movement 1 (Elective)",     teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks4-p3",    subject: "Effective Communication",         teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks4-p4",    subject: "General Science",                 teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks4-p5",    subject: "Pag-aaral ng Kasaysayan at Lipunang Pilipino", teacher: "", spec: "" },
        { day: "Tuesday",   slot: "ks4-p6",    subject: "Life & Career Skills",            teacher: "", spec: "" },
        // Wednesday
        { day: "Wednesday", slot: "ks4-p1",    subject: "Human Movement 1 (Elective)",     teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks4-p2",    subject: "Human Movement 1 (Elective)",     teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks4-p3",    subject: "Pag-aaral ng Kasaysayan at Lipunang Pilipino", teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks4-p4",    subject: "Mabisang Komunikasyon",           teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks4-p5",    subject: "General Mathematics",             teacher: "", spec: "" },
        { day: "Wednesday", slot: "ks4-p6",    subject: "Life & Career Skills",            teacher: "", spec: "" },
        // Thursday
        { day: "Thursday",  slot: "ks4-p1",    subject: "Human Movement 1 (Elective)",     teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks4-p2",    subject: "Human Movement 1 (Elective)",     teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks4-p3",    subject: "Mabisang Komunikasyon",           teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks4-p4",    subject: "General Science",                 teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks4-p5",    subject: "General Mathematics",             teacher: "", spec: "" },
        { day: "Thursday",  slot: "ks4-p6",    subject: "Life & Career Skills",            teacher: "", spec: "" },
        // Friday
        { day: "Friday",    slot: "ks4-p1",    subject: "HGP",                             teacher: "", spec: "" },
        { day: "Friday",    slot: "ks4-p2",    subject: "General Science",                 teacher: "", spec: "" },
        { day: "Friday",    slot: "ks4-p3",    subject: "General Mathematics",             teacher: "", spec: "" },
        { day: "Friday",    slot: "ks4-p4",    subject: "Pag-aaral ng Kasaysayan at Lipunang Pilipino", teacher: "", spec: "" },
        { day: "Friday",    slot: "ks4-p5",    subject: "Life & Career Skills",            teacher: "", spec: "" },
      ],
    },

    // ==========================================================
    // MULTIGRADE REFERENCE TEMPLATES (DO 009 Tables 7-9)
    // ==========================================================

    "do009-mg12": {
      label: "DO 009 — Multigrade (Grades 1-2)",
      category: "DepEd DO 009 Reference",
      slotPreset: "mg12",
      entries: [
        // Monday
        { day: "Monday",    slot: "mg12-b1",    subject: "GMRC 1 & 2",                  teacher: "", spec: "" },
        { day: "Monday",    slot: "mg12-b2",    subject: "Reading and Literacy 1 / Filipino 2", teacher: "", spec: "" },
        { day: "Monday",    slot: "mg12-b3",    subject: "Language 1 / English 2",      teacher: "", spec: "" },
        { day: "Monday",    slot: "mg12-b4",    subject: "Language 1 / English 2",      teacher: "", spec: "" },
        { day: "Monday",    slot: "mg12-b5",    subject: "HGP",                         teacher: "", spec: "" },
        // Tuesday (repeat pattern — combined grades share same subject most days)
        { day: "Tuesday",   slot: "mg12-b1",    subject: "GMRC 1 & 2",                  teacher: "", spec: "" },
        { day: "Tuesday",   slot: "mg12-b2",    subject: "Reading and Literacy 1 / Filipino 2", teacher: "", spec: "" },
        { day: "Tuesday",   slot: "mg12-b3",    subject: "Language 1 / English 2",      teacher: "", spec: "" },
        { day: "Tuesday",   slot: "mg12-b4",    subject: "Language 1 / English 2",      teacher: "", spec: "" },
        { day: "Tuesday",   slot: "mg12-b5",    subject: "Library Work / Co-curricular", teacher: "", spec: "" },
        // Wednesday
        { day: "Wednesday", slot: "mg12-b1",    subject: "GMRC 1 & 2",                  teacher: "", spec: "" },
        { day: "Wednesday", slot: "mg12-b2",    subject: "Mathematics 1 & 2",           teacher: "", spec: "" },
        { day: "Wednesday", slot: "mg12-b3",    subject: "Makabansa 1 & 2",             teacher: "", spec: "" },
        { day: "Wednesday", slot: "mg12-b4",    subject: "Makabansa 1 & 2",             teacher: "", spec: "" },
        { day: "Wednesday", slot: "mg12-b5",    subject: "Library Work / Co-curricular", teacher: "", spec: "" },
        // Thursday
        { day: "Thursday",  slot: "mg12-b1",    subject: "GMRC 1 & 2",                  teacher: "", spec: "" },
        { day: "Thursday",  slot: "mg12-b2",    subject: "Mathematics 1 & 2",           teacher: "", spec: "" },
        { day: "Thursday",  slot: "mg12-b3",    subject: "Makabansa 1 & 2",             teacher: "", spec: "" },
        { day: "Thursday",  slot: "mg12-b4",    subject: "Makabansa 1 & 2",             teacher: "", spec: "" },
        { day: "Thursday",  slot: "mg12-b5",    subject: "Library Work / Co-curricular", teacher: "", spec: "" },
        // Friday (Consolidated Assessment Day)
        { day: "Friday",    slot: "mg12-b1",    subject: "GMRC 1 & 2",                  teacher: "", spec: "" },
        { day: "Friday",    slot: "mg12-b2",    subject: "Reading and Literacy 1 / Filipino 2", teacher: "", spec: "" },
        { day: "Friday",    slot: "mg12-b3",    subject: "Mathematics 1 & 2",           teacher: "", spec: "" },
        { day: "Friday",    slot: "mg12-b4",    subject: "Makabansa 1 & 2",             teacher: "", spec: "" },
        { day: "Friday",    slot: "mg12-b5",    subject: "Collaborative Session / Ancillary Tasks", teacher: "", spec: "" },
      ],
    },

    "do009-mg34": {
      label: "DO 009 — Multigrade (Grades 3-4)",
      category: "DepEd DO 009 Reference",
      slotPreset: "mg34",
      entries: [
        { day: "Monday",    slot: "mg34-b1", subject: "GMRC 3 & 4",                     teacher: "", spec: "" },
        { day: "Monday",    slot: "mg34-b2", subject: "Filipino 3 & 4",                 teacher: "", spec: "" },
        { day: "Monday",    slot: "mg34-b3", subject: "English 3 & 4",                  teacher: "", spec: "" },
        { day: "Monday",    slot: "mg34-b4", subject: "MAPEH 3 & 4",                    teacher: "", spec: "" },
        { day: "Monday",    slot: "mg34-b5", subject: "Makabansa 3 / AP 4",             teacher: "", spec: "" },
        { day: "Tuesday",   slot: "mg34-b1", subject: "GMRC 3 & 4",                     teacher: "", spec: "" },
        { day: "Tuesday",   slot: "mg34-b2", subject: "Filipino 3 & 4",                 teacher: "", spec: "" },
        { day: "Tuesday",   slot: "mg34-b3", subject: "English 3 & 4",                  teacher: "", spec: "" },
        { day: "Tuesday",   slot: "mg34-b4", subject: "MAPEH 3 & 4",                    teacher: "", spec: "" },
        { day: "Tuesday",   slot: "mg34-b5", subject: "Makabansa 3 / AP 4",             teacher: "", spec: "" },
        { day: "Wednesday", slot: "mg34-b1", subject: "GMRC 3 & 4",                     teacher: "", spec: "" },
        { day: "Wednesday", slot: "mg34-b2", subject: "Mathematics 3 & 4",              teacher: "", spec: "" },
        { day: "Wednesday", slot: "mg34-b3", subject: "Science 3 & 4",                  teacher: "", spec: "" },
        { day: "Wednesday", slot: "mg34-b4", subject: "MAPEH 3 & 4",                    teacher: "", spec: "" },
        { day: "Wednesday", slot: "mg34-b5", subject: "ARAL Reading 3 / EPP 4",         teacher: "", spec: "" },
        { day: "Thursday",  slot: "mg34-b1", subject: "GMRC 3 & 4",                     teacher: "", spec: "" },
        { day: "Thursday",  slot: "mg34-b2", subject: "Mathematics 3 & 4",              teacher: "", spec: "" },
        { day: "Thursday",  slot: "mg34-b3", subject: "Science 3 & 4",                  teacher: "", spec: "" },
        { day: "Thursday",  slot: "mg34-b4", subject: "MAPEH 3 & 4",                    teacher: "", spec: "" },
        { day: "Thursday",  slot: "mg34-b5", subject: "ARAL Reading 3 / EPP 4",         teacher: "", spec: "" },
        { day: "Friday",    slot: "mg34-b1", subject: "GMRC 3 & 4",                     teacher: "", spec: "" },
        { day: "Friday",    slot: "mg34-b2", subject: "Mathematics 3 & 4 / Filipino 3 & 4", teacher: "", spec: "" },
        { day: "Friday",    slot: "mg34-b3", subject: "Science 3 & 4 / English 3 & 4",  teacher: "", spec: "" },
        { day: "Friday",    slot: "mg34-b4", subject: "MAPEH 3 & 4",                    teacher: "", spec: "" },
        { day: "Friday",    slot: "mg34-b5", subject: "Collaborative Session / Ancillary Tasks", teacher: "", spec: "" },
      ],
    },

    "do009-mg56": {
      label: "DO 009 — Multigrade (Grades 5-6)",
      category: "DepEd DO 009 Reference",
      slotPreset: "mg56",
      entries: [
        { day: "Monday",    slot: "mg56-b1", subject: "GMRC 5 & 6",                teacher: "", spec: "" },
        { day: "Monday",    slot: "mg56-b2", subject: "English 5 & 6 / Math 5 & 6", teacher: "", spec: "" },
        { day: "Monday",    slot: "mg56-b3", subject: "Filipino 5 & 6 / Science 5 & 6", teacher: "", spec: "" },
        { day: "Monday",    slot: "mg56-b4", subject: "EPP 5 & 6 / AP 5 & 6",      teacher: "", spec: "" },
        { day: "Monday",    slot: "mg56-b5", subject: "MAPEH 5 & 6",               teacher: "", spec: "" },
        { day: "Tuesday",   slot: "mg56-b1", subject: "GMRC 5 & 6",                teacher: "", spec: "" },
        { day: "Tuesday",   slot: "mg56-b2", subject: "English 5 & 6 / Math 5 & 6", teacher: "", spec: "" },
        { day: "Tuesday",   slot: "mg56-b3", subject: "Filipino 5 & 6 / Science 5 & 6", teacher: "", spec: "" },
        { day: "Tuesday",   slot: "mg56-b4", subject: "EPP 5 & 6 / AP 5 & 6",      teacher: "", spec: "" },
        { day: "Tuesday",   slot: "mg56-b5", subject: "MAPEH 5 & 6",               teacher: "", spec: "" },
        { day: "Wednesday", slot: "mg56-b1", subject: "GMRC 5 & 6",                teacher: "", spec: "" },
        { day: "Wednesday", slot: "mg56-b2", subject: "Mathematics 5 & 6",         teacher: "", spec: "" },
        { day: "Wednesday", slot: "mg56-b3", subject: "Science 5 & 6",             teacher: "", spec: "" },
        { day: "Wednesday", slot: "mg56-b4", subject: "AP 5 & 6",                  teacher: "", spec: "" },
        { day: "Wednesday", slot: "mg56-b5", subject: "MAPEH 5 & 6",               teacher: "", spec: "" },
        { day: "Thursday",  slot: "mg56-b1", subject: "GMRC 5 & 6",                teacher: "", spec: "" },
        { day: "Thursday",  slot: "mg56-b2", subject: "Mathematics 5 & 6",         teacher: "", spec: "" },
        { day: "Thursday",  slot: "mg56-b3", subject: "Science 5 & 6",             teacher: "", spec: "" },
        { day: "Thursday",  slot: "mg56-b4", subject: "AP 5 & 6",                  teacher: "", spec: "" },
        { day: "Thursday",  slot: "mg56-b5", subject: "MAPEH 5 & 6",               teacher: "", spec: "" },
        { day: "Friday",    slot: "mg56-b1", subject: "GMRC 5 & 6",                teacher: "", spec: "" },
        { day: "Friday",    slot: "mg56-b2", subject: "English 5 & 6 / Math 5 & 6", teacher: "", spec: "" },
        { day: "Friday",    slot: "mg56-b3", subject: "Filipino 5 & 6 / Science 5 & 6", teacher: "", spec: "" },
        { day: "Friday",    slot: "mg56-b4", subject: "AP 5 & 6 / EPP 5 & 6",      teacher: "", spec: "" },
        { day: "Friday",    slot: "mg56-b5", subject: "MAPEH 5 & 6",               teacher: "", spec: "" },
      ],
    },

    // ==========================================================
    // KINDERGARTEN — DO 010 s. 2024 Blocks of Time
    // ==========================================================
    "do010-kinder": {
      label: "DO 010 — Kindergarten Blocks of Time",
      category: "DepEd DO 009 Reference",
      slotPreset: "kinder",
      entries: [
        // Note: Kindergarten doesn't use subject-per-period.
        // All blocks are activity-based. Subject code is the block name itself.
        { day: "Monday",    slot: "k-block-1", subject: "Arrival / Meeting Time",         teacher: "", spec: "" },
        { day: "Monday",    slot: "k-block-2", subject: "Meeting Time 2 / Prayer",        teacher: "", spec: "" },
        { day: "Monday",    slot: "k-block-3", subject: "Work Period 1",                  teacher: "", spec: "" },
        { day: "Monday",    slot: "k-block-5", subject: "Work Period 2",                  teacher: "", spec: "" },
        { day: "Monday",    slot: "k-block-6", subject: "Story Time",                     teacher: "", spec: "" },
        { day: "Monday",    slot: "k-block-7", subject: "Outdoor / Free Play",            teacher: "", spec: "" },
        { day: "Monday",    slot: "k-block-8", subject: "Indoor / Manipulative Play",     teacher: "", spec: "" },
        // Tuesday
        { day: "Tuesday",   slot: "k-block-1", subject: "Arrival / Meeting Time",         teacher: "", spec: "" },
        { day: "Tuesday",   slot: "k-block-2", subject: "Meeting Time 2 / Prayer",        teacher: "", spec: "" },
        { day: "Tuesday",   slot: "k-block-3", subject: "Work Period 1",                  teacher: "", spec: "" },
        { day: "Tuesday",   slot: "k-block-5", subject: "Work Period 2",                  teacher: "", spec: "" },
        { day: "Tuesday",   slot: "k-block-6", subject: "Story Time",                     teacher: "", spec: "" },
        { day: "Tuesday",   slot: "k-block-7", subject: "Outdoor / Free Play",            teacher: "", spec: "" },
        { day: "Tuesday",   slot: "k-block-8", subject: "Indoor / Manipulative Play",     teacher: "", spec: "" },
        // Wednesday
        { day: "Wednesday", slot: "k-block-1", subject: "Arrival / Meeting Time",         teacher: "", spec: "" },
        { day: "Wednesday", slot: "k-block-2", subject: "Meeting Time 2 / Prayer",        teacher: "", spec: "" },
        { day: "Wednesday", slot: "k-block-3", subject: "Work Period 1",                  teacher: "", spec: "" },
        { day: "Wednesday", slot: "k-block-5", subject: "Work Period 2",                  teacher: "", spec: "" },
        { day: "Wednesday", slot: "k-block-6", subject: "Story Time",                     teacher: "", spec: "" },
        { day: "Wednesday", slot: "k-block-7", subject: "Outdoor / Free Play",            teacher: "", spec: "" },
        { day: "Wednesday", slot: "k-block-8", subject: "Indoor / Manipulative Play",     teacher: "", spec: "" },
        // Thursday
        { day: "Thursday",  slot: "k-block-1", subject: "Arrival / Meeting Time",         teacher: "", spec: "" },
        { day: "Thursday",  slot: "k-block-2", subject: "Meeting Time 2 / Prayer",        teacher: "", spec: "" },
        { day: "Thursday",  slot: "k-block-3", subject: "Work Period 1",                  teacher: "", spec: "" },
        { day: "Thursday",  slot: "k-block-5", subject: "Work Period 2",                  teacher: "", spec: "" },
        { day: "Thursday",  slot: "k-block-6", subject: "Story Time",                     teacher: "", spec: "" },
        { day: "Thursday",  slot: "k-block-7", subject: "Outdoor / Free Play",            teacher: "", spec: "" },
        { day: "Thursday",  slot: "k-block-8", subject: "Indoor / Manipulative Play",     teacher: "", spec: "" },
        // Friday
        { day: "Friday",    slot: "k-block-1", subject: "Arrival / Meeting Time",         teacher: "", spec: "" },
        { day: "Friday",    slot: "k-block-2", subject: "Meeting Time 2 / Prayer",        teacher: "", spec: "" },
        { day: "Friday",    slot: "k-block-3", subject: "Work Period 1",                  teacher: "", spec: "" },
        { day: "Friday",    slot: "k-block-5", subject: "Work Period 2",                  teacher: "", spec: "" },
        { day: "Friday",    slot: "k-block-6", subject: "Story Time",                     teacher: "", spec: "" },
        { day: "Friday",    slot: "k-block-7", subject: "Outdoor / Free Play",            teacher: "", spec: "" },
        { day: "Friday",    slot: "k-block-8", subject: "Indoor / Manipulative Play",     teacher: "", spec: "" },
      ],
    },
  };

  // ------------------------------------------------------------
  // PUBLIC API
  // ------------------------------------------------------------
  window.ProgramTemplates = {
    TEMPLATES,
    SLOT_PRESETS,

    // Get all templates grouped by category
    getGrouped() {
      const groups = {};
      Object.entries(TEMPLATES).forEach(([key, tpl]) => {
        const cat = tpl.category || "Other";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({ key, ...tpl });
      });
      return groups;
    },

    // Get a single template by key
    get(key) {
      return TEMPLATES[key] || null;
    },

    // Get slot preset by name
    getSlotPreset(name) {
      return SLOT_PRESETS[name] || null;
    },
  };

})();