# Projektstatus – AVT Check-in

## Aktueller Stand

Version: 0.1.0-test.3

Die mobile Bedienung ist lokal funktionsfähig. Der Scan, die manuelle Suche, die Wartelistenprüfung, stornierte Ausnahme-Check-ins, Personenzahlkorrekturen und Kapazitätsberechnungen sind mit Demo-Daten testbar.

## In 0.1.0-test.3 korrigiert

- Kein großer gelber Demo-Hinweis mehr im laufenden Arbeitsbereich.
- Familienhinweis nur bei Familienanmeldungen.
- Kopf-Schaltfläche aktualisiert nur die Statistik und meldet nicht ab.
- Anmeldung und aktueller Arbeitszustand bleiben beim Aktualisieren erhalten.
- Abmeldung separat in der Gesamtübersicht.

## Festgelegte Regeln

- Kapazität später aus `MAX_CONFIRMED_PERSONS`; derzeit Demo-Wert 65.
- Familie wird standardmäßig mit 3 Personen gerechnet.
- Gemeinsamer Check-in-Zugang statt personenbezogener Konten.
- Warteliste grundsätzlich in aufsteigender W-Nummer.
- Stornierte Anmeldung nur nach deutlicher Ausnahmebestätigung.
- Mehrere Handys müssen denselben serverseitigen Stand sehen.
- QR-Kamera bleibt außerhalb einer Apps-Script-HtmlService-Oberfläche.

## Nächster Meilenstein

0.2.0-test.1: gemeinsames Test-Backend und Mehrgeräte-Test mit zwei oder mehr Handys.

Die produktive Tabelle und das bestehende Projekt `Server Status Sternführung` bleiben bis zur erfolgreichen Testphase unverändert.
