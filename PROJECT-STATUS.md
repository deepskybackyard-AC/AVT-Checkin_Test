# Projektstatus – AVT Check-in

Aktuelle Version: 0.3.0-test.2

Die Backend-Verbindung der ersten Mehrgeräte-Version funktionierte, aber der
Statusabruf löschte die Testtabellen. Dieser Fehler ist behoben.

Für die Aktualisierung:

1. `backend-apps-script/Code.gs` im Apps-Script-Testprojekt ersetzen.
2. `setupTestBackend()` erneut ausführen.
3. Die bestehende Web-App über „Bereitstellungen verwalten“ als neue Version veröffentlichen.
4. Frontend 0.3.0-test.2 mit der bisherigen `/exec`-URL konfigurieren und auf GitHub hochladen.
