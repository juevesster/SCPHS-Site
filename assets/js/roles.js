// roles.js — Role and permission manager for SCPHS Portal.
// Provides helpers for reading/updating user roles and permissions.

import { db, auth } from "./firebase-config.js";
import {
  doc, getDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ------------------------------------------------------------
// Super-admins (hardcoded) — must match Firestore rules
// ------------------------------------------------------------
export const SUPER_ADMINS = [
  "ricardo.jueves@deped.gov.ph",
  "juevesster@gmail.com",
];

// ------------------------------------------------------------
// Permission templates — predefined role bundles
// ------------------------------------------------------------
export const PERMISSION_TEMPLATES = {
  "student": {
    label: "Student (default)",
    primaryRole: "student",
    permissions: {
      canPostBulletin: false,
      canUploadMemo: false,
      canManageClasses: false,
      canEnterGrades: false,
      canManageRoster: false,
      canCreateExams: false,
      canModerateContent: false,
      canManageUsers: false,
    }
  },

  "student-leader": {
    label: "Student Leader (SSLG, Class Officer)",
    primaryRole: "student",
    permissions: {
      canPostBulletin: true,
      canUploadMemo: false,
      canManageClasses: false,
      canEnterGrades: false,
      canManageRoster: false,
      canCreateExams: false,
      canModerateContent: false,
      canManageUsers: false,
    }
  },

  "student-club-officer": {
    label: "Student Club Officer",
    primaryRole: "student",
    permissions: {
      canPostBulletin: true,
      canUploadMemo: false,
      canManageClasses: false,
      canEnterGrades: false,
      canManageRoster: false,
      canCreateExams: false,
      canModerateContent: false,
      canManageUsers: false,
    }
  },

  "teacher": {
    label: "Teacher (default)",
    primaryRole: "teacher",
    permissions: {
      canPostBulletin: false,
      canUploadMemo: false,
      canManageClasses: false,
      canEnterGrades: true,
      canManageRoster: false,
      canCreateExams: true,
      canModerateContent: false,
      canManageUsers: false,
    }
  },

  "adviser": {
    label: "Class Adviser",
    primaryRole: "teacher",
    permissions: {
      canPostBulletin: false,
      canUploadMemo: false,
      canManageClasses: false,
      canEnterGrades: true,
      canManageRoster: true,
      canCreateExams: true,
      canModerateContent: false,
      canManageUsers: false,
    }
  },

  "master-teacher": {
    label: "Master Teacher",
    primaryRole: "teacher",
    permissions: {
      canPostBulletin: false,
      canUploadMemo: false,
      canManageClasses: false,
      canEnterGrades: true,
      canManageRoster: true,
      canCreateExams: true,
      canModerateContent: false,
      canManageUsers: false,
    }
  },

  "club-adviser": {
    label: "Club Adviser",
    primaryRole: "teacher",
    permissions: {
      canPostBulletin: true,
      canUploadMemo: false,
      canManageClasses: false,
      canEnterGrades: false,
      canManageRoster: false,
      canCreateExams: false,
      canModerateContent: false,
      canManageUsers: false,
    }
  },

  "admin": {
    label: "Admin (full access)",
    primaryRole: "admin",
    permissions: {
      canPostBulletin: true,
      canUploadMemo: true,
      canManageClasses: true,
      canEnterGrades: true,
      canManageRoster: true,
      canCreateExams: true,
      canModerateContent: true,
      canManageUsers: true,
    }
  },
};

// ------------------------------------------------------------
// Get the current user's full profile
// ------------------------------------------------------------
export async function getCurrentUserProfile() {
  if (!auth.currentUser) return null;

  const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
  const isSuper = SUPER_ADMINS.includes(auth.currentUser.email);

  if (!snap.exists()) {
    if (isSuper) {
      return {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        name: auth.currentUser.displayName || auth.currentUser.email,
        primaryRole: "admin",
        secondaryRoles: ["Super Admin"],
        permissions: PERMISSION_TEMPLATES["admin"].permissions,
        isSuperAdmin: true,
      };
    }
    return null;
  }

  const data = snap.data();
  return {
    uid: auth.currentUser.uid,
    email: auth.currentUser.email,
    name: data.name || auth.currentUser.displayName || auth.currentUser.email,
    primaryRole: data.primaryRole || data.role || "student",
    secondaryRoles: Array.isArray(data.secondaryRoles) ? data.secondaryRoles : [],
    permissions: data.permissions || {},
    isSuperAdmin: isSuper,
    ...data,
  };
}

// ------------------------------------------------------------
// Check if current user has a permission
// ------------------------------------------------------------
export async function hasPermission(permission) {
  if (!auth.currentUser) return false;
  if (SUPER_ADMINS.includes(auth.currentUser.email)) return true;

  const profile = await getCurrentUserProfile();
  return profile?.permissions?.[permission] === true;
}

// ------------------------------------------------------------
// Admin-only: update another user's roles and permissions
// ------------------------------------------------------------
export async function updateUserRoles(userUid, {
  primaryRole,
  secondaryRoles,
  permissions,
}) {
  const caller = await getCurrentUserProfile();
  if (!caller || (caller.primaryRole !== "admin" && !caller.isSuperAdmin)) {
    throw new Error("Only admins can update user roles.");
  }

  const ref = doc(db, "users", userUid);
  await updateDoc(ref, {
    primaryRole,
    secondaryRoles: Array.isArray(secondaryRoles) ? secondaryRoles : [],
    permissions: permissions || {},
    updatedAt: serverTimestamp(),
    updatedBy: caller.uid,
  });
}