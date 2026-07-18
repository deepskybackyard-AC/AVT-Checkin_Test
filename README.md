# AVT Check-in Multi-Device 0.3.0-test.1

Erste Mehrgeräte-Testversion für iPhone 12 mini und Samsung Tablet 9,7".

## Wichtig

Diese Version benötigt ein Apps-Script-Testbackend.

- Ohne Backend läuft sie weiterhin im lokalen Fallback-Modus.
- Mit Backend sehen mehrere Geräte denselben Check-in-Stand.
- Schreibvorgänge werden serverseitig mit `LockService` geschützt.
- Doppel-Check-ins derselben Anmeldung werden serverseitig verhindert.
- Offline-Check-ins werden lokal zwischengespeichert und später synchronisiert.

## Einrichtung

Siehe: `MEHRGERAETE-SETUP.md`

## Testpasswort

`avt-demo`
