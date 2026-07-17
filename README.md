# AVT Check-in Demo 0.2.0-test.5

Voraussichtlich letzte lokale Ein-Gerät-Testversion vor dem gemeinsamen Test mit zwei Geräten.

## Neu und korrigiert

- Bei „Vereinsmitglied“ wird 0,00 € nur eingesetzt, wenn noch kein korrigierter Betrag eingetragen wurde.
- Ein bereits eingetragener Betrag bleibt bei Auswahl des Grundes erhalten.
- Der Hilfetext unter Korrekturbetrag und Grund wurde aus Platzgründen entfernt.
- Unter „x von y Personen eingecheckt“ werden wieder die sicher freien Plätze angezeigt.
- Bei höheren Wartelistennummern erscheint eine deutliche Warnung über noch offene frühere Wartelistenanmeldungen.
- Der Check-in bleibt nach zusätzlicher Bestätigung trotzdem möglich.
- Nach einem QR-Scan wird der vollständige Name kompakt angezeigt.
- Die einzelne sichtbare Anmelde-ID entfällt im Check-in-Kopf.
- Ein kompakter Button „IDs (n)“ zeigt alle zur Anmeldung gehörenden Personen-IDs.
- Die Demo bildet jetzt ausdrücklich eine eigene ID je angemeldeter Person ab.
- Die Suche findet Anmeldungen auch über jede einzelne zugehörige ID.
- Der dauerhafte Login verwendet jetzt einen versionsunabhängigen Speicherschlüssel und bleibt bei späteren Updates erhalten.

## Testpasswort

`avt-demo`

## Hinweis

Die Check-in-Daten dieser Version werden wegen des neuen Mehrfach-ID-Datenmodells noch einmal in einem neuen lokalen Testspeicher geführt. Der dauerhaft gespeicherte Login ist davon unabhängig.
