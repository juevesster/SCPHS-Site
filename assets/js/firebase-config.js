// Firebase initialization for SCPHS Portal
// This file is imported by other scripts — do not edit unless changing projects.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBXof9tPw61TRl4qMu0LCxnAH8iBYYMVyo",
  authDomain: "scphs-portal.firebaseapp.com",
  projectId: "scphs-portal",
  storageBucket: "scphs-portal.firebasestorage.app",
  messagingSenderId: "598987845680",
  appId: "1:598987845680:web:c5c549de4b7554acaebdf5"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);