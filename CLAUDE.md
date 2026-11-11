# Lira de Bolso

Standalone synthesized lyre, shipped as a PWA on GitHub Pages from `main` (root). No build step, no dependencies: static files and native ES modules.

## Conventions

- `js/lyre.js` is shared with the `guilhermrosa/corredor-invertido` game. Keep both copies identical; change one, copy to the other.
- When adding or renaming a file the app loads, add it to `SHELL` in `sw.js`.
- On every release, bump `VERSION` in `sw.js` and the version label in `index.html`.
- UI text is in Brazilian Portuguese. Light and dark themes both come from the tokens in `css/style.css`.
- Test with a local server (`python3 -m http.server`); modules do not load from `file://`.

## Open questions

- What the app does beyond free play (relaxation mode with timer, record and repeat melodies, learning modes) is still undecided.
- "Lira de Bolso" is a working name; check for existing apps with the same name before a public launch.
