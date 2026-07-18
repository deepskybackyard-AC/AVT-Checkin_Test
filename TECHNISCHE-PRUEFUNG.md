# Technische Prüfung – AVT Check-in 0.3.0-test.4

Geprüft:

- JavaScript-Syntax aller Frontend-Dateien
- animiertes Inline-SVG vorhanden
- Speicher-Overlay sperrt `.app-shell` mit `inert`
- Standardwarnzeit 8 Sekunden
- „Weiter warten“ ruft `sendPrepared()` nicht erneut auf
- derselbe Vorgang besitzt eine stabile `operationId`
- Warnzyklus startet nach jeder Entscheidung „Weiter warten“ erneut
- Offline-Fallback legt dieselbe Operation in der Queue ab
- Queue kann durch bereits erfolgreichen Originalrequest idempotent bereinigt werden
- gelbe und grüne Offline-Synchronisationsmeldung vorhanden
- Apps-Script-Backend muss nicht geändert werden
