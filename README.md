# AVT Check-in Demo 0.1.0-test.3

Dritte eigenständige Testversion der mobilen Check-in-App für Sternführungen.

## Neu in dieser Version

- Der große gelbe Testhinweis erscheint im laufenden Check-in nicht mehr. Die Kennzeichnung `DEMO` im Kopf bleibt bestehen.
- Der Hinweis zum Familien-Standardwert erscheint nur noch bei einer Familienanmeldung.
- Die Schaltfläche oben rechts aktualisiert jetzt nur die Check-in-Statistik.
- Sie führt nicht mehr zur Anmeldung zurück und verändert weder die aktuelle Ansicht noch bereits eingegebene Personenzahlen.
- Die Abmeldung befindet sich jetzt separat am Ende der Gesamtübersicht.

## Aktualisierungsschaltfläche

In dieser Version liegen die Check-ins weiterhin nur auf dem jeweiligen Gerät. Beim Antippen von `⟳` werden die Werte deshalb erneut aus dem lokalen Gerätespeicher gelesen.

In der kommenden Mehrgeräte-Version wird dieselbe Schaltfläche den gemeinsamen Test-Server abrufen. Die Bedienung bleibt dadurch unverändert.

## Familienhinweis

Bei regulären Anmeldungen ohne Familienkategorie wird kein Familienhinweis mehr angezeigt. Bei einer echten Familienanmeldung bleibt der Hinweis auf den Standardwert von 3 Personen sichtbar.

## Demo-Passwort

`avt-demo`

## Test-QR-Codes

Die QR-Codes aus 0.1.0-test.2 bleiben für diese reine Oberflächenkorrektur gültig. Sie befinden sich weiterhin im Ordner `test-qr-codes`.

## Aktualisierung des GitHub-Repositorys

1. ZIP-Datei entpacken.
2. Den Inhalt des Ordners `AVT-Checkin-Demo-0.1.0-test.3` in die Wurzelebene des bestehenden Repositorys hochladen.
3. Vorhandene Dateien mit gleichem Namen ersetzen.
4. Nach Abschluss der GitHub-Pages-Bereitstellung die App neu laden.
5. Oben muss `Version 0.1.0-test.3` stehen.

Auf dem iPhone kann wegen des Service Workers ein vollständiges Schließen und erneutes Öffnen der Seite erforderlich sein.

## Noch bestehende Grenze

Diese Version besitzt noch kein gemeinsames Backend. Zwei verschiedene Handys sehen weiterhin jeweils nur ihre eigenen lokalen Test-Check-ins.

## Nächste Entwicklungsstufe

Nach Bestätigung dieser Bedienung folgt eine neue Entwicklungsstufe mit:

- separatem Google-Apps-Script-Test-Backend
- gemeinsamer Test-Datenhaltung
- gleichzeitigem Check-in mit mindestens zwei Handys
- serverseitiger Verhinderung doppelter Check-ins
- Aktualisierung der Gesamtstatistik über die Schaltfläche `⟳`
- weiterhin ausschließlich Testdaten, noch keine produktiven Anmeldungen
