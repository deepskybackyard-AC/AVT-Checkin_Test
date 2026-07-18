# Technische Prüfung – AVT Check-in 0.2.0-test.13

Geprüft werden:

- JavaScript-Syntax
- Passwortbeschriftung „Passwort“
- Passwortfeld und Sichtbarkeitsschalter stehen nebeneinander
- beide Augen-Symbole sind echte Inline-SVGs
- SVG-Zustand und ARIA-Beschriftung wechseln beim Ein-/Ausblenden
- Login und Spendenerfassung rufen den robusten Scroll-Reset auf
- Service-Worker-Cache und Asset-Versionen entsprechen 0.2.0-test.13

Ergebnis:

- JavaScript-Syntax: fehlerfrei
- Passwort-SVGs und Umschaltlogik: vorhanden
- Mehrstufiger Scroll-Reset: vorhanden
- Login und Spendenrückkehr verwenden den Scroll-Reset
