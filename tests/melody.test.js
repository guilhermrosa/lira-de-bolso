// melody.js: picking the tune out of Basic Pitch's posteriors (v0.11). The posteriors are made up
// here: a tune over held chords and a bass, as the model would report them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { melody, FPS } from '../js/melody.js';

function fake(tune, { chords = [], bass = [], noise = 0.05, len } = {}) {
  const T = Math.ceil((len ?? Math.max(...tune.map(n => n.t + n.dur))) * FPS) + 5;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const frames = [], onsets = [];
  for (let i = 0; i < T; i++) { frames.push(Float32Array.from({ length: 88 }, () => rnd() * noise)); onsets.push(new Float32Array(88)); }
  const put = (list, level) => { for (const n of list) {
    const a = Math.round(n.t * FPS), b = Math.round((n.t + n.dur) * FPS);
    for (let i = a; i < b && i < T; i++) frames[i][n.midi - 21] = Math.max(frames[i][n.midi - 21], level);
    if (a < T) onsets[a][n.midi - 21] = 0.9;
  } };
  put(chords, 0.55); put(bass, 0.7); put(tune, 0.8);
  return { frames, onsets };
}

const tune = [62, 64, 65, 67, 69, 67, 65, 64, 62, 62].map((midi, i) => ({ t: i * 0.4, dur: 0.38, midi }));

test('the tune is found over chords and a bass', () => {
  const chords = [], bass = [];
  for (let t = 0; t < 4; t += 0.8) { for (const m of [53, 57, 60]) chords.push({ t, dur: 0.78, midi: m }); bass.push({ t, dur: 0.78, midi: 38 }); }
  const { frames, onsets } = fake(tune, { chords, bass });
  const got = melody(frames, onsets);
  assert.equal(got.length, tune.length);
  got.forEach((n, i) => {
    assert.equal(n.midi, tune[i].midi);
    assert.ok(Math.abs(n.t - tune[i].t) < 0.03, `note ${i} at ${n.t}`);
  });
});

test('a repeated note is split on its new onset', () => {
  const rep = [{ t: 0, dur: 0.4, midi: 67 }, { t: 0.4, dur: 0.4, midi: 67 }, { t: 0.8, dur: 0.4, midi: 69 }];
  const { frames, onsets } = fake(rep);
  assert.deepEqual(melody(frames, onsets).map(n => n.midi), [67, 67, 69]);
});

test('silence gives no notes', () => {
  const { frames, onsets } = fake([], { len: 3 });
  assert.equal(melody(frames, onsets).length, 0);
});
