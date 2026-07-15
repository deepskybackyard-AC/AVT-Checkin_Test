"use strict";

(function () {
  const C = window.AVT_CONFIG;
  const U = window.AVT_UTIL;
  const today = U.localIsoDate();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = U.localIsoDate(tomorrowDate);

  const activeEvent = Object.freeze({
    id: C.eventId,
    title: C.eventTitle,
    date: today,
    time: C.eventTime,
    maxPersons: C.maxConfirmedPersons,
    source: "homepage-demo"
  });

  const counts = (adult = 0, student = 0, child = 0, family = 0) => ({ adult, student, child, family });

  // Die aktiven regulären Anmeldungen ergeben zusammen genau 45 Personen.
  // Bei einer Kapazität von 65 sind damit zu Beginn 20 Plätze nicht vergeben.
  const registrations = [
    { token: "T2-A01-VALID", number: "A-01", name: "Anna Beispiel", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(2,0,0,0), scenario: "Regulär · 2 Erwachsene" },
    { token: "T2-A02-FAMILY", number: "A-02", name: "Familie Muster", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(0,0,0,3), scenario: "Familie · Standard 3 Personen" },
    { token: "T2-A03-MIXED", number: "A-03", name: "Tobias Beispiel", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(2,0,1,0), scenario: "Regulär · Erwachsene und Kind" },
    { token: "T2-A04-ALREADY", number: "A-04", name: "Clara Beispiel", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(1,0,0,0), scenario: "Bereits eingecheckt" },
    { token: "T2-A05-CANCELLED", number: "A-05", name: "Stornierte Anmeldung", kind: "regular", status: "cancelled", eventId: activeEvent.id, eventDate: today, booked: counts(2,0,0,0), scenario: "Storniert · Ausnahme-Check-in möglich" },
    { token: "T2-A06-GROUP", number: "A-06", name: "Gruppe Orion", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(3,1,0,0), scenario: "4 angemeldet · Minderteilnahme testen" },
    { token: "T2-A07-FAMILY", number: "A-07", name: "Familie Klein", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(0,0,0,4) },
    { token: "T2-A08-GROUP", number: "A-08", name: "Gästegruppe Sirius", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(4,0,1,0) },
    { token: "T2-A09-STUDENTS", number: "A-09", name: "Lena Beispiel", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(1,1,0,0) },
    { token: "T2-A10-GROUP", number: "A-10", name: "Gruppe Plejaden", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(4,1,1,0) },
    { token: "T2-A11-FAMILY", number: "A-11", name: "Familie Vega", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(0,0,0,3) },
    { token: "T2-A12-GROUP", number: "A-12", name: "Besuchergruppe Mars", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(3,0,1,0) },
    { token: "T2-A13-GROUP", number: "A-13", name: "Gruppe Mond", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(2,1,0,0) },
    { token: "T2-A14-FAMILY", number: "A-14", name: "Familie Saturn", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(0,0,0,3) },
    { token: "T2-A15-PAIR", number: "A-15", name: "Gäste Andromeda", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(2,0,0,0) },

    { token: "T2-W01-FIRST", number: "W-01", name: "Warteliste Eins", kind: "waitlist", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(1,0,0,0), scenario: "W-01 · als Erste an der Reihe" },
    { token: "T2-W02-CANCELLED", number: "W-02", name: "Warteliste Zwei", kind: "waitlist", status: "cancelled", eventId: activeEvent.id, eventDate: today, booked: counts(2,0,0,0) },
    { token: "T2-W03-CANCELLED", number: "W-03", name: "Warteliste Drei", kind: "waitlist", status: "cancelled", eventId: activeEvent.id, eventDate: today, booked: counts(1,0,0,0) },
    { token: "T2-W04-OPEN", number: "W-04", name: "Warteliste Vier", kind: "waitlist", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(0,1,0,0) },
    { token: "T2-W05-OPEN", number: "W-05", name: "Familie Wartend", kind: "waitlist", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(0,0,0,3) },
    { token: "T2-W06-BLOCKED", number: "W-06", name: "Warteliste Sechs", kind: "waitlist", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(2,0,0,0), scenario: "W-06 · frühere W-Nummern offen" },

    { token: "T2-X-WRONG-EVENT", number: "A-27", name: "Andere Veranstaltung", kind: "regular", status: "active", eventId: "AVT-DEMO-OTHER", eventDate: tomorrow, booked: counts(2,0,0,0), scenario: "Falsche Veranstaltung / falscher Tag" }
  ];

  const initialCheckins = {
    "T2-A04-ALREADY": {
      counts: counts(1,0,0,0),
      checkedAt: new Date(Date.now() - 42 * 60000).toISOString(),
      override: false,
      entryType: "regular"
    }
  };

  window.AVT_DEMO_DATA = Object.freeze({ activeEvent, registrations, initialCheckins });
})();
