// ============================================================
// bulk-import.js
// Firestore writers for bulk operations
// ============================================================

(function () {
  "use strict";

  async function importSheets(sheets, term, onProgress) {
    const { db } = await import("./firebase-config.js");
    const {
      collection, getDocs, addDoc, doc, serverTimestamp,
    } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    let classesImported = 0;
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < sheets.length; i++) {
      const s = sheets[i];
      if (!s.classId || !s.entries.length) continue;

      if (onProgress) onProgress(i + 1, sheets.length, s.className || s.sheetName);

      try {
        const colRef = collection(db, "classes", s.classId, "program");
        const existingSnap = await getDocs(colRef);
        const existingKeys = new Set();
        existingSnap.forEach(d => {
          const e = d.data();
          if (Number(e.term) === term) {
            existingKeys.add(`${e.day}|${e.timeSlotId}|${e.subject}|${e.teacherUid || ""}`);
          }
        });

        let classInserted = 0;

        for (const e of s.entries) {
          const slotId = resolveSlotId(e.slotStart, e.slotEnd);
          if (!slotId) { errors++; continue; }

          const key = `${e.day}|${slotId}|${e.subject}|${e.teacher || ""}`;
          if (existingKeys.has(key)) { skipped++; continue; }

          try {
            await addDoc(colRef, {
              day: e.day,
              timeSlotId: slotId,
              term: Number(term),
              subject: e.subject,
              subjectName: e.subject,
              teacherUid: "",
              teacherName: e.teacher || "",
              specialization: e.specialization || "",
              room: "",
              entryType: "primary",
              groupIndex: 0,
              notes: "",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              createdBy: window.bkUser?.email || "",
            });
            inserted++;
            classInserted++;
            existingKeys.add(key);
          } catch (err) {
            console.error("[bulk-import] failed to insert:", err);
            errors++;
          }
        }

        if (classInserted > 0) classesImported++;
      } catch (err) {
        console.error("[bulk-import] failed on sheet:", s.sheetName, err);
        errors++;
      }
    }

    return { classesImported, inserted, skipped, errors };
  }

  function resolveSlotId(start, end) {
    // Match against schedule-config time slots
    const slots = window.TIME_SLOTS || [];
    const key = `${start}-${end}`;
    const match = slots.find(s => `${s.start}-${s.end}` === key);
    return match ? match.id : null;
  }

  async function bulkCopyTerms(classes, fromTerm, toTerms, onProgress) {
    const { db } = await import("./firebase-config.js");
    const {
      collection, getDocs, addDoc, serverTimestamp,
    } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    let classesProcessed = 0;
    let totalCopied = 0;
    let totalSkipped = 0;
    let errors = 0;

    for (let i = 0; i < classes.length; i++) {
      const cls = classes[i];
      if (onProgress) onProgress(i + 1, classes.length, cls.classLabel, { copied: totalCopied, skipped: totalSkipped });

      try {
        const colRef = collection(db, "classes", cls.id, "program");
        const allSnap = await getDocs(colRef);
        const all = allSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const sourceEntries = all.filter(e => Number(e.term) === Number(fromTerm));
        if (!sourceEntries.length) continue;

        for (const toTerm of toTerms) {
          const targetEntries = all.filter(e => Number(e.term) === Number(toTerm));
          const targetKeys = new Set(targetEntries.map(e =>
            `${e.day}|${e.timeSlotId}|${e.subject}|${e.teacherUid || ""}`
          ));

          for (const e of sourceEntries) {
            const key = `${e.day}|${e.timeSlotId}|${e.subject}|${e.teacherUid || ""}`;
            if (targetKeys.has(key)) { totalSkipped++; continue; }

            try {
              await addDoc(colRef, {
                day: e.day,
                timeSlotId: e.timeSlotId,
                term: Number(toTerm),
                subject: e.subject || "",
                subjectName: e.subjectName || e.subject || "",
                teacherUid: e.teacherUid || "",
                teacherName: e.teacherName || "",
                specialization: e.specialization || "",
                room: e.room || "",
                entryType: e.entryType || "primary",
                groupIndex: e.groupIndex || 0,
                notes: e.notes || "",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: window.bkUser?.email || "",
                copiedFromTerm: Number(fromTerm),
              });
              totalCopied++;
              targetKeys.add(key);
            } catch (err) {
              console.error("[bulk-copy] insert failed:", err);
              errors++;
            }
          }
        }

        classesProcessed++;
      } catch (err) {
        console.error("[bulk-copy] failed on class:", cls.classLabel, err);
        errors++;
      }
    }

    return { classesProcessed, totalCopied, totalSkipped, errors };
  }

  window.BulkImport = { importSheets, bulkCopyTerms };
})();