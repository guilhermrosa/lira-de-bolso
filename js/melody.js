// The melody of a song with a band (v0.11, step 2 of "a song I like, on the lyre").
// Basic Pitch (song-ai.js) says, every 1/86 s, how likely each of the 88 piano keys is sounding
// ("frames") or starting ("onsets"). This module, pure and Node-tested, picks one line through
// that: a Viterbi path over the keys of a singing range plus a "silence" state, where staying on a
// key is cheap, a leap costs by its size, starting or stopping costs a little, and higher keys are
// slightly preferred (the tune usually sits over the accompaniment); keys below the range of a
// voice cost more (the bass). The path becomes notes: runs of one key, split again on a fresh onset.

export const FPS = 22050 / 256; // the model's frames per second
const LO = 45, HI = 90;          // keys considered for the tune (MIDI)
const KEY0 = 21;                 // the model's first key (A0)

const quantile = (a, q) => { const s = Float32Array.from(a).sort(); return s[Math.min(s.length - 1, Math.floor(q * s.length))] || 0; };

// frames, onsets: arrays of T rows of 88 numbers (0..1). Returns [{ t, dur, midi, rms }].
export function melody(frames, onsets, { up = 0.012, low = 0.06, jump = 0.18, step = 0.6, voice = 2, thr = 0.4 } = {}) {
  const T = frames.length, P = HI - LO + 1, SIL = P;
  if (!T) return [];
  // how confident the model is in this song: quiet or noisy recordings get a lower bar for silence
  const peaks = new Float32Array(T);
  for (let t = 0; t < T; t++) { let m = 0; for (let p = 0; p < P; p++) m = Math.max(m, frames[t][LO + p - KEY0]); peaks[t] = m; }
  const ref = Math.max(0.15, quantile(peaks, 0.9));
  const silence = Math.log(thr * ref);
  const bias = new Float32Array(P);
  for (let p = 0; p < P; p++) bias[p] = up * p - low * Math.max(0, 55 - (LO + p));
  const em = (t, p) => Math.log(Math.max(frames[t][LO + p - KEY0], 1e-4)) + bias[p];

  let prev = new Float32Array(P + 1), cur = new Float32Array(P + 1);
  for (let p = 0; p < P; p++) prev[p] = em(0, p);
  prev[SIL] = silence;
  const back = new Array(T);
  for (let t = 1; t < T; t++) {
    const b = back[t] = new Int16Array(P + 1);
    let best = -Infinity, bestI = 0;
    for (let q = 0; q < P; q++) if (prev[q] > best) { best = prev[q]; bestI = q; }
    // silence: stay silent, or stop after the best key
    if (prev[SIL] >= best - voice) { cur[SIL] = prev[SIL]; b[SIL] = SIL; } else { cur[SIL] = best - voice; b[SIL] = bestI; }
    cur[SIL] += silence;
    for (let p = 0; p < P; p++) {
      let bv = prev[SIL] - voice, bi = SIL;
      const far = best - jump * 13 - step; // any leap beyond an octave costs like one
      if (far > bv) { bv = far; bi = bestI; }
      for (let q = Math.max(0, p - 12); q <= Math.min(P - 1, p + 12); q++) {
        const v = prev[q] - (q === p ? 0 : step + jump * Math.abs(q - p));
        if (v > bv) { bv = v; bi = q; }
      }
      cur[p] = bv + em(t, p); b[p] = bi;
    }
    [prev, cur] = [cur, prev];
  }
  let s = SIL; for (let q = 0; q < P; q++) if (prev[q] > prev[s]) s = q;
  const path = new Int16Array(T); path[T - 1] = s;
  for (let t = T - 1; t > 0; t--) { s = back[t][s]; path[t - 1] = s; }

  const notes = [];
  let note = null;
  const close = t => { if (note) { note.dur = t / FPS - note.t; if (note.dur >= 0.09) notes.push(note); note = null; } };
  for (let t = 0; t < T; t++) {
    if (path[t] === SIL) { close(t); continue; }
    const m = LO + path[t], k = m - KEY0, on = onsets[t][k];
    const fresh = on > 0.5 && on >= (t ? onsets[t - 1][k] : 0) && on >= (t + 1 < T ? onsets[t + 1][k] : 0);
    if (note && note.midi === m && !(fresh && t / FPS - note.t > 0.12)) { note.rms = Math.max(note.rms, frames[t][k]); continue; }
    close(t);
    note = { t: t / FPS, midi: m, rms: frames[t][k] };
  }
  close(T);
  return notes;
}
