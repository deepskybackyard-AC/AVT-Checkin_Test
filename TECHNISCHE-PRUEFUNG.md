# Technische Prüfung – AVT Check-in 0.3.0-test.2

Geprüft:

- JavaScript-Syntax aller Frontend-Dateien
- `ensureSheets_()` enthält kein `sheet.clear()`
- `snapshot_()` darf bestehende Tabelleninhalte nicht löschen
- `resetData_()` leert Tabellen ausschließlich über `resetSheet_()`
- Backendversion ist 0.3.0-test.2
- QR-Bildimport verwendet `decodeImageFile()`
- vorhandene QR-Codes entsprechen weiterhin dem Präfix `AVT-CHECKIN-DEMO-V8:`
