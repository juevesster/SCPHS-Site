// assets/js/ecr-weights.js
// DO 015, s. 2026 + Strengthened SHS + DO 009 3-Term
// Single source of truth for ECR, Smart Checker, and Summary of Grades

export const WEIGHTS = {
  // Elementary + JHS (DO 015)
  elem_jhs_core:   { ww: 20, pt: 50, ex: 30, exSplit: { st1: 0.30, st2: 0.30, te: 0.40 } },
  elem_jhs_mapeh:  { ww: 20, pt: 60, ex: 20, exSplit: { st1: 0.30, st2: 0.30, te: 0.40 } },
  elem_jhs_epp:    { ww: 20, pt: 60, ex: 20, exSplit: { st1: 0.30, st2: 0.30, te: 0.40 } },

  // Strengthened SHS (DO 015)
  shs_core:            { ww: 20, pt: 50, ex: 30, exSplit: { st1: 0.30, st2: 0.30, te: 0.40 } },
  shs_arts_sports:     { ww: 20, pt: 60, ex: 20, exSplit: { st1: 0.30, st2: 0.30, te: 0.40 } },
  shs_techpro:         { ww: 15, pt: 65, ex: 20, exSplit: { st1: 0.30, st2: 0.30, te: 0.40 } },
  shs_field_exposure:  { ww: 15, pt: 70, ex: 15, exSplit: { te: 1.00 } },
  shs_research:        { ww: 40, pt: 60, ex: 0,  exSplit: null },
  shs_work_immersion:  { ww: 20, pt: 80, ex: 0,  exSplit: null },
};

// DO 015 Adjusted Transmutation Table (SY 2026-2027)
// IG 70.00 → TG 75
export const TRANSMUTATION_DO015 = [
  [99.50, 100.00, 100], [98.32, 99.49, 99], [97.14, 98.31, 98],
  [95.96, 97.13, 97],  [94.78, 95.95, 96], [93.60, 94.77, 95],
  [92.42, 93.59, 94],  [91.24, 92.41, 93], [90.06, 91.23, 92],
  [88.88, 90.05, 91],  [87.70, 88.87, 90], [86.52, 87.69, 89],
  [85.34, 86.51, 88],  [84.16, 85.33, 87], [82.98, 84.15, 86],
  [81.80, 82.97, 85],  [80.62, 81.79, 84], [79.44, 80.61, 83],
  [78.26, 79.43, 82],  [77.08, 78.25, 81], [75.90, 77.07, 80],
  [74.72, 75.89, 79],  [73.54, 74.71, 78], [72.36, 73.53, 77],
  [71.18, 72.35, 76],  [70.00, 71.17, 75],
  [65.34, 69.99, 74],  [60.67, 65.33, 73], [56.01, 60.66, 72],
  [51.34, 56.00, 71],  [46.67, 51.33, 70], [42.01, 46.66, 69],
  [37.34, 42.00, 68],  [32.68, 37.33, 67], [28.01, 32.67, 66],
  [23.35, 28.00, 65],  [18.68, 23.34, 64], [14.01, 18.67, 63],
  [9.35, 14.00, 62],   [4.68, 9.34, 61],   [0.00, 4.67, 60],
];

export const DESCRIPTORS = [
  [90, 100, "Advancing"],
  [80, 89,  "Benchmarking"],
  [75, 79,  "Connecting"],
  [65, 74,  "Developing"],
  [0,  64,  "Emerging"],
];

// Derive subject group from your existing subjects/{code} metadata
export function getSubjectGroup(subject) {
  const { type, family, curriculum, level, cluster } = subject || {};

  if (curriculum === "Strengthened-SHS") {
    if (type === "techpro") return "shs_techpro";
    if (type === "research") return "shs_research";
    if (type === "work_immersion" || family === "Work Immersion") return "shs_work_immersion";
    if (cluster === "FIELD-EXP") return "shs_field_exposure";
    if (family === "Sports") return "shs_arts_sports";
    return "shs_core";
  }

  if (curriculum === "MATATAG") {
    const lvl = Number(level);
    if (lvl >= 1 && lvl <= 10) {
      if (family === "MAPEH") return "elem_jhs_mapeh";
      if (family === "TLE" || family === "EPP") return "elem_jhs_epp";
      return "elem_jhs_core";
    }
  }

  return "elem_jhs_core";
}

export function getWeights(subject) {
  return WEIGHTS[getSubjectGroup(subject)];
}

export function transmute(ig) {
  const g = Number(ig) || 0;
  for (const [min, max, tg] of TRANSMUTATION_DO015) {
    if (g >= min && g <= max) return tg;
  }
  return g >= 100 ? 100 : 60;
}

export function describe(tg) {
  for (const [min, max, label] of DESCRIPTORS) {
    if (tg >= min && tg <= max) return label;
  }
  return "Emerging";
}

// Core computation — used by ECR, Smart Checker, Summary
export function computeECR({ wwItems, ptItems, stItems, weights }) {
  const sum = arr => arr.reduce((a, b) => a + (Number(b?.score) || 0), 0);
  const sumMax = arr => arr.reduce((a, b) => a + (Number(b?.max) || 0), 0);

  const wwTotal = sum(wwItems || []);
  const wwMax   = sumMax(wwItems || []);
  const ptTotal = sum(ptItems || []);
  const ptMax   = sumMax(ptItems || []);

  const wwPs = wwMax > 0 ? (wwTotal / wwMax) * 100 : 0;
  const ptPs = ptMax > 0 ? (ptTotal / ptMax) * 100 : 0;

  let exPs = 0, stTotal = 0, stMax = 0;
  if (weights.ex > 0 && stItems) {
    const st1 = stItems.st1 || { score: 0, max: 0 };
    const st2 = stItems.st2 || { score: 0, max: 0 };
    const te  = stItems.te  || { score: 0, max: 0 };
    const st1Ps = st1.max > 0 ? (st1.score / st1.max) * 100 : 0;
    const st2Ps = st2.max > 0 ? (st2.score / st2.max) * 100 : 0;
    const tePs  = te.max  > 0 ? (te.score  / te.max)  * 100 : 0;

    const split = weights.exSplit || { st1: 0.30, st2: 0.30, te: 0.40 };
    exPs = (st1Ps * (split.st1 || 0)) + (st2Ps * (split.st2 || 0)) + (tePs * (split.te || 0));
    stTotal = st1.score + st2.score + te.score;
    stMax   = st1.max + st2.max + te.max;
  }

  const wwWs = wwPs * (weights.ww / 100);
  const ptWs = ptPs * (weights.pt / 100);
  const exWs = exPs * (weights.ex / 100);
  const initialGrade = wwWs + ptWs + exWs;
  const tg = transmute(initialGrade);

  return {
    wwTotal, wwMax, wwPs: r2(wwPs), wwWs: r2(wwWs),
    ptTotal, ptMax, ptPs: r2(ptPs), ptWs: r2(ptWs),
    stTotal, stMax, exPs: r2(exPs), exWs: r2(exWs),
    initialGrade: r2(initialGrade),
    termGrade: tg,
    descriptor: describe(tg),
  };
}

function r2(n) { return Math.round((Number(n) || 0) * 100) / 100; }