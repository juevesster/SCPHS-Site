// specializations.js — Complete specialization library for Philippine public schools.
// Based on DepEd TVL (Technical-Vocational-Livelihood) and TLE (Technology and Livelihood Education) curriculum.
// Organized by strand so schools can pick from what they actually offer.

// ============================================================
// SPECIALIZATION LIBRARY
// ============================================================

export const SPECIALIZATION_GROUPS = {

  // ==========================================================
  // JHS TLE — GRADES 7-10 (4 Strands)
  // ==========================================================

  "JHS-TLE-Industrial-Arts": {
    label: "🏗️ JHS TLE — Industrial Arts",
    shortLabel: "Industrial Arts",
    level: "JHS",
    strand: "Industrial Arts",
    items: [
      "Automotive Servicing",
      "Carpentry and Masonry",
      "Construction Painting",
      "Drafting Technology",
      "EIM (Electrical Installation & Maintenance)",
      "Electronics Servicing",
      "Plumbing",
      "Refrigeration and Air Conditioning (RAC)",
      "SMAW (Shielded Metal Arc Welding)",
      "Tile Setting",
      "Welding and Fabrication",
    ]
  },

  "JHS-TLE-Home-Economics": {
    label: "🏠 JHS TLE — Home Economics",
    shortLabel: "Home Economics",
    level: "JHS",
    strand: "Home Economics",
    items: [
      "Baking and Pastry Production",
      "Barbering",
      "Beauty Care / Cosmetology",
      "Bread and Pastry Production",
      "Caregiving",
      "Commercial Cooking / Cookery",
      "Dressmaking / Tailoring",
      "Food and Beverage Services",
      "Food Processing",
      "Front Office Services",
      "Handicraft",
      "Housekeeping",
      "Nail Care",
      "Needlecraft",
      "Tourism and Travel Services",
    ]
  },

  "JHS-TLE-ICT": {
    label: "💻 JHS TLE — ICT",
    shortLabel: "ICT",
    level: "JHS",
    strand: "ICT",
    items: [
      "Animation",
      "Broadband Installation",
      "Computer Programming",
      "Computer Systems Servicing (CSS)",
      "Contact Center Services",
      "Illustration",
      "Medical Transcription",
      "Networking",
      "Technical Drafting",
      "Web Development",
    ]
  },

  "JHS-TLE-Agri-Fishery": {
    label: "🌾 JHS TLE — Agri-Fishery Arts",
    shortLabel: "Agri-Fishery Arts",
    level: "JHS",
    strand: "Agri-Fishery Arts",
    items: [
      "Agricultural Crops Production",
      "Animal Production",
      "Aquaculture",
      "Fish Capture",
      "Fish Processing",
      "Floriculture",
      "Food Processing",
      "Horticulture",
      "Landscape Installation",
      "Organic Agriculture",
      "Pest Management",
      "Rice Machinery Operation",
      "Soil Science",
    ]
  },

  // ==========================================================
  // SHS TechPro — 10 CLUSTERS (DO 012, s. 2026)
  // ==========================================================

  "SHS-TechPro-Automotive": {
    label: "🚗 SHS TechPro — Automotive & Small Engine",
    shortLabel: "Automotive",
    level: "SHS",
    cluster: "Automotive and Small Engine Technologies",
    items: [
      "Automotive Servicing NC I",
      "Automotive Servicing NC II",
      "Automotive Servicing NC III",
      "Driving NC I",
      "Driving NC II",
      "Driving NC III",
      "Motorcycle/Small Engine Servicing NC I",
      "Motorcycle/Small Engine Servicing NC II",
    ]
  },

  "SHS-TechPro-ICT": {
    label: "💻 SHS TechPro — ICT",
    shortLabel: "ICT",
    level: "SHS",
    cluster: "Information and Communications Technology",
    items: [
      "Animation NC II",
      "Broadband Installation NC II",
      "Computer Systems Servicing NC II",
      "Contact Center Services NC II",
      "Programming (.NET) NC III",
      "Programming (Java) NC III",
      "Web Development NC III",
    ]
  },

  "SHS-TechPro-Agri-Fishery": {
    label: "🌾 SHS TechPro — Agri-Fishery Arts",
    shortLabel: "Agri-Fishery",
    level: "SHS",
    cluster: "Agri-Fishery Arts",
    items: [
      "Agricultural Crops Production NC I",
      "Agricultural Crops Production NC II",
      "Agricultural Crops Production NC III",
      "Animal Production NC I",
      "Animal Production NC II",
      "Animal Production NC III",
      "Aquaculture NC I",
      "Aquaculture NC II",
      "Fish Processing NC II",
      "Food Processing NC I",
      "Food Processing NC II",
      "Organic Agriculture Production NC II",
    ]
  },

  "SHS-TechPro-Business-Food": {
    label: "🍽️ SHS TechPro — Business & Food Innovation",
    shortLabel: "Business & Food",
    level: "SHS",
    cluster: "Business and Food Innovation",
    items: [
      "Barista NC II",
      "Bookkeeping NC III",
      "Bread and Pastry Production NC II",
      "Commercial Cooking NC II",
      "Commercial Cooking NC III",
      "Commercial Cooking NC IV",
      "Cookery NC II",
      "Food and Beverage Services NC II",
      "Food and Beverage Services NC III",
      "Food and Beverage Services NC IV",
      "Front Office Services NC II",
      "Housekeeping NC II",
      "Housekeeping NC III",
    ]
  },

  "SHS-TechPro-Construction": {
    label: "🏗️ SHS TechPro — Construction & Built Environment",
    shortLabel: "Construction",
    level: "SHS",
    cluster: "Construction and Built Environment",
    items: [
      "Carpentry NC I",
      "Carpentry NC II",
      "Carpentry NC III",
      "Construction Painting NC I",
      "Construction Painting NC II",
      "Masonry NC I",
      "Masonry NC II",
      "Masonry NC III",
      "Plumbing NC I",
      "Plumbing NC II",
      "Plumbing NC III",
      "SMAW NC I",
      "SMAW NC II",
      "SMAW NC III",
      "SMAW NC IV",
      "Tile Setting NC II",
    ]
  },

  "SHS-TechPro-Creative-Arts": {
    label: "🎨 SHS TechPro — Creative Arts & Design",
    shortLabel: "Creative Arts",
    level: "SHS",
    cluster: "Creative Arts and Design",
    items: [
      "Animation NC II",
      "Fashion Design NC III",
      "Graphic Design",
      "Illustration NC II",
      "Visual Graphic Design NC III",
    ]
  },

  "SHS-TechPro-Hospitality-Tourism": {
    label: "🏨 SHS TechPro — Hospitality & Tourism",
    shortLabel: "Hospitality & Tourism",
    level: "SHS",
    cluster: "Hospitality and Tourism",
    items: [
      "Bartending NC II",
      "Food and Beverage Services NC II",
      "Food and Beverage Services NC III",
      "Food and Beverage Services NC IV",
      "Front Office Services NC II",
      "Housekeeping NC II",
      "Housekeeping NC III",
      "Tour Guiding Services NC II",
      "Tourism Promotion Services NC II",
      "Travel Services NC II",
    ]
  },

  "SHS-TechPro-Industrial": {
    label: "⚙️ SHS TechPro — Industrial Technologies",
    shortLabel: "Industrial",
    level: "SHS",
    cluster: "Industrial Technologies",
    items: [
      "EIM NC II",
      "EIM NC III",
      "EIM NC IV",
      "Electronics Products Assembly Servicing NC II",
      "Electronics Servicing NC I",
      "Electronics Servicing NC II",
      "Electronics Servicing NC III",
      "Electronics Servicing NC IV",
      "Mechatronics Servicing NC II",
      "Refrigeration and Air Conditioning Servicing NC I",
      "Refrigeration and Air Conditioning Servicing NC II",
      "Refrigeration and Air Conditioning Servicing NC III",
      "Refrigeration and Air Conditioning Servicing NC IV",
    ]
  },

  "SHS-TechPro-Maritime": {
    label: "🚢 SHS TechPro — Maritime",
    shortLabel: "Maritime",
    level: "SHS",
    cluster: "Maritime",
    items: [
      "Marine Deck Rating NC I",
      "Marine Engine Rating NC I",
      "Ship's Catering Servicing NC II",
    ]
  },

  "SHS-TechPro-Human-Care": {
    label: "💆 SHS TechPro — Human Care",
    shortLabel: "Human Care",
    level: "SHS",
    cluster: "Human Care",
    items: [
      "Caregiving NC II",
      "Massage Therapy NC II",
      "Beauty Care NC II",
      "Hairdressing NC II",
      "Nail Care NC II",
      "Wellness Massage NC II",
    ]
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get all specialization groups, optionally filtered by level.
 */
export function listSpecializationGroups(level = null) {
  const entries = Object.entries(SPECIALIZATION_GROUPS);
  const filtered = level
    ? entries.filter(([, g]) => g.level === level)
    : entries;

  return filtered.map(([key, g]) => ({
    key,
    label: g.label,
    shortLabel: g.shortLabel,
    level: g.level,
    itemCount: g.items.length,
  }));
}

/**
 * Get all specializations for a specific group.
 */
export function getSpecializationsForGroup(groupKey) {
  return SPECIALIZATION_GROUPS[groupKey]?.items || [];
}

/**
 * Get a flat list of ALL specializations (deduplicated).
 */
export function getAllSpecializations() {
  const set = new Set();
  Object.values(SPECIALIZATION_GROUPS).forEach(g => {
    g.items.forEach(item => set.add(item));
  });
  return Array.from(set).sort();
}

/**
 * Find which group a specialization belongs to.
 */
export function findSpecializationGroup(specName) {
  for (const [key, group] of Object.entries(SPECIALIZATION_GROUPS)) {
    if (group.items.includes(specName)) {
      return { key, ...group };
    }
  }
  return null;
}

/**
 * Get the display label for a specialization group by key.
 */
export function getGroupLabel(groupKey) {
  return SPECIALIZATION_GROUPS[groupKey]?.label || groupKey;
}

// ============================================================
// SUBJECT GROUPS — used by program.html subject dropdown
// ============================================================

export const SUBJECT_GROUPS = {

  "Core Subjects": {
    label: "📚 Core Subjects",
    items: [
      // Filipino
      "FIL7", "FIL8", "FIL9", "FIL10",
      // English
      "ENG7", "ENG8", "ENG9", "ENG10",
      // Mathematics
      "MATH7", "MATH8", "MATH9", "MATH10",
      // Science
      "SCI7", "SCI8", "SCI9", "SCI10",
      // Araling Panlipunan
      "AP7", "AP8", "AP9", "AP10",
      // MAPEH
      "MAPEH7", "MAPEH8", "MAPEH9", "MAPEH10",
      // Edukasyon sa Pagpapakatao
      "ESP7", "ESP8", "ESP9", "ESP10",
    ]
  },

  "Junior High TLE": {
    label: "🔧 Junior High TLE",
    items: [
      "TLE7", "TLE8", "TLE9", "TLE10",
    ]
  },

  "TLE with Specialization": {
    label: "🎯 TLE with Specialization",
    items: [
      "TLE-ELECTRONICS",
      "TLE-COOKERY",
      "TLE-DRESSMAKING",
      "TLE-CARPENTRY",
      "TLE-ICT",
      "TLE-AUTOMOTIVE",
      "TLE-EIM",
      "TLE-WELDING",
      "TLE-PLUMBING",
      "TLE-ANIMATION",
      "TLE-CSS",
      "TLE-PROGRAMMING",
      "TLE-CROP-PRODUCTION",
      "TLE-ANIMAL-PRODUCTION",
      "TLE-BREAD-PASTRY",
      "TLE-BEAUTY-CARE",
    ]
  },

  "SHS TechPro (NC Levels)": {
    label: "🎓 SHS TechPro (NC Levels)",
    items: [
      "Automotive Servicing NC I",
      "Automotive Servicing NC II",
      "Automotive Servicing NC III",
      "Computer Systems Servicing NC II",
      "Programming (.NET) NC III",
      "Programming (Java) NC III",
      "Web Development NC III",
      "Animation NC II",
      "Cookery NC II",
      "Bread and Pastry Production NC II",
      "Food and Beverage Services NC II",
      "EIM NC II",
      "SMAW NC I",
      "SMAW NC II",
      "Carpentry NC II",
      "Dressmaking NC II",
      "Caregiving NC II",
      "Crop Production NC II",
    ]
  },

  "Special Programs": {
    label: "⭐ Special Programs",
    items: [
      "HGP",
      "ARAL",
      "Homeroom Guidance Program",
    ]
  },

  "SHS Core Subjects": {
    label: "📖 SHS Core",
    items: [
      "Oral Communication",
      "Reading and Writing",
      "Komunikasyon at Pananaliksik",
      "Pagbasa at Pagsusuri",
      "21st Century Literature",
      "General Mathematics",
      "Statistics and Probability",
      "Earth and Life Science",
      "Physical Science",
      "Personal Development",
      "UCSP",
      "PEH",
      "MIL",
      "Contemporary Philippine Arts",
      "Empowerment Technologies",
      "Practical Research 1",
      "Practical Research 2",
    ]
  },

  "Custom": {
    label: "✏️ Custom (type your own)",
    items: [
      "__CUSTOM__",  // sentinel for custom input
    ]
  }
};

// ------------------------------------------------------------
// Get subject list for a specific group
// ------------------------------------------------------------
export function getSubjectsForGroup(groupKey) {
  return SUBJECT_GROUPS[groupKey]?.items || [];
}

// ------------------------------------------------------------
// Get flat list of all subjects (deduplicated)
// ------------------------------------------------------------
export function getAllSubjects() {
  const set = new Set();
  Object.values(SUBJECT_GROUPS).forEach(g => {
    g.items.forEach(item => {
      if (item !== "__CUSTOM__") set.add(item);
    });
  });
  return Array.from(set).sort();
}

// ------------------------------------------------------------
// Get the icon/color for a specialization
// ------------------------------------------------------------
export function getSpecializationColor(spec) {
  const s = String(spec || "").toLowerCase();
  if (s.includes("electronic"))  return { bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6" };
  if (s.includes("cookery"))     return { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" };
  if (s.includes("dressmaking")) return { bg: "#fce7f3", border: "#ec4899", text: "#9d174d" };
  if (s.includes("carpentry"))   return { bg: "#d1fae5", border: "#10b981", text: "#065f46" };
  if (s.includes("ict") || s.includes("css")) return { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" };
  if (s.includes("automotive"))  return { bg: "#fed7aa", border: "#f97316", text: "#9a3412" };
  if (s.includes("weld") || s.includes("smaw")) return { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" };
  if (s.includes("plumb"))       return { bg: "#cffafe", border: "#06b6d4", text: "#155e75" };
  if (s.includes("animation"))   return { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" };
  if (s.includes("electrical") || s.includes("eim")) return { bg: "#fef9c3", border: "#eab308", text: "#854d0e" };
  if (s.includes("agri") || s.includes("crop"))      return { bg: "#ecfccb", border: "#84cc16", text: "#3f6212" };
  if (s.includes("bread") || s.includes("pastry"))   return { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" };
  if (s.includes("beauty") || s.includes("care"))    return { bg: "#fce7f3", border: "#ec4899", text: "#9d174d" };
  return { bg: "#f9fafb", border: "#cbd5e1", text: "#475569" };
}