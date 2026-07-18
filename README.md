# AVT Check-in Multi-Device 0.3.0-test.2

Korrekturversion des ersten Mehrgeräte-Tests.

## Behobener Fehler

In `0.3.0-test.1` löschte das Apps-Script-Backend bei jedem Abruf des
gemeinsamen Status versehentlich die Tabelleninhalte. Dadurch war die
Backend-Verbindung zwar online, die Liste der Testanmeldungen war aber leer.
Ein korrekt erkannter Test-QR-Code wurde deshalb als unbekannt gemeldet.

In dieser Version:

- werden Tabellen beim Statusabruf nicht mehr gelöscht,
- werden Testanmeldungen nach `setupTestBackend()` dauerhaft erhalten,
- bleiben Check-ins und Spenden bei Aktualisierungen erhalten,
- funktioniert zusätzlich die Auswahl eines QR-Codes aus einer Bilddatei.

Die vorhandenen Test-QR-Codes bleiben gültig.
