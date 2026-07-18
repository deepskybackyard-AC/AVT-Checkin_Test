# AVT Check-in Multi-Device 0.3.0-test.4

Diese Version ergänzt einen sicheren und deutlich sichtbaren Speicherablauf.

## Neue Speicheranzeige

Nach der Bestätigung eines Online-Check-ins:

- wird die gesamte übrige Oberfläche gesperrt,
- erscheint ein animierter, rotierender SVG-Spinner,
- darunter steht **„Check-in wird gespeichert …“**.

## Verzögerte Speicherung

Die Warnzeit ist in `js/config.js` konfigurierbar:

```javascript
saveFlow: {
  warningSeconds: 8,
  requestTimeoutSeconds: 30,
  verificationSeconds: 3,
  offlineFallbackEnabled: true
}
```

Nach standardmäßig 8 Sekunden erscheint eine Auswahl:

- **Weiter warten**
- **Offline speichern**
- **Abbrechen**

Bei **Weiter warten** wird derselbe bereits gestartete Vorgang weiter
beobachtet. Der Check-in wird ausdrücklich nicht erneut an den Server gesendet.
Nach weiteren 8 Sekunden erscheint die Auswahl erneut, solange noch keine
Bestätigung vorliegt.

Bei **Abbrechen** kehrt die App nur dann zur Prüfung zurück, wenn der
ursprüngliche Request beendet ist und das Backend bestätigt, dass der Vorgang
nicht gespeichert wurde. Bei unklarem Status bleibt die sichere Auswahl
„Weiter warten“ oder „Offline speichern“.

## Offline-Synchronisierung

Solange ein Check-in nur lokal gepuffert ist, erscheint gelb:

**Offline gespeichert – noch nicht synchronisiert**

Nach erfolgreicher Übertragung wird die Meldung grün und lautet:

**Die offline zwischengespeicherten Check-ins wurden erfolgreich synchronisiert.**

## Backend

Das bereits funktionierende Apps-Script-Backend `0.3.0-test.2` bleibt
kompatibel. Es muss nicht neu bereitgestellt werden.
