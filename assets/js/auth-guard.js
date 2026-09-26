// auth-guard.js — Protects pages that require login.
// Uses a 15-second timeout to avoid getting stuck on slow auth.

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Immediately hide the page (will be revealed after auth check)
document.documentElement.style.visibility = "hidden";

// Prevent multiple executions
let resolved = false;

function showPage(user) {
  if (resolved) return;
  resolved = true;
  document.documentElement.style.visibility = "visible";
  if (user) {
    window.__scphsUser = user;
    console.log("[auth-guard] Signed in as:", user.email);
  }
}

function goToLogin() {
  if (resolved) return;
  resolved = true;
  const next = encodeURIComponent(location.pathname + location.search);
  location.replace("login.html?next=" + next);
}

// Safety timeout: if Firebase doesn't respond in 15s, go to login
const safety = setTimeout(() => {
  console.warn("[auth-guard] Auth check timed out — redirecting to login.");
  goToLogin();
}, 15000);

// Main auth check
onAuthStateChanged(auth, (user) => {
  clearTimeout(safety);
  if (user) {
    showPage(user);
  } else {
    goToLogin();
  }
});