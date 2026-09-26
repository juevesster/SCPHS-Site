// auth-guard.js — Protects pages that require login.
// Add to any page:
//   <script type="module" src="assets/js/auth-guard.js"></script>
// The script checks Firebase Auth; if user is not signed in,
// redirects to login.html with a "next" parameter.

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Show a loading overlay until we know the auth state
document.documentElement.style.visibility = "hidden";
document.addEventListener("DOMContentLoaded", () => {
  // Basic loading screen while auth resolves
  const overlay = document.createElement("div");
  overlay.id = "auth-loading";
  overlay.style.cssText = `
    position: fixed; inset: 0; background: #f6f7f9;
    display: flex; align-items: center; justify-content: center;
    z-index: 99999; font-family: system-ui, sans-serif; color: #0f4c81;
    flex-direction: column; gap: 12px;
  `;
  overlay.innerHTML = `
    <div style="width: 42px; height: 42px; border: 3px solid #cbd5e1; border-top-color: #0f4c81; border-radius: 50%; animation: authSpin 0.8s linear infinite;"></div>
    <div style="font-weight: 600; font-size: 14px;">Verifying session…</div>
    <style>@keyframes authSpin { to { transform: rotate(360deg); } }</style>
  `;
  document.body.appendChild(overlay);
});

onAuthStateChanged(auth, (user) => {
  const overlay = document.getElementById("auth-loading");

  if (user) {
    // Signed in — reveal the page
    if (overlay) overlay.remove();
    document.documentElement.style.visibility = "visible";
    // Expose user globally for other scripts
    window.__scphsUser = user;
  } else {
    // Not signed in — redirect to login
    const here = encodeURIComponent(location.pathname + location.search);
    location.replace("login.html?next=" + here);
  }
});