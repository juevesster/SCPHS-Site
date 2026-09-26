// config.js — SCPHS Portal configuration loader
// Exports: SITE_CONFIG, DEFAULT_CONFIG, cfg, loadConfig, setConfig

import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ------------------------------------------------------------
// Defaults — used when Firestore is unreachable or unconfigured
// ------------------------------------------------------------
export const DEFAULT_CONFIG = {
  // School identity
  schoolName:       "Sta. Cruz Pingkian High School",
  schoolShortName:  "SCPHS",
  schoolAddress:    "Pingkian, Kayapa, Nueva Vizcaya",

  // Government hierarchy
  republic:         "Republic of the Philippines",
  department:       "Department of Education",
  region:           "Region II – Cagayan Valley",
  division:         "Schools Division of Nueva Vizcaya",

  // Logos
  logoSchool:           "assets/images/scphslogo.png",
  logoDepEd:            "assets/images/deped-logo.png",
  logoBagongPilipinas:  "assets/images/Bagong-Pilipinas-Logo.png",
  logoFOI:              "assets/images/foi-logo.png",
  logoTransparency:     "assets/images/transparency-seal.png",

  // Branding / contact
  tagline:          "School Community Portal",
  welcomeBlurb:     "Welcome to the official digital portal of the school. Sign in with your DepEd school account to access announcements, issuances, and school services.",
  emailDomain:      "@scphs.edu.ph",
  contactEmail:     "300648@deped.gov.ph",
  contactPhone:     "+63 967-8848989",
};

// ------------------------------------------------------------
// Live config — starts as defaults, mutated by loadConfig()
// ------------------------------------------------------------
export const SITE_CONFIG = { ...DEFAULT_CONFIG };

// Expose globally so any page can inspect it via console
if (typeof window !== "undefined") {
  window.__scphsConfig = SITE_CONFIG;
}

// ------------------------------------------------------------
// Accessor
// ------------------------------------------------------------
export function cfg(key, fallback = "") {
  return SITE_CONFIG[key] ?? fallback;
}

// ------------------------------------------------------------
// Load from Firestore (never throws)
// ------------------------------------------------------------
export async function loadConfig() {
  try {
    const snap = await getDoc(doc(db, "config", "site"));
    if (snap.exists()) {
      Object.assign(SITE_CONFIG, snap.data());
      console.info("[config] Loaded from Firestore.");
    } else {
      console.info("[config] No config/site doc — using defaults.");
    }
  } catch (e) {
    console.warn("[config] Firestore load failed — using defaults:", e?.code || e?.message);
  }
  // Keep global reference fresh
  if (typeof window !== "undefined") {
    window.__scphsConfig = SITE_CONFIG;
  }
  return SITE_CONFIG;
}

// ------------------------------------------------------------
// Programmatic update (used by settings.html after save)
// ------------------------------------------------------------
export function setConfig(partial) {
  Object.assign(SITE_CONFIG, partial);
  if (typeof window !== "undefined") {
    window.__scphsConfig = SITE_CONFIG;
  }
}