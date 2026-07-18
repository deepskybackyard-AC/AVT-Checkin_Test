# Technische Prüfung – AVT Check-in 0.2.0-test.14

Geprüft werden:

- JavaScript-Syntax
- `html` und `body` besitzen keinen eigenen Scrollbereich mehr
- `.app-shell` verwendet eine feste Viewport-Höhe und Flex-Layout
- `.topbar` liegt außerhalb des Scrollcontainers
- `main` ist der einzige vertikale Scrollcontainer
- Login, Spende, Navigation und Erfolgsansicht scrollen ausschließlich `main`
- keine `window.scrollTo`-Verwendung mehr in der App-Logik

Ergebnis:

- JavaScript-Syntax: fehlerfrei
- App-Logik verwendet ausschließlich den internen Scrollcontainer
- Fenster-/Body-Scrolling wurde entfernt
- Kopfzeile und Inhalt sind strukturell getrennt
