# AVT Check-in Demo 0.1.0-test.2

Zweite eigenständige Testversion der mobilen Check-in-App für Sternführungen.

## Neu in dieser Version

- Die Kamera wird beim Öffnen des Scanners und nach „Nächsten QR-Code scannen“ automatisch gestartet.
- Die schwarze Kamerafläche ist jetzt selbst antippbar und startet die Kamera erneut.
- Stornierte Anmeldungen können nach deutlicher Warnung und zusätzlicher Bestätigung als Ausnahme eingecheckt werden.
- Stornierte Ausnahmen werden separat gezählt und vollständig auf die Kapazität angerechnet.
- Die Testveranstaltung enthält genau 45 regulär bestätigte Personen bei einer Kapazität von 65.
- Die Übersicht zeigt deshalb zu Beginn ausdrücklich 20 „von Anfang an nicht vergebene“ Plätze.
- Minderteilnahme, Mehrteilnahme, Wartelisten-Check-ins und stornierte Ausnahmen verändern die Zahl der sicher freien Plätze nachvollziehbar.
- Zehn neue Test-QR-Codes; die Codes der ersten Testversion sind für diese Version absichtlich nicht mehr gültig.
- Direktlink zu den Test-QR-Codes auf der Startseite.

## Bereits enthalten

- gemeinsamer Demo-Login mit drei Speicheroptionen
- aktive Veranstaltung wird als „von der Homepage übernommen“ simuliert
- Kapazität 65 Personen
- Familienanmeldung startet beim Check-in mit 3 Personen
- Kamera-Scan, Bildimport und manuelle Suche
- Prüfung der Veranstaltung und des Veranstaltungstags
- Erkennung bereits eingecheckter Anmeldungen
- Wartelistenreihenfolge mit Warnung bei übersprungenen W-Nummern
- bewusster Check-in trotz Wartelistenwarnung
- Plus-/Minus-Tasten je Personenkategorie
- Übersicht für reguläre Personen, Warteliste und stornierte Ausnahmen
- responsive Bedienung ab 320 Pixel Breite, insbesondere für das iPhone 12 mini
- installierbare Web-App-Grundlage mit Manifest und Service Worker

## Demo-Passwort

`avt-demo`

Das Passwort steht absichtlich im Demo-Quellcode und ist keine produktive Sicherheitslösung.

## Test-QR-Codes

Die neuen Testcodes liegen im Ordner `test-qr-codes`. Nach der Veröffentlichung können sie auch direkt über den Button „Test-QR-Codes öffnen“ in der Demo aufgerufen werden.

Besonders wichtige Tests:

- `A-05`: stornierte Anmeldung mit zusätzlicher Bestätigung
- `A-06`: vier Personen angemeldet; für den Test der Minderteilnahme auf drei reduzieren
- `W-01`: kleinste offene Wartelistennummer
- `W-06`: frühere Wartelistennummern sind noch offen
- `A-27`: falsche Veranstaltung und falscher Tag
- „Fremder Code“: kein gültiger AVT-Code

## Aktualisierung des GitHub-Repositorys

1. ZIP-Datei entpacken.
2. Den Inhalt des Ordners `AVT-Checkin-Demo-0.1.0-test.2` in die Wurzelebene des bestehenden Repositorys hochladen.
3. Vorhandene Dateien mit gleichem Namen ersetzen.
4. Nach Abschluss der GitHub-Pages-Bereitstellung die App neu öffnen.
5. Falls noch die alte Versionsnummer angezeigt wird, die Seite einmal vollständig neu laden oder Safari schließen und erneut öffnen.

Alte QR-Bilddateien, deren Dateiname sich geändert hat, können im Repository verbleiben. Sie werden von der neuen Testcode-Seite nicht mehr verwendet. Für einen ganz sauberen Projektstand können sie später gelöscht werden.

## Wichtige Grenze der Demo

Die App nutzt weiterhin noch kein Google-Apps-Script-Backend. Alle Demo-Check-ins werden nur im Browser des jeweiligen Geräts gespeichert. Verschiedene Handys sehen deshalb noch nicht denselben Stand.

Es werden keine produktiven Teilnehmerdaten verwendet oder verändert.

## Veröffentlichung über GitHub Pages

GitHub Pages bleibt unverändert auf:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

Der Kamerazugriff funktioniert regulär nur über HTTPS oder lokal über `localhost`.

## Externe Bibliothek

Die Demo lädt `jsQR 1.4.0` zur QR-Erkennung von unpkg.com. jsQR steht unter der Apache License 2.0. In einer späteren Testversion kann die Bibliothek vollständig in das Projektpaket aufgenommen werden.

## Nächste Entwicklungsstufe

Nach dem erneuten Bedienungstest:

- weitere Rückmeldungen zum mobilen Ablauf einarbeiten
- separate Testtabelle und Apps-Script-Test-Backend vorbereiten
- gemeinsame Live-Übersicht mehrerer Handys
- serverseitigen gemeinsamen Login absichern
- aktive Veranstaltung aus dem bestehenden AVT-System abrufen
- Spalte „Eingecheckte Personen“ zunächst in einer Testkopie erproben
