# AVT Check-in Demo 0.1.0-test.1

Erste eigenständige Testversion der mobilen Check-in-App für Sternführungen.

## Was diese Testversion bereits kann

- gemeinsamer Demo-Login mit drei Speicheroptionen
- aktive Veranstaltung wird als „von der Homepage übernommen“ simuliert
- Kapazität 65 Personen
- Familienanmeldung startet beim Check-in mit 3 Personen
- Kamera-Scan von Test-QR-Codes
- QR-Code aus einem gespeicherten Bild lesen
- manuelle Suche nach Anmeldenummer oder Name
- Prüfung: richtige Veranstaltung und richtiger Tag
- Prüfung: storniert oder bereits eingecheckt
- Wartelistenreihenfolge mit Warnung bei übersprungenen W-Nummern
- bewusster Check-in trotz Warnung
- Plus-/Minus-Tasten je Personenkategorie
- Übersicht zu regulären und Wartelisten-Check-ins
- Anzeige der Minderteilnahme und sicher freien Plätze
- responsive Bedienung ab 320 Pixel Breite, insbesondere iPhone 12 mini
- installierbare Web-App-Grundlage mit Manifest und Service Worker

## Wichtige Grenze dieser ersten Version

Die App nutzt noch **kein Google-Apps-Script-Backend**. Alle Demo-Check-ins werden nur im Browser des jeweiligen Geräts gespeichert. Verschiedene Handys sehen daher noch nicht denselben Stand. Diese Mehrgeräte-Synchronisierung wird erst mit einer separaten Testtabelle und einem Test-Backend ergänzt.

Es werden keine produktiven Teilnehmerdaten verwendet oder verändert.

## Demo-Passwort

`avt-demo`

Dieses Passwort ist absichtlich im Demo-Quellcode enthalten. Es ist keine produktive Sicherheitslösung.

## Test-QR-Codes

Die Testcodes liegen im Ordner `test-qr-codes`. Am einfachsten:

1. `test-qr-codes/index.html` auf einem Computer öffnen.
2. Die Check-in-Demo auf dem Smartphone öffnen.
3. „QR-Code scannen“ wählen und einen Testcode vom Computerbildschirm scannen.

Alternativ können alle Szenarien direkt in der App unter „Demoszenarien ohne QR-Code testen“ aufgerufen werden.

## Veröffentlichung über GitHub Pages

1. Neues Repository anlegen, zum Beispiel `AVT-Checkin-Test`.
2. Den **Inhalt dieses Ordners** in die Wurzelebene des Repositorys hochladen.
3. In GitHub unter `Settings → Pages` bei „Build and deployment“ wählen:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
4. Nach der Veröffentlichung die angezeigte HTTPS-Adresse auf dem Smartphone öffnen.

Der Kamerazugriff funktioniert regulär nur über HTTPS oder lokal über `localhost`.

Das Repository kann später auf ein anderes GitHub-Konto oder in eine GitHub-Organisation übertragen werden.

## Lokaler Start am Computer

Ein Doppelklick auf `index.html` reicht für einfache Layoutprüfungen. Für den vollständigen Ablauf, die Installation und den Kamerazugriff empfiehlt sich ein lokaler Webserver, zum Beispiel im Projektordner:

```bash
python -m http.server 8080
```

Danach im Browser `http://localhost:8080` öffnen.

## Externe Bibliothek

Die Demo lädt `jsQR 1.4.0` zur QR-Erkennung von unpkg.com. jsQR steht unter der Apache License 2.0. In einer späteren Testversion kann die Bibliothek vollständig in das Projektpaket aufgenommen werden.

## Nächste sinnvolle Stufe

Nach Prüfung von Layout und Prozess:

- Rückmeldungen einarbeiten
- Test-Backend mit separater Google-Tabelle anbinden
- gemeinsame Live-Übersicht mehrerer Handys
- echten gemeinsamen Login serverseitig absichern
- aktive Veranstaltung aus dem bestehenden AVT-System abrufen
- Spalte „Eingecheckte Personen“ in einer Testkopie erproben
