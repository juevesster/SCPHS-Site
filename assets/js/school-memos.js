/**
 * SCPHS School Memorandum Store
 * ---------------------------------
 * Lightweight localStorage-backed store for school-issued memoranda.
 * Exposes a global `SchoolMemos` API used by:
 *  - school-memorandum.html (admin CRUD)
 *  - issuances.html (merge into feed)
 *
 * Keys:
 *   - scphs_school_memos_v1  → array of memo objects
 *   - scphs_admin_session_v1 → admin session flag
 *
 * Memo shape:
 * {
 *   id: string,           // unique
 *   title: string,
 *   series: string,       // e.g. "SM No. 03, s. 2026"
 *   date: string,         // YYYY-MM-DD
 *   url: string,          // link to PDF / Drive file
 *   source: string,       // e.g. "SCPHS – Office of the Principal"
 *   desc: string,         // short description
 *   level: 'school',      // always
 *   type: 'memorandum',   // always
 *   createdAt: string,    // ISO timestamp
 *   updatedAt: string     // ISO timestamp
 * }
 */
(function (global) {
  'use strict';

  const MEMOS_KEY   = 'scphs_school_memos_v1';
  const SESSION_KEY = 'scphs_admin_session_v1';

  // ---------- Storage helpers ----------
  function readMemos() {
    try {
      const raw = localStorage.getItem(MEMOS_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  function writeMemos(list) {
    try {
      localStorage.setItem(MEMOS_KEY, JSON.stringify(list || []));
      return true;
    } catch (e) {
      console.error('[SchoolMemos] write failed:', e);
      return false;
    }
  }

  function uid() {
    return 'sm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  // ---------- CRUD ----------
  function list() {
    // Newest first
    return readMemos().slice().sort((a, b) => {
      const da = a.date || '', db = b.date || '';
      if (da !== db) return db.localeCompare(da);
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }

  function get(id) {
    return readMemos().find(m => m.id === id) || null;
  }

  function add(memo) {
    if (!memo || !memo.title) throw new Error('Title is required.');
    const now = new Date().toISOString();
    const item = {
      id: uid(),
      title:    String(memo.title).trim(),
      series:   String(memo.series || '').trim(),
      date:     String(memo.date || '').trim() || new Date().toISOString().slice(0, 10),
      url:      String(memo.url || '').trim(),
      source:   String(memo.source || 'SCPHS – Office of the Principal').trim(),
      desc:     String(memo.desc || '').trim(),
      level:    'school',
      type:     'memorandum',
      createdAt: now,
      updatedAt: now
    };
    const list = readMemos();
    list.push(item);
    if (!writeMemos(list)) throw new Error('Storage full or unavailable.');
    return item;
  }

  function update(id, patch) {
    const list = readMemos();
    const idx = list.findIndex(m => m.id === id);
    if (idx < 0) throw new Error('Memo not found.');
    list[idx] = {
      ...list[idx],
      ...patch,
      id: list[idx].id,
      level: 'school',
      type: 'memorandum',
      updatedAt: new Date().toISOString()
    };
    if (!writeMemos(list)) throw new Error('Storage full or unavailable.');
    return list[idx];
  }

  function remove(id) {
    const list = readMemos().filter(m => m.id !== id);
    return writeMemos(list);
  }

  function removeAll() {
    return writeMemos([]);
  }

  // ---------- Admin session ----------
  // NOTE: This is client-side only and is meant as a lightweight gate,
  // not real authentication. Replace with a server check later.
  const DEFAULT_USER = 'admin';
  const DEFAULT_PASS = 'scphs2026';

  function login(username, password) {
    const ok = (username === DEFAULT_USER && password === DEFAULT_PASS);
    if (ok) {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
          user: username,
          at: Date.now()
        }));
      } catch {}
    }
    return ok;
  }

  function logout() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  }

  function isAdmin() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const sess = JSON.parse(raw);
      // 8-hour session
      return sess && (Date.now() - (sess.at || 0)) < 8 * 3600 * 1000;
    } catch { return false; }
  }

  function currentUser() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw).user : '';
    } catch { return ''; }
  }

  // ---------- Public API ----------
  global.SchoolMemos = {
    list, get, add, update, remove, removeAll,
    login, logout, isAdmin, currentUser
  };
})(window);