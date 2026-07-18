# Changelog

## 0.3.0-test.4

- Auffälliges Speicher-Overlay mit animiertem Inline-SVG-Spinner.
- Komplette Oberfläche während des Speicherns gesperrt.
- Konfigurierbare Warnzeit, Standard 8 Sekunden.
- Dreifachauswahl bei langsamer Speicherung: weiter warten, offline speichern, abbrechen.
- „Weiter warten“ beobachtet denselben Request; kein erneutes Senden.
- Warnung wiederholt sich nach jeweils weiteren 8 Sekunden.
- Sicherer Abbruch nur bei bestätigtem Fehlschlag.
- Offline-Check-ins zeigen nach erfolgreicher Synchronisierung eine grüne Bestätigung.
- Operationen erhalten eine stabile ID für idempotente Offline-Synchronisierung.
