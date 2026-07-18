# AVT Check-in 0.3.0-test.1 – Mehrgeräte-Test

Diese Version besteht aus zwei Teilen:

1. Frontend für GitHub Pages
2. Apps-Script-Testbackend für gemeinsame Daten

## A. Apps-Script-Backend einrichten

1. Google Apps Script öffnen.
2. Neues Projekt erstellen: `AVT Check-in Test Backend`.
3. Aus dem Ordner `backend-apps-script` die Datei `Code.gs` in Apps Script kopieren.
4. In den Projekteinstellungen `appsscript.json` sichtbar machen und mit der mitgelieferten Datei ersetzen.
5. Funktion `setupTestBackend()` auswählen und einmal ausführen.
6. Berechtigungen bestätigen.
7. Danach **Bereitstellen → Neue Bereitstellung → Web-App**:
   - Typ: Web-App
   - Ausführen als: Ich
   - Wer hat Zugriff: Jeder
8. Die Web-App-URL mit `/exec` kopieren.

## B. Frontend konfigurieren

In `js/config.js`:

```js
backend: {
  url: "HIER_DIE_EXEC_URL_EINTRAGEN",
  enabled: true,
  pollSeconds: 15
}
```

Danach das Frontend wie gewohnt nach GitHub Pages hochladen.

## C. Geräte-Test

Auf beiden Geräten öffnen:

- iPhone 12 mini
- Samsung Tablet 9,7"

Oben muss stehen:

`Online · gemeinsamer Test`

Dann testen:

1. iPhone: A-001 einchecken.
2. Tablet: Aktualisieren drücken oder bis zur Auto-Aktualisierung warten.
3. Tablet muss A-001 als eingecheckt sehen.
4. Tablet: andere Anmeldung einchecken.
5. iPhone muss danach den gemeinsamen Gesamtstand sehen.
6. Doppel-Check-in derselben Anmeldung muss vom Backend verhindert werden.
7. Warteliste W-006 erst nach Warnung einchecken.
8. Optional: Ein Gerät offline nehmen und genau ein Gerät für Offline-Check-ins nutzen.
