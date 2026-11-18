// From a voice to a lyre melody (v0.7): synthetic "voices" (harmonics, vibrato, noise, a slightly
// flat tuning, gaps and repeated notes) must come back as the melody that was sung.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { track, segment, tune, fit, quantize, transcribe, stringsOf, yin, ANALYSIS_RATE } from '../js/pitch.js';

const SR = ANALYSIS_RATE;
let seed = 3;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// notes: [[midi, seconds, gapAfter]], a voice-like tone with harmonics, vibrato and breath noise
function voice(notes, { detune = 0, amp = 0.3, noise = 0.01 } = {}) {
  const total = notes.reduce((s, [, d, g = 0.04]) => s + d + g, 0.2);
  const x = new Float32Array(Math.ceil(total * SR));
  let i = Math.round(0.1 * SR), ph = 0;
  for (const [midi, d, g = 0.04] of notes) {
    const n = Math.round(d * SR), f0 = 440 * 2 ** ((midi + detune - 69) / 12);
    for (let k = 0; k < n; k++, i++) {
      const t = k / SR, env = Math.min(1, t / 0.02, (d - t) / 0.03);
      const f = f0 * (1 + 0.006 * Math.sin(2 * Math.PI * 5.5 * t));
      ph += 2 * Math.PI * f / SR;
      x[i] = amp * env * (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.25 * Math.sin(3 * ph));
    }
    i += Math.round(g * SR);
  }
  for (let k = 0; k < x.length; k++) x[k] += noise * (rnd() * 2 - 1);
  return x;
}

test('YIN finds the pitch of a voiced frame', () => {
  for (const midi of [45, 57, 64, 76, 84]) {
    const x = voice([[midi, 0.3]], { noise: 0 });
    const { f } = yin(x, Math.round(0.2 * SR), Math.round(0.046 * SR), SR);
    assert.ok(Math.abs(69 + 12 * Math.log2(f / 440) - midi) < 0.15, `midi ${midi}`);
  }
});

test('a hummed scale comes back note by note', () => {
  const sung = [57, 59, 60, 62, 64, 65, 67];
  const notes = tune(segment(track(voice(sung.map(m => [m, 0.3])), SR)));
  assert.deepEqual(notes.map(n => n.midi), sung);
});

test('a flat singer is tuned as a whole', () => {
  const sung = [60, 62, 64, 62, 60];
  const notes = tune(segment(track(voice(sung.map(m => [m, 0.28]), { detune: -0.4 }), SR)));
  assert.deepEqual(notes.map(n => n.midi), sung);
});

test('repeated notes with a short break stay separate', () => {
  const notes = segment(track(voice([[62, 0.25, 0.06], [62, 0.25, 0.06], [62, 0.25], [65, 0.4]]), SR));
  assert.equal(notes.length, 4);
});

test('fit puts the melody on the strings, preferring the asked mode and a small shift', () => {
  const d = 0.3;
  const happy = [60, 62, 64, 65, 67, 69, 71, 72].map(m => ({ midi: m, dur: d })); // C major
  const r = fit(happy, 'dorico');
  assert.equal(r.moved, 0);
  for (const n of r.notes) assert.ok(stringsOf(r.mode).includes(n.midi));
  const onlyDorian = fit(happy, 'dorico', ['dorico']);
  for (const n of onlyDorian.notes) assert.ok(stringsOf('dorico').includes(n.midi));
});

test('quantize snaps onsets to a grid and keeps their order', () => {
  const ns = [0, 0.27, 0.49, 0.78, 1.02, 1.26].map(t => ({ t, dur: 0.2, midi: 62 }));
  const { notes, grid } = quantize(ns);
  assert.ok(grid >= 0.12 && grid <= 0.4);
  for (let i = 1; i < notes.length; i++) assert.ok(notes[i].t > notes[i - 1].t);
  for (const n of notes) assert.ok(Math.abs(n.t / grid - Math.round(n.t / grid)) < 1e-3);
});

test('transcribe gives a recording that starts at 0, on the strings', () => {
  const r = transcribe(voice([[64, 0.3], [62, 0.3], [60, 0.3], [62, 0.3], [64, 0.3], [64, 0.3], [64, 0.5]]), SR);
  assert.ok(r);
  assert.equal(r.notes.length, 7);
  assert.equal(r.notes[0].t, 0);
  for (const n of r.notes) assert.ok(stringsOf(r.mode).includes(n.midi));
  assert.ok(r.loopLen > r.notes[r.notes.length - 1].t);
});

test('silence gives nothing', () => {
  assert.equal(transcribe(new Float32Array(SR), SR), null);
});
