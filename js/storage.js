"use strict";

window.AVT_STORAGE = (function () {
  const C = window.AVT_CONFIG;
  const U = window.AVT_UTIL;

  function safeParse(value, fallback = null) {
    try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
  }

  function dayExpiry() {
    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + 1);
    expiry.setHours(4, 0, 0, 0);
    return expiry.getTime();
  }

  function saveLogin(mode) {
    clearLogin();
    const payload = { valid: true, mode, createdAt: Date.now(), expiresAt: mode === "day" ? dayExpiry() : null };
    if (mode === "session") {
      sessionStorage.setItem(C.storageKeys.login, JSON.stringify(payload));
    } else {
      localStorage.setItem(C.storageKeys.login, JSON.stringify(payload));
    }
  }

  function getLogin() {
    const session = safeParse(sessionStorage.getItem(C.storageKeys.login));
    if (session?.valid) return session;
    const stored = safeParse(localStorage.getItem(C.storageKeys.login));
    if (!stored?.valid) return null;
    if (stored.mode === "day" && stored.expiresAt && Date.now() > stored.expiresAt) {
      localStorage.removeItem(C.storageKeys.login);
      return null;
    }
    return stored;
  }

  function clearLogin() {
    sessionStorage.removeItem(C.storageKeys.login);
    localStorage.removeItem(C.storageKeys.login);
  }

  function getCheckins() {
    const saved = safeParse(localStorage.getItem(C.storageKeys.checkins));
    if (saved && saved.eventDate === window.AVT_DEMO_DATA.activeEvent.date && saved.records) {
      return saved.records;
    }
    const initial = U.clone(window.AVT_DEMO_DATA.initialCheckins);
    saveCheckins(initial);
    return initial;
  }

  function saveCheckins(records) {
    localStorage.setItem(C.storageKeys.checkins, JSON.stringify({
      eventDate: window.AVT_DEMO_DATA.activeEvent.date,
      records
    }));
  }

  function resetCheckins() {
    const records = U.clone(window.AVT_DEMO_DATA.initialCheckins);
    saveCheckins(records);
    return records;
  }

  return { saveLogin, getLogin, clearLogin, getCheckins, saveCheckins, resetCheckins };
})();
