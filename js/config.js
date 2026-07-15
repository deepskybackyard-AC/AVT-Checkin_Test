"use strict";

window.AVT_CONFIG = Object.freeze({
  appName: "AVT Check-in Demo",
  version: "0.2.0-test.1",
  qrPrefix: "AVT-CHECKIN-DEMO-V3:",
  requestTimeoutMs: 30000,
  autoRefreshMs: 12000,
  storageKeys: {
    login: "avt-checkin-multidevice-login-v1",
    backendUrl: "avt-checkin-multidevice-backend-v1",
    deviceId: "avt-checkin-multidevice-device-v1"
  }
});

window.AVT_UTIL = Object.freeze({
  displayDate(isoDate) {
    if (!isoDate) return "–";
    const [y, m, d] = String(isoDate).split("-");
    return `${d}.${m}.${y}`;
  },
  displayTime(isoString) {
    if (!isoString) return "–";
    return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(isoString));
  },
  escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  },
  sumCounts(counts) {
    return Object.values(counts || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
  },
  clone(value) {
    return JSON.parse(JSON.stringify(value));
  }
});
