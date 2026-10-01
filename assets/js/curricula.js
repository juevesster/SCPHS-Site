// curricula.js — Curriculum and subject library for Philippine basic education.
// Supports: K-12, MATATAG, Strengthened SHS.
// Data-driven design: update subjects here without touching other code.

// ============================================================
// CURRICULUM DEFINITIONS
// ============================================================

export const CURRICULA = {

  // ----------------------------------------------------------
  // MATATAG Curriculum (DepEd Order 010, s. 2024)
  // Applies to Kindergarten - Grade 10 (phased)
  // ----------------------------------------------------------
  "MATATAG": {
    label: "MATATAG Curriculum",
    description: "DepEd Order No. 010, s. 2024 — K to 10",
    grades: {
      "Kindergarten": {
        subjects: [
          "Language, Literacy, and Communication",
          "Mathematics",
          "Makabansa",
          "GMRC and Health",
          "Arts and Physical Education"
        ]
      },
      "Grade 1": {
        subjects: [
          "Language, Literacy, and Communication",
          "Mathematics",
          "Makabansa",
          "GMRC and Health",
          "Arts and Physical Education"
        ]
      },
      "Grade 2": {
        subjects: [
          "Language, Literacy, and Communication",
          "Mathematics",
          "Makabansa",
          "GMRC and Health",
          "Arts and Physical Education"
        ]
      },
      "Grade 3": {
        subjects: [
          "Language, Literacy, and Communication",
          "Mathematics",
          "Makabansa",
          "GMRC and Health",
          "Arts and Physical Education"
        ]
      },
      "Grade 4": {
        subjects: [
          "Filipino", "English", "Mathematics", "Science",
          "Araling Panlipunan", "MAPEH", "EPP/TLE",
          "Edukasyon sa Pagpapakatao", "GMRC/Values"
        ]
      },
      "Grade 5": {
        subjects: [
          "Filipino", "English", "Mathematics", "Science",
          "Araling Panlipunan", "MAPEH", "EPP/TLE",
          "Edukasyon sa Pagpapakatao", "GMRC/Values"
        ]
      },
      "Grade 6": {
        subjects: [
          "Filipino", "English", "Mathematics", "Science",
          "Araling Panlipunan", "MAPEH", "EPP/TLE",
          "Edukasyon sa Pagpapakatao", "GMRC/Values"
        ]
      },
      "Grade 7": {
        subjects: [
          "Filipino", "English", "Mathematics", "Science",
          "Araling Panlipunan", "MAPEH", "TLE",
          "Edukasyon sa Pagpapakatao"
        ]
      },
      "Grade 8": {
        subjects: [
          "Filipino", "English", "Mathematics", "Science",
          "Araling Panlipunan", "MAPEH", "TLE",
          "Edukasyon sa Pagpapakatao"
        ]
      },
      "Grade 9": {
        subjects: [
          "Filipino", "English", "Mathematics", "Science",
          "Araling Panlipunan", "MAPEH", "TLE",
          "Edukasyon sa Pagpapakatao"
        ]
      },
      "Grade 10": {
        subjects: [
          "Filipino", "English", "Mathematics", "Science",
          "Araling Panlipunan", "MAPEH", "TLE",
          "Edukasyon sa Pagpapakatao"
        ]
      }
    }
  },

  // ----------------------------------------------------------
  // K-12 Curriculum (legacy — for schools still transitioning)
  // ----------------------------------------------------------
  "K-12": {
    label: "K-12 Curriculum (Legacy)",
    description: "DepEd K-12 Curriculum — for schools in transition",
    grades: {
      "Kindergarten": {
        subjects: [
          "Language, Literacy, and Communication",
          "Mathematics",
          "Understanding the Physical and Natural Environment",
          "Social and Emotional Development",
          "Values Development",
          "Physical Health and Motor Development",
          "Creative Arts",
          "Filipino",
          "Mother Tongue"
        ]
      },
      "Grade 1": {
        subjects: [
          "Mother Tongue", "Filipino", "English", "Mathematics",
          "Araling Panlipunan", "Edukasyon sa Pagpapakatao",
          "MAPEH"
        ]
      },
      "Grade 2": {
        subjects: [
          "Mother Tongue", "Filipino", "English", "Mathematics",
          "Araling Panlipunan", "Edukasyon sa Pagpapakatao",
          "MAPEH"
        ]
      },
      "Grade 3": {
        subjects: [
          "Mother Tongue", "Filipino", "English", "Mathematics",
          "Araling Panlipunan", "Edukasyon sa Pagpapakatao",
          "MAPEH"
        ]
      },
      "Grade 4": {
        subjects: [
          "Filipino", "English", "Mathematics", "Science",
          "Araling Panlipunan", "Edukasyon sa Pagpapakatao",
          "MAPEH", "EPP"
        ]
      },
      "Grade 5": {
        subjects: [
          "Filipino", "English", "Mathematics", "Science",
          "Araling Panlipunan", "Edukasyon sa Pagpapakatao",
          "MAPEH", "EPP"
        ]
      },
      "Grade 6": {
        subjects: [
          "Filipino", "English", "Mathematics", "Science",
          "Araling Panlipunan", "Edukasyon sa Pagpapakatao",
          "MAPEH", "TLE"
        ]
      },
      "Grade 7": {
        subjects: [
          "Filipino", "English", "Mathematics", "Science",
          "Araling Panlipunan", "MAPEH", "TLE",
          "Edukasyon sa Pagpapakatao"
        ]
      },
      "Grade 8": {
        subjects: [
          "Filipino", "English", "Mathematics", "Science",
          "Araling Panlipunan", "MAPEH", "TLE",
          "Edukasyon sa Pagpapakatao"
        ]
      },
      "Grade 9": {
        subjects: [
          "Filipino", "English", "Mathematics", "Science",
          "Araling Panlipunan", "MAPEH", "TLE",
          "Edukasyon sa Pagpapakatao"
        ]
      },
      "Grade 10": {
        subjects: [
          "Filipino", "English", "Mathematics", "Science",
          "Araling Panlipunan", "MAPEH", "TLE",
          "Edukasyon sa Pagpapakatao"
        ]
      }
    }
  },

  // ----------------------------------------------------------
  // Strengthened SHS Curriculum (DepEd Memo 012, s. 2026)
  // Applies to Grades 11-12 (phased — Grade 11 in SY 2026-2027)
  // ----------------------------------------------------------
  "Strengthened-SHS": {
    label: "Strengthened SHS Curriculum",
    description: "DepEd Memo No. 012, s. 2026 — Grades 11-12",
    grades: {
      "Grade 11": {
        subjects: [
          // 5 Core Subjects (all taken in Grade 11)
          "Effective Communication",
          "Life and Career Skills",
          "General Mathematics",
          "General Science",
          "Philippine History and Society"
        ],
        tracks: {
          "Academic": [
            "Arts, Social Sciences, and Humanities",
            "Business and Entrepreneurship",
            "Science, Technology, Engineering, and Mathematics (STEM)",
            "Sports, Health, and Wellness",
            "Field Experience"
          ],
          "TechPro": [
            "Automotive and Small Engine Technologies",
            "Information and Communications Technology (ICT)",
            "Agri-Fishery Arts",
            "Business and Food Innovation",
            "Construction and Built Environment",
            "Creative Arts and Design",
            "Hospitality and Tourism",
            "Industrial Technologies",
            "Maritime",
            "Human Care"
          ]
        }
      },
      "Grade 12": {
        subjects: [
          // Core Subjects (continuing)
          "Effective Communication",
          "Life and Career Skills",
          "General Mathematics",
          "General Science",
          "Philippine History and Society"
        ],
        tracks: {
          "Academic": [
            "Arts, Social Sciences, and Humanities",
            "Business and Entrepreneurship",
            "Science, Technology, Engineering, and Mathematics (STEM)",
            "Sports, Health, and Wellness",
            "Field Experience"
          ],
          "TechPro": [
            "Automotive and Small Engine Technologies",
            "Information and Communications Technology (ICT)",
            "Agri-Fishery Arts",
            "Business and Food Innovation",
            "Construction and Built Environment",
            "Creative Arts and Design",
            "Hospitality and Tourism",
            "Industrial Technologies",
            "Maritime",
            "Human Care"
          ]
        }
      }
    }
  },

  // ----------------------------------------------------------
  // Old SHS Curriculum (legacy — for Grade 12 in transition)
  // ----------------------------------------------------------
  "Legacy-SHS": {
    label: "SHS Curriculum (Legacy)",
    description: "Old SHS Curriculum — for Grade 12 in transition",
    grades: {
      "Grade 11": {
        subjects: [
          "Oral Communication", "Reading and Writing",
          "Komunikasyon at Pananaliksik", "Pagbasa at Pagsusuri",
          "21st Century Literature", "General Mathematics",
          "Statistics and Probability", "Earth and Life Science",
          "Physical Science", "Personal Development", "UCSP",
          "PEH", "MIL", "Contemporary Philippine Arts",
          "Empowerment Technologies", "Practical Research 1",
          "Practical Research 2"
        ],
        tracks: {
          "STEM": ["Pre-Calculus", "Basic Calculus", "General Biology 1 & 2", "General Chemistry 1 & 2", "General Physics 1 & 2", "Research Capstone"],
          "ABM": ["Fundamentals of ABM 1 & 2", "Business Mathematics", "Business Finance", "Organization and Management", "Principles of Marketing"],
          "HUMSS": ["Creative Writing", "Creative Nonfiction", "Philippine Politics and Governance", "Disciplines and Ideas in Social Sciences", "Community Engagement"],
          "GAS": ["Humanities 1 & 2", "Social Sciences 1 & 2", "Applied Economics", "Organization and Management"],
          "TechPro-ICT": ["Computer Systems Servicing NC II", "Programming", "Web Development", "Animation NC II", "Networking"],
          "TechPro-Automotive": ["Automotive Servicing NC I", "Automotive Servicing NC II", "Engine Repair", "Automotive Electrical Systems", "Chassis and Transmission"],
          "TechPro-HE": ["Cookery", "Bread and Pastry Production", "Food and Beverage Services", "Housekeeping"]
        }
      },
      "Grade 12": {
        subjects: [
          "Oral Communication", "Reading and Writing",
          "Komunikasyon at Pananaliksik", "Pagbasa at Pagsusuri",
          "21st Century Literature", "General Mathematics",
          "Statistics and Probability", "Earth and Life Science",
          "Physical Science", "Personal Development", "UCSP",
          "PEH", "MIL", "Contemporary Philippine Arts",
          "Empowerment Technologies", "Practical Research 1",
          "Practical Research 2"
        ],
        tracks: {
          "STEM": ["Pre-Calculus", "Basic Calculus", "General Biology 1 & 2", "General Chemistry 1 & 2", "General Physics 1 & 2", "Research Capstone"],
          "ABM": ["Fundamentals of ABM 1 & 2", "Business Mathematics", "Business Finance", "Organization and Management", "Principles of Marketing"],
          "HUMSS": ["Creative Writing", "Creative Nonfiction", "Philippine Politics and Governance", "Disciplines and Ideas in Social Sciences", "Community Engagement"],
          "GAS": ["Humanities 1 & 2", "Social Sciences 1 & 2", "Applied Economics", "Organization and Management"],
          "TechPro-ICT": ["Computer Systems Servicing NC II", "Programming", "Web Development", "Animation NC II", "Networking"],
          "TechPro-Automotive": ["Automotive Servicing NC I", "Automotive Servicing NC II", "Engine Repair", "Automotive Electrical Systems", "Chassis and Transmission"],
          "TechPro-HE": ["Cookery", "Bread and Pastry Production", "Food and Beverage Services", "Housekeeping"]
        }
      }
    }
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Get all available curricula
export function listCurricula() {
  return Object.entries(CURRICULA).map(([key, val]) => ({
    value: key,
    label: val.label,
    description: val.description
  }));
}

// Get all grade levels for a curriculum
export function listGrades(curriculumKey) {
  const c = CURRICULA[curriculumKey];
  if (!c) return [];
  return Object.keys(c.grades);
}

// Get subjects for a specific curriculum + grade + (optional) track
export function getSubjects(curriculumKey, grade, track = null) {
  const c = CURRICULA[curriculumKey];
  if (!c) return [];
  const g = c.grades[grade];
  if (!g) return [];

  // Base subjects
  const base = g.subjects || [];

  // If SHS and track is specified, add track-specific subjects
  if (g.tracks && track) {
    const trackSubjects = g.tracks[track] || [];
    return [...base, ...trackSubjects];
  }

  return base;
}

// Get tracks for a curriculum + grade (SHS only)
export function listTracks(curriculumKey, grade) {
  const c = CURRICULA[curriculumKey];
  if (!c) return [];
  const g = c.grades[grade];
  if (!g || !g.tracks) return [];
  return Object.keys(g.tracks);
}

// Get the label for a curriculum
export function curriculumLabel(key) {
  return CURRICULA[key]?.label || key;
}

// Check if a curriculum + grade has tracks (i.e., is SHS)
export function hasTracks(curriculumKey, grade) {
  return listTracks(curriculumKey, grade).length > 0;
}