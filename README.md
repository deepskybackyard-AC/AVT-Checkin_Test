# AVT Check-in Multi-Device 0.3.0-test.6

Diese Version ergänzt eine eindeutige Rückmeldung bei einem nahezu
gleichzeitigen Check-in auf zwei Geräten.

## Parallel-Check-in derselben Anmeldung

Wenn Gerät 1 eine Anmeldung erfolgreich speichert und Gerät 2 dieselbe
Anmeldung nahezu gleichzeitig abschließen möchte:

- verhindert das Backend weiterhin den zweiten Check-in,
- die App lädt sofort den gemeinsamen Stand,
- das Speicher-Overlay wird beendet,
- Gerät 2 zeigt jetzt ausdrücklich:

**Bereits eingecheckt**

**Diese Anmeldung wurde inzwischen auf einem anderen Gerät eingecheckt. Es
wurde kein zweiter Check-in gespeichert. Der gemeinsame Gesamtstand wurde
aktualisiert.**

Die App unterscheidet dafür zwischen:

- der Bestätigung des eigenen Schreibvorgangs und
- einem bereits vorhandenen Check-in mit einer anderen `operationId`.

## Backend

Das bereits verwendete Apps-Script-Backend `0.3.0-test.2` bleibt kompatibel.
Eine neue Backend-Bereitstellung ist nicht erforderlich.
