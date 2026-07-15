# Projektstatus AVT Check-in

Stand: 15.07.2026  
Aktuelle Testversion: `0.1.0-test.2`

## Festgelegte Anforderungen

- Entwicklung wie beim Astro Night Planner: vollständige versionierte Projektpakete, kein Austausch einzelner Codeschnipsel.
- Die Scanner-Oberfläche wird als eigenständige HTTPS-Web-App entwickelt.
- Produktive Daten und Google Apps Script bleiben während der Demo-Phase unverändert.
- Maximale reguläre Personenzahl wird später aus `MAX_CONFIRMED_PERSONS` im Tabellenblatt `Konfiguration` gelesen; derzeit 65.
- Familienanmeldung zählt standardmäßig als 3 Personen.
- Gemeinsamer Standardlogin; keine namentliche Benutzerverwaltung erforderlich.
- Login wahlweise nur für die Sitzung, für den Veranstaltungstag oder dauerhaft auf dem Gerät speichern.
- Initial aktive Veranstaltung wird später aus derselben Quelle übernommen, die die Homepage verwendet.
- QR-Code muss Veranstaltung und Tag eindeutig zuordnen.
- Bereits eingecheckte Anmeldungen müssen erkannt werden.
- Stornierte Anmeldungen dürfen nach deutlicher Warnung und zusätzlicher Bestätigung ausnahmsweise eingecheckt werden.
- Stornierte Ausnahmen werden getrennt ausgewiesen und auf die Kapazität angerechnet.
- Warteliste muss aufsteigend bearbeitet werden; bei W-06 werden offene kleinere W-Nummern angezeigt.
- Ein Check-in trotz Wartelistenreihenfolge bleibt nach bewusster Bestätigung möglich.
- Tatsächliche Personenzahlen je Kategorie können mit Plus/Minus verändert werden.
- Die Kapazitätsanzeige berücksichtigt auch von Anfang an nicht vergebene Plätze.
- Übersicht trennt reguläre, Wartelisten- und stornierte Ausnahme-Check-ins und zeigt Minderteilnahme sowie sicher freie Plätze.
- Später zusätzliche sichtbare Spalte `Eingecheckte Personen` in `Aktuelle_Anmeldungen`.
- Mehrere Handys müssen später eine gemeinsame serverseitige Live-Übersicht verwenden.

## Inhalt von 0.1.0-test.2

- automatischer Kamerastart auf dem Scanweg
- antippbare schwarze Kamerafläche als Rückfallmöglichkeit
- Ausnahme-Check-in für stornierte Anmeldungen
- 45 bestätigte Personen bei Kapazität 65; initial 20 freie Plätze
- nachvollziehbare Kapazitätsaufteilung
- zehn neue Test-QR-Codes
- lokale Speicherung nur auf dem jeweiligen Testgerät

## Noch nicht umgesetzt

- Verbindung zum bestehenden Projekt `Server Status Sternführung`
- Test- oder Produktivzugriff auf Google Sheets
- Mehrgeräte-Synchronisierung
- serverseitige Passwortprüfung
- automatische Übernahme der realen Homepage-Veranstaltung
- QR-Code-Erzeugung in den realen Bestätigungsmails
- produktive Spalte `Eingecheckte Personen`

## Nächster Schritt nach dem Bedienungstest

Erneute Prüfung auf iPhone und Android, insbesondere:

1. Startet die Kamera unmittelbar nach „QR-Code scannen“?
2. Startet sie unmittelbar nach „Nächsten QR-Code scannen“?
3. Startet sie beim Antippen der schwarzen Kamerafläche erneut?
4. Ist der stornierte Ausnahme-Check-in verständlich und ausreichend abgesichert?
5. Ist die Kapazitätsaufteilung mit 45 bestätigten und 20 zunächst freien Plätzen verständlich?

Danach wird entschieden, ob noch eine reine Layout-/Prozessversion folgt oder bereits die separate Testtabelle und das Apps-Script-Test-Backend begonnen werden.
