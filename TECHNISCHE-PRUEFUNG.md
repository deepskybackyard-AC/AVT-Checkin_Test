# Technische Prüfung – AVT Check-in 0.3.0-test.5

Geprüft:

- JavaScript-Syntax aller Frontend-Dateien
- Spenden verwenden `saveOperationWithProgress("donation", ...)`
- animiertes Overlay zeigt „Spende wird gespeichert …“
- Donation-Operation erhält eine stabile `operationId`
- `findSavedOperation()` erkennt gespeicherte Spenden
- Queue-Synchronisierung liefert die Typen der synchronisierten Operationen
- Statusbalken unterscheidet Check-ins und Spenden
- gelbe Meldung für noch offene Offline-Spende
- grüne Meldung nach erfolgreicher Spendensynchronisierung
- Apps-Script-Backend muss nicht verändert werden
