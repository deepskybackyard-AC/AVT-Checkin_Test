# Technische Prüfung – AVT Check-in 0.2.0-test.10

Geprüft wurden:

- JavaScript-Syntax aller lokalen JavaScript-Dateien
- keine ungeschützte direkte Zuweisung mehr an die entfernten Elemente
  `eventTitle` und `eventTime`
- Loginformular und Passwortfeld sind im HTML vorhanden
- Login-, Info-, Aktualisierungs- und Abmeldebutton sind im HTML vorhanden
- versionsunabhängiger Login-Speicherschlüssel bleibt erhalten
- Service-Worker-Cache wurde auf 0.2.0-test.10 aktualisiert
- QR-Code-Datenformat bleibt unverändert

Ergebnis:

- JavaScript-Syntax: fehlerfrei
- Initialisierung ohne entfernte Veranstaltungsfelder: geprüft
- Login-Oberfläche und zugehörige Buttons: vorhanden
