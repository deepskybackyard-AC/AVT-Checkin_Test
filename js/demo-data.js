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

  const registrations = [
    { token: "A01-VALID", number: "A-01", name: "Anna Beispiel", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(2,0,0,0), scenario: "Regulär · 2 Erwachsene" },
    { token: "A02-FAMILY", number: "A-02", name: "Familie Muster", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(0,0,0,3), scenario: "Familie · Standard 3 Personen" },
    { token: "A03-MIXED", number: "A-03", name: "Tobias Beispiel", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(2,0,1,0), scenario: "Regulär · Erwachsene und Kind" },
    { token: "A04-ALREADY", number: "A-04", name: "Clara Beispiel", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(1,0,0,0), scenario: "Bereits eingecheckt" },
    { token: "A05-CANCELLED", number: "A-05", name: "Stornierte Anmeldung", kind: "regular", status: "cancelled", eventId: activeEvent.id, eventDate: today, booked: counts(2,0,0,0), scenario: "Storniert" },
    { token: "A06-GROUP", number: "A-06", name: "Gruppe Orion", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(3,1,0,0), scenario: "Regulär · 4 Personen" },
    { token: "A07-PARTIAL", number: "A-07", name: "Familie Klein", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(0,0,0,4), scenario: "Bereits eingecheckt · 1 Person weniger" },
    { token: "A08-DEMO", number: "A-08", name: "Gästegruppe Sirius", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(4,0,1,0) },
    { token: "A09-DEMO", number: "A-09", name: "Lena Beispiel", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(1,1,0,0) },
    { token: "A10-PARTIAL", number: "A-10", name: "Gruppe Plejaden", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(4,1,1,0) },
    { token: "A11-DEMO", number: "A-11", name: "Familie Vega", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(0,0,0,3) },
    { token: "A12-DEMO", number: "A-12", name: "Besuchergruppe Mars", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(3,0,1,0) },
    { token: "A13-DEMO", number: "A-13", name: "Gruppe Mond", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(2,1,0,0) },
    { token: "A14-DEMO", number: "A-14", name: "Familie Saturn", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(0,0,0,4) },
    { token: "A15-DEMO", number: "A-15", name: "Gästegruppe Jupiter", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(4,0,1,0) },
    { token: "A16-DEMO", number: "A-16", name: "Gruppe Andromeda", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(3,1,0,0) },
    { token: "A17-DEMO", number: "A-17", name: "Familie Cassiopeia", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(0,0,0,4) },
    { token: "A18-DEMO", number: "A-18", name: "Gästegruppe Perseus", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(3,0,1,0) },
    { token: "A19-DEMO", number: "A-19", name: "Gruppe Schwan", kind: "regular", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(2,1,1,0) },

    { token: "W01-FIRST", number: "W-01", name: "Warteliste Eins", kind: "waitlist", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(1,0,0,0), scenario: "W-01 · als Erste an der Reihe" },
    { token: "W02-CANCELLED", number: "W-02", name: "Warteliste Zwei", kind: "waitlist", status: "cancelled", eventId: activeEvent.id, eventDate: today, booked: counts(2,0,0,0) },
    { token: "W03-ALREADY", number: "W-03", name: "Warteliste Drei", kind: "waitlist", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(1,0,0,0), scenario: "W-03 · bereits eingecheckt" },
    { token: "W04-OPEN", number: "W-04", name: "Warteliste Vier", kind: "waitlist", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(0,1,0,0) },
    { token: "W05-OPEN", number: "W-05", name: "Familie Wartend", kind: "waitlist", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(0,0,0,3) },
    { token: "W06-BLOCKED", number: "W-06", name: "Warteliste Sechs", kind: "waitlist", status: "active", eventId: activeEvent.id, eventDate: today, booked: counts(2,0,0,0), scenario: "W-06 · frühere W-Nummern offen" },

    { token: "X-WRONG-EVENT", number: "A-27", name: "Andere Veranstaltung", kind: "regular", status: "active", eventId: "AVT-DEMO-OTHER", eventDate: tomorrow, booked: counts(2,0,0,0), scenario: "Falsche Veranstaltung / falscher Tag" }
  ];

  const initialCheckins = {
    "A04-ALREADY": { counts: counts(1,0,0,0), checkedAt: new Date(Date.now() - 42 * 60000).toISOString(), override: false },
    "A07-PARTIAL": { counts: counts(0,0,0,3), checkedAt: new Date(Date.now() - 31 * 60000).toISOString(), override: false },
    "A10-PARTIAL": { counts: counts(4,1,0,0), checkedAt: new Date(Date.now() - 18 * 60000).toISOString(), override: false },
    "W03-ALREADY": { counts: counts(1,0,0,0), checkedAt: new Date(Date.now() - 12 * 60000).toISOString(), override: true }
  };

  window.AVT_DEMO_DATA = Object.freeze({ activeEvent, registrations, initialCheckins });
})();
