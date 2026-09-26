// Apps Script Web App endpoint (Anyone with the link)
window.SCPHS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzpOyMomau55oJSJp2-NM3cOBkjIBihxGAq95ZSDiQ9Xd7Yrcvp2Vurhme3NzvlQvCEvw/exec';

// ============================================================
// SCPHS Portal — Site Configuration
// ------------------------------------------------------------
// Edit this file (or use /settings.html) to customize for any
// public school. All headers, footers, and login branding
// read from this single source.
// ============================================================

export const SITE_CONFIG = {
  // ---------- School identity ----------
  schoolName:       "Sta. Cruz Pingkian High School",
  schoolShortName:  "SCPHS",
  schoolAddress:    "Pingkian, Kayapa, Nueva Vizcaya",

  // ---------- Government hierarchy ----------
  republic:         "Republic of the Philippines",
  department:       "Department of Education",
  region:           "Region II – Cagayan Valley",
  division:         "Schools Division of Nueva Vizcaya",

  // ---------- Logos ----------
  logoSchool:       "assets/images/scphslogo.png",
  logoDepEd:        "assets/images/deped-logo.png",
  logoBagongPilipinas: "assets/images/Bagong-Pilipinas-Logo.png",
  logoFOI:          "assets/images/foi-logo.png",
  logoTransparency: "assets/images/transparency-seal.png",

  // ---------- Branding / contact ----------
  tagline:          "School Community Portal",
  welcomeBlurb:     "Welcome to the official digital portal of the school. Sign in with your DepEd school account to access announcements, issuances, and school services.",
  emailDomain:      "@scphs.edu.ph",
  contactEmail:     "300648@deped.gov.ph",
  contactPhone:     "+63 967-8848989",

  // ---------- Firebase (leave as-is unless changing projects) ----------
  // (Defined separately in firebase-config.js)

  // ---------- Metadata ----------
  version:          "1.0.0",
  lastUpdated:      "2026-09-26"
};

// Helper to get a config value with a fallback
export function cfg(key, fallback = "") {
  return SITE_CONFIG[key] ?? fallback;
}