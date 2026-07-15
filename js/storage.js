"use strict";

window.AVT_STORAGE = (function () {
  const C = window.AVT_CONFIG;

  function safeParse(value, fallback = null) {
    try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
  }

  function saveBackendUrl(url) {
    localStorage.setItem(C.storageKeys.backendUrl, String(url || ""));
  }

  function getBackendUrl() {
    return localStorage.getItem(C.storageKeys.backendUrl) || "";
  }

  function getDeviceId() {
    let value = localStorage.getItem(C.storageKeys.deviceId);
    if (value) return value;
    const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    value = `DEVICE-${String(random).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40)}`;
    localStorage.setItem(C.storageKeys.deviceId, value);
    return value;
  }

  function saveLogin(session, mode, backendUrl) {
    clearLogin();
    const payload = {
      valid: true,
      token: session.sessionToken,
      expiresAt: session.expiresAt,
      mode,
      backendUrl,
      createdAt: Date.now()
    };
    const encoded = JSON.stringify(payload);
    if (mode === "session") sessionStorage.setItem(C.storageKeys.login, encoded);
    else localStorage.setItem(C.storageKeys.login, encoded);
  }

  function getLogin() {
    const session = safeParse(sessionStorage.getItem(C.storageKeys.login));
    if (isValidLogin(session)) return session;
    const stored = safeParse(localStorage.getItem(C.storageKeys.login));
    if (isValidLogin(stored)) return stored;
    clearLogin();
    return null;
  }

  function isValidLogin(login) {
    if (!login?.valid || !login.token || !login.backendUrl) return false;
    if (login.expiresAt && new Date(login.expiresAt).getTime() <= Date.now()) return false;
    return true;
  }

  function clearLogin() {
    sessionStorage.removeItem(C.storageKeys.login);
    localStorage.removeItem(C.storageKeys.login);
  }

  return {
    saveBackendUrl,
    getBackendUrl,
    getDeviceId,
    saveLogin,
    getLogin,
    clearLogin
  };
})();
