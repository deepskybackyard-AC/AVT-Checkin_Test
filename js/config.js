"use strict";
window.AVT_CONFIG = Object.freeze({
  version: "0.2.0-test.5",
  password: "avt-demo",
  qrPrefix: "AVT-CHECKIN-DEMO-V7:",
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
    data: "avt-checkin-demo-data-v7"
  }
});
window.AVT_REGISTRATIONS = Object.freeze([{"token": "T7-A01", "number": "A-001", "ids": ["A-001", "A-002"], "name": "Anna Beispiel", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 2, "child": 0, "youth": 0, "student": 0}, "scenario": "2 Erwachsene · 2 IDs"}, {"token": "T7-A02", "number": "A-003", "ids": ["A-003", "A-004", "A-005", "A-006"], "name": "Familie Muster", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 2, "child": 2, "youth": 0, "student": 0}, "scenario": "Familientarif · 4 IDs"}, {"token": "T7-A03", "number": "A-007", "ids": ["A-007", "A-008", "A-009", "A-010"], "name": "Jugendgruppe Beispiel", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 1, "child": 0, "youth": 3, "student": 0}, "scenario": "1 Erwachsener + 3 Jugendliche"}, {"token": "T7-A04", "number": "A-011", "ids": ["A-011", "A-012", "A-013"], "name": "Studierende Beispiel", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 0, "child": 0, "youth": 0, "student": 3}, "scenario": "3 Studierende"}, {"token": "T7-A05", "number": "A-014", "ids": ["A-014", "A-015", "A-016"], "name": "Storniert Beispiel", "status": "cancelled", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 2, "child": 0, "youth": 1, "student": 0}, "scenario": "Stornierte Ausnahme"}, {"token": "T7-A06", "number": "A-017", "ids": ["A-017", "A-018", "A-019", "A-020"], "name": "Minderteilnahme Beispiel", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 3, "child": 1, "youth": 0, "student": 0}, "scenario": "3 Erwachsene + 1 Kind"}, {"token": "T7-W01", "number": "W-001", "ids": ["W-001", "W-002"], "name": "Warteliste Eins", "status": "waitlist", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 2, "child": 0, "youth": 0, "student": 0}, "waitNo": 1, "scenario": "Erster Warteplatz · 2 IDs"}, {"token": "T7-W06", "number": "W-006", "ids": ["W-006", "W-007"], "name": "Warteliste Sechs", "status": "waitlist", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 1, "child": 1, "youth": 0, "student": 0}, "waitNo": 6, "scenario": "Frühere Wartelistennummern offen"}, {"token": "T7-WRONG", "number": "A-099", "ids": ["A-099"], "name": "Falsche Veranstaltung", "status": "confirmed", "eventId": "EVT-OTHER", "booked": {"adult": 1, "child": 0, "youth": 0, "student": 0}, "scenario": "Falsche Veranstaltung"}]);
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
