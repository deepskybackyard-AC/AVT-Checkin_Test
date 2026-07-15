"use strict";

window.AVT_CONFIG = Object.freeze({
  appName: "AVT Check-in Demo",
  version: "0.1.0-test.1",
  demoPassword: "avt-demo",
  familyDefaultPersons: 3,
  maxConfirmedPersons: 65,
  eventTime: "21:30",
  eventTitle: "Öffentliche Sternführung",
  eventId: "AVT-DEMO-CURRENT",
  qrPrefix: "AVT-CHECKIN-DEMO:",
  storageKeys: {
    login: "avt-checkin-demo-login-v1",
    checkins: "avt-checkin-demo-checkins-v1"
  }
});

window.AVT_UTIL = Object.freeze({
  localIsoDate(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  },
  displayDate(isoDate) {
    const [y, m, d] = isoDate.split("-");
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
