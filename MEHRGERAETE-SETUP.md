# AVT Check-in 0.3.0-test.6 – Mehrgeräte-Test

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


## Aktualisierung von 0.3.0-test.1

Da das Testbackend bereits besteht:

1. Nur den Inhalt von `backend-apps-script/Code.gs` im vorhandenen
   Apps-Script-Projekt ersetzen und speichern.
2. `setupTestBackend()` erneut ausführen. Dadurch werden die Testanmeldungen
   wieder korrekt angelegt.
3. **Bereitstellen → Bereitstellungen verwalten → Bearbeiten** öffnen.
4. Bei Version **Neue Version** auswählen und bereitstellen.
5. Die `/exec`-URL bleibt unverändert.
6. Im Frontend die bisherige `/exec`-URL wieder in `js/config.js` eintragen,
   `enabled: true` setzen und Version 0.3.0-test.6 nach GitHub hochladen.


## Aktualisierung auf 0.3.0-test.6

Für diese Version ist **keine neue Apps-Script-Bereitstellung nötig**. Das
bereits funktionierende Backend 0.3.0-test.2 bleibt bestehen.

Nur:

1. vorhandene `/exec`-URL in `js/config.js` eintragen,
2. `enabled: true` setzen,
3. Frontend 0.3.0-test.6 nach GitHub hochladen.

Im grünen Statusbalken erscheint nach erfolgreicher Verbindung die Uhrzeit der
letzten Synchronisierung. Sie muss sich ungefähr alle 15 Sekunden ändern.


## Aktualisierung auf 0.3.0-test.6

Für diese Version ist keine neue Apps-Script-Bereitstellung erforderlich.

1. Die bereits funktionierende `/exec`-URL erneut in `js/config.js` eintragen.
2. `enabled: true` setzen.
3. Frontend 0.3.0-test.6 nach GitHub hochladen.
4. Auf beiden Geräten die neue Versionsnummer prüfen.

Die Warnzeit für einen noch nicht bestätigten Check-in steht unter
`saveFlow.warningSeconds` und beträgt standardmäßig 8 Sekunden.


## Aktualisierung auf 0.3.0-test.6

Für diese Version ist keine neue Apps-Script-Bereitstellung erforderlich.

1. Die vorhandene `/exec`-URL in `js/config.js` eintragen.
2. `enabled: true` setzen.
3. Frontend 0.3.0-test.6 nach GitHub hochladen.
4. Auf beiden Geräten die Versionsnummer kontrollieren.

Beim Test einer Offline-Spende muss im oberen Balken ausdrücklich
`1 Spende ausstehend` erscheinen. Nach der Synchronisierung wird die gelbe
Spendenmeldung grün.


## Aktualisierung auf 0.3.0-test.6

Eine neue Apps-Script-Bereitstellung ist nicht erforderlich.

1. Die vorhandene `/exec`-URL in `js/config.js` eintragen.
2. `enabled: true` setzen.
3. Frontend 0.3.0-test.6 nach GitHub hochladen.
4. Auf beiden Geräten die Versionsnummer prüfen.

Test des Parallelfalls:

1. Auf beiden Geräten dieselbe offene Anmeldung auswählen.
2. Auf Gerät 1 den Check-in abschließen.
3. Unmittelbar danach auf Gerät 2 abschließen.
4. Gerät 2 muss „Bereits eingecheckt“ melden.
5. Die Anmeldung darf im gemeinsamen Stand nur einmal enthalten sein.
