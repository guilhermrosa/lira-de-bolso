# Third-party files (loaded only by "Abrir música", js/song-ai.js)

Served from this site like every other file, so the app still contacts no other site.

- `tfjs/`: TensorFlow.js 4.22.0 (`@tensorflow/tfjs-core`, `-backend-cpu`, `-backend-webgl`,
  `-converter`, the `dist/*.es2017.min.js` builds, unchanged). © Google LLC, Apache License 2.0 (`tfjs/LICENSE`).
- `basic-pitch/`: the Basic Pitch model (`model.json`, `group1-shard1of1.bin`) from
  `@spotify/basic-pitch` 1.0.1, unchanged. © Spotify AB, Apache License 2.0 (`basic-pitch/LICENSE`).
  The way the model is run (2 s windows overlapping by 30 frames, 22050 Hz mono) follows its
  `inference.ts`.
