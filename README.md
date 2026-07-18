# AVT Check-in Demo 0.2.0-test.6

Letzte geplante lokale Ein-Gerät-Testversion vor dem Test mit zwei Geräten.

## Neu und korrigiert

- „Sicher freie Plätze“ wird unmittelbar nach Login und App-Start korrekt angezeigt.
- Der dunkelblaue Bereich „Zu zahlender Eintritt“ nutzt ungefähr die halbe Breite.
- Rechts daneben steht auf gleicher Höhe der Button „Check-in abschließen“.
- Die Übersicht enthält zusätzlich:
  - Regulär (noch nicht eingecheckt)
  - Warteliste (noch nicht eingecheckt)
- Die Demo enthält jetzt eine vollständige Wartelistenfolge W-001 bis W-007.
- Die Wartelistenreihenfolge wird anhand jeder einzelnen Personen-ID geprüft.
- Beim Check-in von W-006 wird gewarnt, solange niedrigere W-IDs offen sind.
- Der Wartelisten-Check-in bleibt nach zusätzlicher Bestätigung trotzdem möglich.
- Neue V8-Test-QR-Codes.

## Empfohlener Wartelistentest

1. W-001/W-002 einchecken.
2. W-006/W-007 scannen.
3. Die App muss weiterhin auf die offenen IDs W-003, W-004 und W-005 hinweisen.
4. Der Check-in muss nach ausdrücklicher Bestätigung trotzdem möglich bleiben.

## Testpasswort

`avt-demo`
