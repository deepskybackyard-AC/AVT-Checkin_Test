# AVT Check-in Multi-Device 0.3.0-test.5

Diese Version vereinheitlicht die Speicherung von Check-ins und Spenden.

## Spende speichern

Nach Bestätigung einer Online-Spende:

- wird die übrige Oberfläche gesperrt,
- erscheint derselbe animierte SVG-Spinner wie beim Check-in,
- darunter steht **„Spende wird gespeichert …“**,
- nach 8 Sekunden erscheinen dieselben Optionen:
  **Weiter warten**, **Offline speichern**, **Abbrechen**.

Auch bei der Spende wird bei **Weiter warten** derselbe bereits gestartete
Vorgang weiter beobachtet. Es wird keine zweite Spende gesendet.

## Offline-Spende

Nach einer offline erfassten oder bewusst offline zwischengespeicherten Spende
erscheint gelb:

**Spende offline gespeichert – noch nicht synchronisiert**

Nach erfolgreicher Übertragung wird die Meldung grün:

**Die offline zwischengespeicherte Spende wurde erfolgreich synchronisiert.**

Bei mehreren Spenden wird die Meldung automatisch in die Mehrzahl gesetzt.

## Status der Warteschlange

Der obere Statusbalken unterscheidet nun die Art der offenen Vorgänge, zum
Beispiel:

- `Offline · lokaler Stand · 1 Check-in ausstehend`
- `Offline · lokaler Stand · 1 Spende ausstehend`
- `Offline · lokaler Stand · 2 Check-ins und 1 Spende ausstehend`

Unangemeldete Check-ins werden dabei als Check-ins gezählt.

## Backend

Das funktionierende Apps-Script-Backend `0.3.0-test.2` bleibt kompatibel und
muss nicht neu bereitgestellt werden.
