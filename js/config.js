"use strict";
window.AVT_CONFIG = Object.freeze({
  version: "0.2.0-test.4",
  password: "avt-demo",
  qrPrefix: "AVT-CHECKIN-DEMO-V6:",
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
    login: "avt-checkin-demo-login-v6",
    data: "avt-checkin-demo-data-v6"
  }
});
window.AVT_REGISTRATIONS = Object.freeze([{"token": "T6-A01", "number": "A-01", "name": "Anna Beispiel", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 2, "child": 0, "youth": 0, "student": 0}, "scenario": "2 Erwachsene"}, {"token": "T6-A02", "number": "A-02", "name": "Familie Muster", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 2, "child": 2, "youth": 0, "student": 0}, "scenario": "Familientarif möglich"}, {"token": "T6-A03", "number": "A-03", "name": "Jugendgruppe Beispiel", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 1, "child": 0, "youth": 3, "student": 0}, "scenario": "Erwachsene und Jugendliche"}, {"token": "T6-A04", "number": "A-04", "name": "Studierende Beispiel", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 0, "child": 0, "youth": 0, "student": 3}, "scenario": "Studierende"}, {"token": "T6-A05", "number": "A-05", "name": "Storniert Beispiel", "status": "cancelled", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 2, "child": 0, "youth": 1, "student": 0}, "scenario": "Stornierte Ausnahme"}, {"token": "T6-A06", "number": "A-06", "name": "Minderteilnahme Beispiel", "status": "confirmed", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 3, "child": 1, "youth": 0, "student": 0}, "scenario": "Personenzahl reduzieren"}, {"token": "T6-W01", "number": "W-01", "name": "Warteliste Eins", "status": "waitlist", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 2, "child": 0, "youth": 0, "student": 0}, "waitNo": 1, "scenario": "Erster Warteplatz"}, {"token": "T6-W06", "number": "W-06", "name": "Warteliste Sechs", "status": "waitlist", "eventId": "EVT-DEMO-2026-07-15", "booked": {"adult": 1, "child": 1, "youth": 0, "student": 0}, "waitNo": 6, "scenario": "Frühere W-Nummern offen"}, {"token": "T6-WRONG", "number": "A-99", "name": "Falsche Veranstaltung", "status": "confirmed", "eventId": "EVT-OTHER", "booked": {"adult": 1, "child": 0, "youth": 0, "student": 0}, "scenario": "Falsche Veranstaltung"}]);
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
