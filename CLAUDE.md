# Lira de Bolso

Standalone synthesized lyre, shipped as a PWA on GitHub Pages from `main` (root). No build step, no dependencies: static files and native ES modules.

## Conventions

- `js/lyre.js` is shared with the `guilhermrosa/corredor-invertido` game. Keep both copies identical; change one, copy to the other.
- When adding or renaming a file the app loads, add it to `SHELL` in `sw.js`.
- On every release, bump `VERSION` in `sw.js` and the version label in `index.html`.
- UI text is in Brazilian Portuguese. Light and dark themes both come from the tokens in `css/style.css`.
- Test with a local server (`python3 -m http.server`); modules do not load from `file://`.

## Structure (v0.2)

- `js/core.js`: audio, strings on screen (`onPluck`, `guide`, `flash`), timbre/scale state and saved settings. Every tab builds on it.
- Tabs in `js/app.js` (hash-routed: #tocar, #relaxar, #aprender, #cancoes):
  - Tocar: timbre and scale, plus recording in layers (`js/looper.js`): the first recording sets the loop length; each new layer records one full turn over the others. Up to 8 layers, mute per layer, undo, clear, saved recordings (`lira-loops`, current loop in `lira-loop-current`). Recordings store MIDI notes, so they replay in the current timbre; the scale is restored on open.
  - Relaxar (`js/relax.js`): calm generative music with a 10/20/30/60 min timer that fades out over the last minute.
  - Aprender (`js/learn.js`): memory game, phrases grow one note per round; best round in `lira-learn-best`.
  - Canções (`js/songs.js`): public-domain melodies (Brilha Brilha Estrelinha, Ode à Alegria, Frère Jacques, Mary Had a Little Lamb) to listen to or play along (next string lit). They switch the scale to Jônio (maior), added to `MODES` in lyre.js for this.
- Games that wait for the player stop when their tab is left; relax music and loop playback keep going.

## Open questions

- Visual identity: the user finds the app (dark on their device) without a defined look yet; to be designed later.
- "Lira de Bolso" is a working name; check for existing apps with the same name before a public launch.
