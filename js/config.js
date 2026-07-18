"use strict";
window.AVT_CONFIG = Object.freeze({
  version: "0.3.0-test.4",
  password: "avt-demo",
  qrPrefix: "AVT-CHECKIN-DEMO-V8:",
  backend: {
    // Nach der Apps-Script-Bereitstellung hier die Web-App-URL mit /exec eintragen.
    // Beispiel: https://script.google.com/macros/s/AKfycb.../exec
    url: "https://script.google.com/macros/s/AKfycbx2xoma92sks4q82YBZeQop5_ELB0ecDyLAzWUdFMncYRBU0BeTEgQes70w8xt8NNR_rA/exec",
    enabled: true,
    pollSeconds: 15
  },
  saveFlow: {
    warningSeconds: 8,
    requestTimeoutSeconds: 30,
    verificationSeconds: 3,
    offlineFallbackEnabled: true
  },
  event: {
    id: "EVT-DEMO-2026-07-15",
    title: "Sternführung",
    date: "2026-07-15",
    time: "22:00",
    maxPersons: 65
  },
  prices: {
    adult: 5,
    child: 2,
    youth: 2,
    student: 2,
    family: 10
  },
  familyRule: {
    minAdults: 1,
    minReducedPersons: 1,
    requireRegularPriceAboveFamilyPrice: true
  },
  correctionReasons: [
    {
      id: "member",
      label: "Vereinsmitglied",
      active: true,
      order: 1,
      defaultAmount: 0,
      amountRequired: false
    },
    {
      id: "other",
      label: "Sonstiges",
      active: true,
      order: 99,
      defaultAmount: null,
      amountRequired: true
    }
  ],
  storageKeys: {
    login: "avt-checkin-login",
    data: "avt-checkin-multi-data-v1",
    cachedBackend: "avt-checkin-multi-cached-backend-v1",
    offlineQueue: "avt-checkin-multi-offline-queue-v1",
    deviceId: "avt-checkin-device-id-v1"
  }
});
window.AVT_REGISTRATIONS = Object.freeze([{"token": "T8-A01", "number": "A-001", "ids": ["A-001", "A-002"], "name": "Anna Beispiel", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 2, "child": 0, "youth": 0, "student": 0}, "scenario": "2 Erwachsene · 2 IDs"}, {"token": "T8-A02", "number": "A-003", "ids": ["A-003", "A-004", "A-005", "A-006"], "name": "Familie Muster", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 2, "child": 2, "youth": 0, "student": 0}, "scenario": "Familientarif · 4 IDs"}, {"token": "T8-A03", "number": "A-007", "ids": ["A-007", "A-008", "A-009", "A-010"], "name": "Jugendgruppe Beispiel", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 1, "child": 0, "youth": 3, "student": 0}, "scenario": "1 Erwachsener + 3 Jugendliche"}, {"token": "T8-A04", "number": "A-011", "ids": ["A-011", "A-012", "A-013"], "name": "Studierende Beispiel", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 0, "child": 0, "youth": 0, "student": 3}, "scenario": "3 Studierende"}, {"token": "T8-A05", "number": "A-014", "ids": ["A-014", "A-015", "A-016"], "name": "Storniert Beispiel", "status": "cancelled", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 2, "child": 0, "youth": 1, "student": 0}, "scenario": "Stornierte Ausnahme"}, {"token": "T8-A06", "number": "A-017", "ids": ["A-017", "A-018", "A-019", "A-020"], "name": "Minderteilnahme Beispiel", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 3, "child": 1, "youth": 0, "student": 0}, "scenario": "3 Erwachsene + 1 Kind"}, {"token": "T8-W01", "number": "W-001", "ids": ["W-001", "W-002"], "name": "Warteliste Eins", "status": "waitlist", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 2, "child": 0, "youth": 0, "student": 0}, "scenario": "W-001 und W-002"}, {"token": "T8-W03", "number": "W-003", "ids": ["W-003"], "name": "Warteliste Drei", "status": "waitlist", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 1, "child": 0, "youth": 0, "student": 0}, "scenario": "W-003"}, {"token": "T8-W04", "number": "W-004", "ids": ["W-004", "W-005"], "name": "Warteliste Vier", "status": "waitlist", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 1, "child": 1, "youth": 0, "student": 0}, "scenario": "W-004 und W-005"}, {"token": "T8-W06", "number": "W-006", "ids": ["W-006", "W-007"], "name": "Warteliste Sechs", "status": "waitlist", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 1, "child": 1, "youth": 0, "student": 0}, "scenario": "Warnung, solange W-001 bis W-005 offen sind"}, {"token": "T8-WRONG", "number": "A-099", "ids": ["A-099"], "name": "Falsche Veranstaltung", "status": "confirmed", "eventId": "EVT-OTHER", "booked": {"adult": 1, "child": 0, "youth": 0, "student": 0}, "scenario": "Falsche Veranstaltung"}]);
window.AVT_UTIL = Object.freeze({
  esc(value) {
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
  euro(value) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value) || 0);
  },
  date(value) {
    const [year, month, day] = String(value).split("-");
    return `${day}.${month}.${year}`;
  },
  now() { return new Date().toISOString(); },
  clone(value) { return JSON.parse(JSON.stringify(value)); }
});
