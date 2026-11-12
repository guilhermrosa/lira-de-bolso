# Lira de Bolso

Standalone synthesized lyre, shipped as a PWA on GitHub Pages from `main` (root). No build step, no dependencies: static files and native ES modules.

## Conventions

- `js/lyre.js` is shared with the `guilhermrosa/corredor-invertido` game. Keep both copies identical; change one, copy to the other.
- When adding or renaming a file the app loads, add it to `SHELL` in `sw.js`.
- On every release, bump `APP_VERSION` in `js/version.js`, the only copy of the version: the header label (`index.html`) and the service worker cache name (`sw.js` imports it) both read it.
- UI text is in Brazilian Portuguese. Visual identity (v0.4): "Cerâmica de figuras negras", one look whatever the device theme; tokens at the top of `css/style.css`. Black text on the terracotta ground must stay at 4.5:1 or more.
- Test with a local server (`python3 -m http.server`); modules do not load from `file://`.

## Structure (v0.2)

- `js/core.js`: audio, strings on screen (`onPluck`, `guide`, `flash`), timbre/scale state and saved settings. Every tab builds on it.
- Tabs in `js/app.js` (hash-routed: #tocar, #relaxar, #aprender, #cancoes):
  - Tocar: timbre and scale, plus recording in layers (`js/looper.js`): the first recording sets the loop length; each new layer records one full turn over the others. Up to 8 layers, mute per layer, undo, clear, saved recordings (`lira-loops`, current loop in `lira-loop-current`). Recordings store MIDI notes, so they replay in the current timbre; the scale is restored on open.
  - Relaxar (`js/relax.js`): calm generative music with a 10/20/30/60 min timer that fades out over the last minute.
  - Aprender (`js/learn.js`): memory game, phrases grow one note per round; best round in `lira-learn-best`.
  - Canções (`js/songs.js`): public-domain melodies to listen to or play along (next string lit); each switches the scale to its own (Jônio was added to `MODES` in lyre.js for this). v0.5: the melodies live in `js/songbook.js` as note names ("F#4:.5"), with a scale and tempo each; 14 of them: the first four (Brilha Brilha Estrelinha, Ode à Alegria, Frère Jacques, Mary Had a Little Lamb), Epitáfio de Seikilos (consensus transcription read from the score in an IMEKO 2016 paper, an octave down), Scarborough Fair (the familiar tune, Dórico), Greensleeves (Dórico, so the leading note is not raised), and Brazilian folk songs read from Mama Lisa's World / Beth's Notes scores and transposed to Ré: Ciranda Cirandinha, Atirei o Pau no Gato, Escravos de Jó, O Cravo Brigou com a Rosa (one A♮ passing note became A♭ to fit), Cai Cai Balão, Pirulito que Bate Bate, Sapo Cururu. Peixe Vivo and Marcha Soldado are still missing (no reliable score found). Every note must be on the 15 strings of the melody's scale (Ré 3 to Ré 5): `npm test` (tests/songbook.test.js, Node 22+, no dependencies) checks it.
- v0.3: saving asks for a name (renamable later), shows a message and opens the saved list; "Baixar áudio" renders a recording offline (`js/export.js`, OfflineAudioContext with the recording's own timbre, ~20 s / at least 2 turns, mono 16-bit WAV) and shares it through the share sheet when the device can share files, otherwise downloads it. Saved recordings also appear under "Suas gravações" in Canções (layers merged in time order, in the recording's own scale).
- Games that wait for the player stop when their tab is left; relax music and loop playback keep going.

## Open questions

- Visual identity chosen (v0.4): direction 2 of 3. The other two (Mármore e Egeu, Noite no templo) are kept in `docs/direcoes-visuais.md` for later (idea: light and dark themes).
- "Lira de Bolso" is a working name; check for existing apps with the same name before a public launch.
