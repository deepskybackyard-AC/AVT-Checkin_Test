# Technische Prüfung – AVT Check-in 0.3.0-test.6

Geprüft:

- JavaScript-Syntax aller Frontend-Dateien
- eigener Check-in und fremder Parallel-Check-in werden über `operationId`
  unterschieden
- Backendfehler „bereits eingecheckt“ löst sofortige Statusprüfung aus
- bei fremdem Check-in wird kein Schreibvorgang erneut gesendet
- Ergebnisstatus `duplicate` wird bis `completeExisting()` weitergereicht
- eindeutige Meldung „Bereits eingecheckt“ vorhanden
- gemeinsamer Gesamtstand wird vor der Meldung aktualisiert
- Apps-Script-Backend muss nicht geändert werden
