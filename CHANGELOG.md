# Changelog

## 0.3.0-test.6

- Eindeutige Meldung bei konkurrierendem Check-in auf zwei Geräten.
- Vorhandener Check-in mit fremder `operationId` wird nicht mehr als eigener
  erfolgreicher Speichervorgang behandelt.
- Gemeinsamer Stand wird bei Backendmeldung „bereits eingecheckt“ sofort
  nachgeladen.
- Zweiter Check-in bleibt verhindert.
- Speicher-Overlay wird nach der Konfliktprüfung sauber beendet.
