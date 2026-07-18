# AVT Check-in Demo 0.2.0-test.10

Korrekturversion der kompakten Ein-Gerät-Testversion.

## Korrigiert

- Die Anmeldung funktioniert wieder.
- Ursache in `0.2.0-test.9`: Nach der Verkleinerung des Veranstaltungsblocks
  versuchte die App weiterhin, nicht mehr vorhandene Felder für
  Veranstaltungsname und Uhrzeit zu befüllen. Dadurch wurde die
  Initialisierung vor dem Login abgebrochen.
- Die Veranstaltungsdetails bleiben weiterhin über den Info-Button erreichbar.
- Der gemeinsame Passwortschutz bleibt in dieser Testversion erhalten.
- Ein dauerhaft gespeicherter Login verwendet weiterhin den
  versionsunabhängigen Speicherschlüssel.

## Testpasswort

`avt-demo`

Die QR-Codes aus `0.2.0-test.9` bleiben gültig, da sich das Datenformat nicht
geändert hat.
