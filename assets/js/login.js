// login.js — SCPHS Portal authentication handlers
// Handles: tab switching, sign-in, sign-up, password reset,
// password visibility, password strength.

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);

const tabLogin    = $("tabLogin");
const tabSignup   = $("tabSignup");
const formLogin   = $("formLogin");
const formSignup  = $("formSignup");
const authMsg     = $("authMsg");

const btnLogin    = $("btnLogin");
const btnSignup   = $("btnSignup");

const loginEmail    = $("loginEmail");
const loginPassword = $("loginPassword");

const signupName     = $("signupName");
const signupEmail    = $("signupEmail");
const signupPassword = $("signupPassword");

const linkForgot = $("linkForgot");

const pwMeter = $("pwMeter");
const pwLabel = $("pwLabel");

/* ---------- Helpers ---------- */
function showMsg(text, type = "error") {
  if (!authMsg) return;
  const icon = type === "success" ? "✓" : "!";
  authMsg.innerHTML = `<span class="banner-icon">${icon}</span>${text}`;
  authMsg.className = "auth-msg " + type;
  authMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function clearMsg() {
  if (!authMsg) return;
  authMsg.textContent = "";
  authMsg.className = "auth-msg";
}
function setLoading(btn, loading, labelNormal) {
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<span class="btn-spinner"></span>Please wait…'
    : labelNormal;
}

/* ---------- Tabs ---------- */
tabLogin?.addEventListener("click", () => {
  tabLogin.classList.add("active");
  tabLogin.setAttribute("aria-selected", "true");
  tabSignup.classList.remove("active");
  tabSignup.setAttribute("aria-selected", "false");
  formLogin.style.display = "block";
  formSignup.style.display = "none";
  clearMsg();
});

tabSignup?.addEventListener("click", () => {
  tabSignup.classList.add("active");
  tabSignup.setAttribute("aria-selected", "true");
  tabLogin.classList.remove("active");
  tabLogin.setAttribute("aria-selected", "false");
  formSignup.style.display = "block";
  formLogin.style.display = "none";
  clearMsg();
});

/* ---------- Role picker ---------- */
document.querySelectorAll(".role-option").forEach(opt => {
  opt.addEventListener("click", () => {
    document.querySelectorAll(".role-option").forEach(o => o.classList.remove("selected"));
    opt.classList.add("selected");
    const input = opt.querySelector('input[type="radio"]');
    if (input) input.checked = true;
  });
});

/* ---------- Password visibility toggle ---------- */
document.querySelectorAll(".toggle-pw").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;
    const isPw = input.type === "password";
    input.type = isPw ? "text" : "password";
    btn.textContent = isPw ? "🙈" : "👁";
    btn.setAttribute("aria-label", isPw ? "Hide password" : "Show password");
  });
});

/* ---------- Password strength meter ---------- */
signupPassword?.addEventListener("input", () => {
  const pw = signupPassword.value;
  if (!pw) {
    pwMeter.classList.remove("show");
    return;
  }
  pwMeter.classList.add("show");

  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const bars = pwMeter.querySelectorAll(".pw-meter-bar span");
  bars.forEach(b => b.className = "");

  if (score <= 1) {
    bars.forEach(b => b.classList.add("weak"));
    pwLabel.textContent = "Weak password";
    pwLabel.style.color = "#ef4444";
  } else if (score === 2) {
    bars[0].classList.add("fair");
    bars[1].classList.add("fair");
    pwLabel.textContent = "Fair password";
    pwLabel.style.color = "#f59e0b";
  } else if (score === 3) {
    bars[0].classList.add("good");
    bars[1].classList.add("good");
    bars[2].classList.add("good");
    pwLabel.textContent = "Good password";
    pwLabel.style.color = "#10b981";
  } else {
    bars.forEach(b => b.classList.add("good"));
    pwLabel.textContent = "Strong password";
    pwLabel.style.color = "#10b981";
  }
});

/* ---------- Next URL ---------- */
function getNextUrl() {
  const params = new URLSearchParams(location.search);
  const next = params.get("next");
  if (next && !next.startsWith("http") && !next.startsWith("//")) {
    return next;
  }
  return "index.html";
}

/* ---------- LOGIN ---------- */
formLogin?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMsg();
  setLoading(btnLogin, true, "Sign In");

  try {
    await signInWithEmailAndPassword(
      auth,
      loginEmail.value.trim(),
      loginPassword.value
    );
    showMsg("Signed in successfully. Redirecting…", "success");
    setTimeout(() => location.replace(getNextUrl()), 400);
  } catch (err) {
    console.error(err);
    let msg = "Login failed. Please try again.";
    if (err.code === "auth/user-not-found")        msg = "No account found with that email.";
    if (err.code === "auth/wrong-password")        msg = "Incorrect password. Please try again.";
    if (err.code === "auth/invalid-email")         msg = "That email address is not valid.";
    if (err.code === "auth/invalid-credential")    msg = "Invalid email or password.";
    if (err.code === "auth/too-many-requests")     msg = "Too many attempts. Please wait a few minutes.";
    if (err.code === "auth/network-request-failed") msg = "Network error. Check your connection.";
    showMsg(msg, "error");
    setLoading(btnLogin, false, "Sign In");
  }
});

/* ---------- SIGNUP ---------- */
formSignup?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMsg();
  setLoading(btnSignup, true, "Create Account");

  try {
    const name     = signupName.value.trim();
    const email    = signupEmail.value.trim();
    const password = signupPassword.value;
    const role     = document.querySelector('input[name="role"]:checked')?.value || "student";

    if (!name) {
      showMsg("Please enter your full name.", "error");
      setLoading(btnSignup, false, "Create Account");
      return;
    }
    if (password.length < 8) {
      showMsg("Password must be at least 8 characters.", "error");
      setLoading(btnSignup, false, "Create Account");
      return;
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
      role,
      createdAt: serverTimestamp()
    });

    showMsg("Account created successfully! Redirecting…", "success");
    setTimeout(() => location.replace(getNextUrl()), 700);
  } catch (err) {
    console.error(err);
    let msg = "Sign up failed. Please try again.";
    if (err.code === "auth/email-already-in-use") msg = "That email is already registered. Try signing in.";
    if (err.code === "auth/weak-password")        msg = "Password is too weak. Use at least 8 characters.";
    if (err.code === "auth/invalid-email")        msg = "That email address is not valid.";
    if (err.code === "auth/network-request-failed") msg = "Network error. Check your connection.";
    if (err.code === "permission-denied")         msg = "Account created but profile save failed. Contact admin.";
    showMsg(msg, "error");
    setLoading(btnSignup, false, "Create Account");
  }
});

/* ---------- FORGOT PASSWORD ---------- */
linkForgot?.addEventListener("click", async (e) => {
  e.preventDefault();
  clearMsg();

  const email = loginEmail.value.trim();
  if (!email) {
    showMsg("Enter your email address above, then click 'Forgot your password?'", "error");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showMsg("Password reset email sent. Check your inbox (and spam folder).", "success");
  } catch (err) {
    console.error(err);
    let msg = "Could not send reset email.";
    if (err.code === "auth/user-not-found") msg = "No account found with that email.";
    if (err.code === "auth/invalid-email")  msg = "That email address is not valid.";
    showMsg(msg, "error");
  }
});