# Technische Prüfung – AVT Check-in 0.3.0-test.3

Geprüft:

- JavaScript-Syntax aller Frontend-Dateien
- rekursiver `setTimeout` statt `setInterval`
- höchstens ein laufender Statusabruf durch `refreshPromise`
- automatische Aktualisierung bei Sichtbarkeit, Fokus, Wiederherstellung und Online-Ereignis
- Statusanzeige enthält Uhrzeit der letzten Synchronisierung
- Spendenspeicherung verwendet `AVT_BACKEND.write("donation", ...)`
- automatische Aktualisierung löscht keinen eingegebenen Spendenbetrag
- QR-Bildimport übergibt den gelesenen Text direkt an `handlePayload`
- Service-Worker-Cache verwendet 0.3.0-test.3
