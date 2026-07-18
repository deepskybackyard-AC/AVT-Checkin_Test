# AVT Check-in Multi-Device 0.3.0-test.3

Korrektur der automatischen Mehrgeräte-Aktualisierung.

## Behoben

- Die automatische Aktualisierung verwendet keinen einfachen `setInterval`
  mehr, sondern einen nicht überlappenden, selbst neu geplanten Abruf.
- Der gemeinsame Stand wird weiterhin alle 15 Sekunden vom Backend geladen.
- Zusätzlich wird sofort aktualisiert, wenn die App wieder sichtbar wird,
  das Browserfenster den Fokus erhält, die Seite wiederhergestellt wird oder
  die Internetverbindung zurückkehrt.
- Im grünen Backendstatus wird die Uhrzeit der letzten erfolgreichen
  Synchronisierung angezeigt.
- Während einer automatischen Aktualisierung bleibt ein bereits eingetragener
  Spendenbetrag im Eingabefeld erhalten.
- Spenden werden jetzt ebenfalls über das gemeinsame Backend gespeichert.
- Der QR-Import aus einer Bilddatei wurde vollständig korrigiert.
- Wird eine gerade geöffnete Anmeldung auf dem anderen Gerät eingecheckt,
  zeigt dieses Gerät nach der nächsten Aktualisierung den Hinweis
  „Bereits eingecheckt“.

## Backend

Das Apps-Script-Backend `0.3.0-test.2` bleibt kompatibel und muss für diese
Frontendkorrektur nicht erneut bereitgestellt werden.

In `js/config.js` muss lediglich wieder die bereits funktionierende `/exec`-URL
eingetragen und `enabled: true` gesetzt werden.
