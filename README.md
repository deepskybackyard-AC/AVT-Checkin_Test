# AVT Check-in Demo 0.2.0-test.13

Ein-Gerät-Testversion mit korrigierter Startposition und einblendbarem Passwort.

## Korrigiert

- Nach dem Login wird die Seite mehrfach und zeitversetzt zuverlässig an den
  Anfang gesetzt. Das berücksichtigt das verzögerte Schließen der
  Bildschirmtastatur auf iOS.
- Auch nach dem Erfassen einer Spende wird die Startansicht zuverlässig
  vollständig von oben angezeigt.
- Der obere Block mit eingecheckten Personen und sicheren freien Plätzen darf
  dadurch nicht mehr teilweise unter der festen Kopfzeile verschwinden.

## Passwortfeld

- Die Beschriftung lautet jetzt **„Passwort“**.
- Direkt rechts neben dem verkürzten Passwortfeld befindet sich ein
  SVG-Button zum Einblenden.
- Bei eingeblendetem Passwort wechselt das SVG zum durchgestrichenen Auge.
- Ein erneuter Tastendruck blendet das Passwort wieder aus.

## Testpasswort

`avt-demo`
