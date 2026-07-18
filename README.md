# AVT Check-in Demo 0.2.0-test.14

Strukturelle Korrektur des abgeschnittenen oberen Inhaltsbereichs.

## Was wurde geändert?

Die vorherigen Versionen versuchten, Safari nach Login und Spendenerfassung per
Scroll-Befehl an den Seitenanfang zu setzen. Das war auf iOS nicht zuverlässig.

In dieser Version wurde der Seitenaufbau grundlegend geändert:

- Die Kopfzeile liegt jetzt außerhalb des scrollbaren Inhalts.
- Nur der Bereich unterhalb der Kopfzeile wird gescrollt.
- Der Inhalt kann dadurch nicht mehr hinter die Kopfzeile geraten.
- Nach Login, Spende und Rückkehr zur Startansicht wird nur dieser interne
  Inhaltsbereich auf Position 0 gesetzt.
- Die Sonderposition nach erfolgreichem Check-in wurde ebenfalls auf den neuen
  internen Scrollbereich angepasst.

Ein Cache-Löschen sollte für diesen Fehler nicht erforderlich sein, sobald
oben **Version 0.2.0-test.14** angezeigt wird.

## Testpasswort

`avt-demo`
