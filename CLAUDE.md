# Lira de Bolso

Standalone synthesized lyre, shipped as a PWA on GitHub Pages from `main` (root). No build step, no dependencies: static files and native ES modules.

## Conventions

- `js/lyre.js` is shared with the `guilhermrosa/corredor-invertido` game. Keep both copies identical; change one, copy to the other.
- When adding or renaming a file the app loads, add it to `SHELL` in `sw.js`.
- On every release, bump `APP_VERSION` in `js/version.js`, the only copy of the version: the header label (`index.html`) and the service worker cache name (`sw.js` imports it) both read it.
- Privacy (v0.38 / v0.6.2, user request): nothing leaves the device, so no consent screen is needed. Fonts are served from `fonts/` (latin subset woff2, OFL licences alongside) instead of Google Fonts, so the app contacts no other site (the service worker only handles same-origin requests). `privacidade.html` explains this in plain pt-BR (what stays on the device, how to delete it, hosting by GitHub Pages, no permissions); it is linked from the footer and is the privacy policy URL a store listing will need. Keep it true when adding features that store or send anything (e.g. the planned microphone/audio-file feature).
- UI text is in Brazilian Portuguese. Visual identity (v0.4): "Cerâmica de figuras negras", one look whatever the device theme; tokens at the top of `css/style.css`. Black text on the terracotta ground must stay at 4.5:1 or more.
- Test with a local server (`python3 -m http.server`); modules do not load from `file://`.

## Structure (v0.2)

- `js/core.js`: audio, strings on screen (`onPluck`, `guide`, `flash`), timbre/scale state and saved settings. Every tab builds on it.
- Tabs in `js/app.js` (hash-routed: #tocar, #relaxar, #memoria, #cancoes; the old #aprender still opens Memória):
  - Tocar: timbre and scale, plus recording in layers (`js/looper.js`): the first recording sets the loop length; each new layer records one full turn over the others. Up to 8 layers, mute per layer, undo, clear, saved recordings (`lira-loops`, current loop in `lira-loop-current`). Recordings store MIDI notes, so they replay in the current timbre; the scale is restored on open.
  - Relaxar (`js/relax.js`): calm generative music with a 10/20/30/60 min timer that fades out over the last minute.
  - Memória (`js/learn.js`; named Aprender until v0.6.1, renamed because it trains memory rather than teaching, at the user's request): memory game, phrases grow one note per round; best round in `lira-learn-best`.
  - Canções (`js/songs.js`): public-domain melodies to listen to or play along (next string lit); each switches the scale to its own (Jônio was added to `MODES` in lyre.js for this). Melodies live in `js/songbook.js` as note names ("F#4:.5", beats), each with a group, scale and tempo; every note must be on the 15 strings of its scale (Ré 3 to Ré 5), which `npm test` checks (tests/songbook.test.js, Node 22+, no dependencies). `tools/abc2lyre.py` converts ABC notation and picks the scale/transposition that fits. v0.6 (user asked for fewer children's songs and groups): 23 melodies in 4 groups:
    - Antigas e medievais: Epitáfio de Seikilos (consensus transcription read from the score in an IMEKO 2016 paper, an octave down), Scarborough Fair (familiar tune, Dórico), Greensleeves (Dórico, leading note not raised), Rosa das Rosas (Cantiga 10, Ali Corbin's ABC; two passing B♭ played as B).
    - Clássicas: Ode à Alegria, Minueto em Sol (Petzold, long attributed to Bach; A part), Cânone em Ré (Pachelbel, violin theme simplified), Gymnopédie nº 1 (Satie, opening melody), Canção de Ninar (Brahms, 1927 songbook ABC).
    - Populares: Luar do Sertão (chorus, read from the Musica Brasilis voice part), Danny Boy (Mixolídio = Sol maior from Ré), Amazing Grace, Sakura.
    - Infantis e cantigas de roda: Brilha Brilha Estrelinha, Frère Jacques, Mary Had a Little Lamb, Ciranda Cirandinha, Atirei o Pau no Gato, Escravos de Jó, O Cravo Brigou com a Rosa, Cai Cai Balão, Pirulito que Bate Bate, Sapo Cururu (Brazilian ones read from Mama Lisa's World / Beth's Notes scores, transposed to Ré).
    - Left out: Odeon, Brejeiro (Nazareth) and Tico-Tico no Fubá (choro: chromatic neighbour notes on every bar, which a seven-notes-per-octave lyre cannot play without losing the tune); Ó Abre Alas (the IMSLP score needs a download disclaimer the user must accept; the melody is diatonic and would fit); Peixe Vivo and Marcha Soldado (no reliable score found).
- v0.3: saving asks for a name (renamable later), shows a message and opens the saved list; "Baixar áudio" renders a recording offline (`js/export.js`, OfflineAudioContext with the recording's own timbre, ~20 s / at least 2 turns, mono 16-bit WAV) and shares it through the share sheet when the device can share files, otherwise downloads it. Saved recordings also appear under "Suas gravações" in Canções (layers merged in time order, in the recording's own scale).
- Games that wait for the player stop when their tab is left; relax music and loop playback keep going.

## Open questions

- Visual identity chosen (v0.4): direction 2 of 3. The other two (Mármore e Egeu, Noite no templo) are kept in `docs/direcoes-visuais.md` for later (idea: light and dark themes).
- "Lira de Bolso" is a working name; check for existing apps with the same name before a public launch.
- Planned big update (user idea, not started): "a song I like, as a lyre version I can play". Steps: (1) hum or whistle into the mic, or open a one-voice audio file: in-house pitch tracking (YIN), note segmentation, fit to the best scale and transposition (like tools/abc2lyre.py), rhythm quantization, saved as a recording; (2) full songs (MP3 with a band): melody extraction needs an ML model in the browser (e.g. Spotify's Basic Pitch, Apache-2.0, a few MB, loaded only when used); results are approximate, so (3) a simple note editor to fix wrong notes is part of it. Everything stays on the device; the user's own copyrighted songs are fine for personal use, but nothing copyrighted ships with the app.
