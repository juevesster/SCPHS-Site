// login.js — handles sign-in, sign-up, and password reset for SCPHS Portal.

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

// --- DOM ---
const tabLogin   = document.getElementById("tabLogin");
const tabSignup  = document.getElementById("tabSignup");
const formLogin  = document.getElementById("formLogin");
const formSignup = document.getElementById("formSignup");
const authMsg    = document.getElementById("authMsg");

const btnLogin   = document.getElementById("btnLogin");
const btnSignup  = document.getElementById("btnSignup");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const signupName  = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");

const linkForgot = document.getElementById("linkForgot");

// --- Helpers ---
function showMsg(text, type = "error") {
  authMsg.textContent = text;
  authMsg.className = "auth-msg " + type;
}
function clearMsg() {
  authMsg.textContent = "";
  authMsg.className = "auth-msg";
}
function setLoading(btn, loading, labelNormal) {
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait…" : labelNormal;
}

// --- Tabs ---
tabLogin.addEventListener("click", () => {
  tabLogin.classList.add("active");
  tabSignup.classList.remove("active");
  formLogin.style.display = "block";
  formSignup.style.display = "none";
  clearMsg();
});

tabSignup.addEventListener("click", () => {
  tabSignup.classList.add("active");
  tabLogin.classList.remove("active");
  formSignup.style.display = "block";
  formLogin.style.display = "none";
  clearMsg();
});

// --- Role picker ---
document.querySelectorAll(".role-option").forEach(opt => {
  opt.addEventListener("click", () => {
    document.querySelectorAll(".role-option").forEach(o => o.classList.remove("selected"));
    opt.classList.add("selected");
    opt.querySelector("input").checked = true;
  });
});

// --- Where to go after login ---
function getNextUrl() {
  const params = new URLSearchParams(location.search);
  const next = params.get("next");
  // Only allow relative paths (safer)
  if (next && !next.startsWith("http") && !next.startsWith("//")) {
    return next;
  }
  return "index.html";
}

// --- LOGIN ---
formLogin.addEventListener("submit", async (e) => {
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
    setTimeout(() => {
      location.replace(getNextUrl());
    }, 400);
  } catch (err) {
    console.error(err);
    let msg = "Login failed.";
    if (err.code === "auth/user-not-found")     msg = "No account found with that email.";
    if (err.code === "auth/wrong-password")     msg = "Incorrect password.";
    if (err.code === "auth/invalid-email")      msg = "That email address is not valid.";
    if (err.code === "auth/invalid-credential") msg = "Invalid email or password.";
    if (err.code === "auth/too-many-requests")  msg = "Too many attempts. Please wait and try again.";
    showMsg(msg, "error");
    setLoading(btnLogin, false, "Sign In");
  }
});

// --- SIGNUP ---
formSignup.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMsg();
  setLoading(btnSignup, true, "Create Account");

  try {
    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const role = document.querySelector('input[name="role"]:checked').value;

    if (!name) throw { code: "custom/no-name" };

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Set display name in Auth
    await updateProfile(cred.user, { displayName: name });

    // Save role + profile to Firestore
    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
      role,                  // "student" | "teacher"
      createdAt: serverTimestamp()
    });

    showMsg("Account created! Redirecting…", "success");
    setTimeout(() => {
      location.replace(getNextUrl());
    }, 600);
  } catch (err) {
    console.error(err);
    let msg = "Sign up failed.";
    if (err.code === "auth/email-already-in-use") msg = "That email is already registered. Try signing in.";
    if (err.code === "auth/weak-password")        msg = "Password must be at least 6 characters.";
    if (err.code === "auth/invalid-email")        msg = "That email address is not valid.";
    if (err.code === "custom/no-name")            msg = "Please enter your full name.";
    showMsg(msg, "error");
    setLoading(btnSignup, false, "Create Account");
  }
});

// --- FORGOT PASSWORD ---
linkForgot.addEventListener("click", async (e) => {
  e.preventDefault();
  clearMsg();
  const email = loginEmail.value.trim();
  if (!email) {
    showMsg("Enter your email above first, then click 'Forgot password'.", "error");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showMsg("Password reset email sent. Check your inbox.", "success");
  } catch (err) {
    console.error(err);
    showMsg("Could not send reset email. Check the address and try again.", "error");
  }
});