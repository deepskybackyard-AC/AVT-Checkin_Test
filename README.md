# AVT Check-in Demo 0.2.0-test.4

Lokale Ein-Gerät-Testversion vor dem Mehrgeräte-Test.

## Korrigiert

- Der sichtbare Betrag „Zu zahlender Eintritt“ wird bei jeder Eingabe im Feld
  „Korrigierter Eintritt“ sofort aktualisiert.
- Wird das Feld wieder vollständig geleert, erscheint sofort wieder der
  reguläre Tarif oder der ausgewählte Familientarif.
- Der Wert 0,00 € ist ein gültiger korrigierter Eintritt.
- Die Auswahlliste „Grund“ kann über „Kein Grund“ wieder in den Ausgangszustand
  zurückgesetzt werden. Dabei werden Grund und Korrekturbetrag entfernt.
- Die Gründe stammen in dieser Demo bereits aus einer konfigurierbaren Liste.
  Später wird diese Liste aus dem Google-Sheet geladen.

## Familientarif

Der Familientarif beträgt 10 € und ist nur aktiv, wenn:

- mindestens 1 erwachsene Person vorhanden ist,
- mindestens 1 Person aus Kinder unter 6, Jugendliche/Schüler:innen oder
  Studierende vorhanden ist,
- der reguläre Eintritt mehr als 10 € beträgt.

Beispiele:

- 1 Erwachsener + 1 Kind = 7 €: Familientarif nicht aktiv
- 1 Erwachsener + 3 Kinder = 11 €: Familientarif aktiv
- 1 Erwachsener + 1 Kind + 1 Schüler:in + 1 Studierende:r = 11 €:
  Familientarif aktiv
- Regulärer Eintritt genau 10 €: Familientarif nicht aktiv

## Testpasswort

`avt-demo`

## Hinweis

Alle Daten werden weiterhin ausschließlich auf einem Gerät gespeichert.
Die nächste Entwicklungsstufe ist nach Bestätigung dieser Version der Test
mit zwei Geräten und einem gemeinsamen Apps-Script-Test-Backend.
