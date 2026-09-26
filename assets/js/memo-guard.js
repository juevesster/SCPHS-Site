// memo-guard.js — Firebase-backed admin gate for the memo page.
// - Not signed in → redirect to login.html?next=…
// - Signed in but not admin → show denied
// - Signed in as admin → show admin UI

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ------------------------------------------------------------
// Admin policy — who counts as admin?
// ------------------------------------------------------------
const ADMIN_DOMAIN = "@deped.gov.ph";
const ADMIN_EMAILS = [
  "juevesster@gmail.com",
];

function isAdminEmail(email) {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return e.endsWith(ADMIN_DOMAIN) || ADMIN_EMAILS.includes(e);
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------
export function initMemoGuard({ onLoading, onAdmin, onDenied } = {}) {
  onLoading?.();

  onAuthStateChanged(auth, async (user) => {
    // 1) Not signed in → bounce to login
    if (!user) {
      const next = encodeURIComponent(location.pathname + location.search);
      location.replace("login.html?next=" + next);
      return;
    }

    // 2) Signed in — read role from Firestore (best-effort)
    let role = "student";
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) role = snap.data().role || "student";
    } catch (e) {
      console.warn("[memo-guard] role lookup failed:", e?.code || e?.message);
    }

    // 3) Decide
    const ok = role === "admin" || isAdminEmail(user.email);
    if (ok) onAdmin?.(user);
    else    onDenied?.(user);
  });
}

export async function memoSignOut() {
  try { await signOut(auth); } catch (e) { console.warn("[memo-guard] signOut failed:", e); }
}

export function isAdminEmailCheck(email) {
  return isAdminEmail(email);
}