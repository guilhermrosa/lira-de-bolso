// From a voice to a lyre melody (v0.7): pure analysis, no audio or page code, so Node can test it.
//   samples (mono Float32Array at `sr`) → pitch track (YIN) → notes → fitted to the lyre's strings
//   → rhythm tidied → { t, midi, vel } like a recording's notes.
// Meant for one voice humming, singing or whistling (or an audio file with a single melody line).

import { MODES } from './lyre.js';

export const ANALYSIS_RATE = 11025; // the voice is resampled to this before analysis (enough up to ~1.1 kHz)
const HOP = 0.01;                    // one pitch estimate every 10 ms
const WIN = 0.046;                   // over a 46 ms window
const FMIN = 70, FMAX = 1100;        // a low male voice to a whistle

export const freqMidi = f => 69 + 12 * Math.log2(f / 440);

// YIN (de Cheveigné & Kawahara, 2002) on one frame: the period whose cumulative mean normalised
// difference first dips under `thr`, refined by a parabola. Returns { f, conf } (f = 0 if unvoiced).
export function yin(x, off, n, sr, thr = 0.15) {
  const tMin = Math.floor(sr / FMAX), tMax = Math.min(Math.ceil(sr / FMIN), n - 1);
  const d = new Float32Array(tMax + 1);
  for (let tau = 1; tau <= tMax; tau++) {
    let s = 0;
    for (let i = 0; i < n - tMax; i++) { const v = x[off + i] - x[off + i + tau]; s += v * v; }
    d[tau] = s;
  }
  let run = 0, best = -1;
  d[0] = 1;
  for (let tau = 1; tau <= tMax; tau++) {
    run += d[tau];
    d[tau] = run ? d[tau] * tau / run : 1;
  }
  for (let tau = tMin; tau <= tMax; tau++) {
    if (d[tau] < thr) { while (tau + 1 <= tMax && d[tau + 1] < d[tau]) tau++; best = tau; break; }
  }
  if (best < 0) return { f: 0, conf: 0 };
  const a = d[best - 1] ?? d[best], b = d[best], c = d[best + 1] ?? d[best];
  const den = a - 2 * b + c, shift = den ? 0.5 * (a - c) / den : 0;
  return { f: sr / (best + Math.max(-1, Math.min(1, shift))), conf: 1 - b };
}

// A pitch and loudness estimate every HOP seconds: [{ t, midi (float, NaN if unvoiced), rms }].
export function track(x, sr) {
  const n = Math.round(WIN * sr), hop = Math.round(HOP * sr), out = [];
  let peak = 0;
  const rmsOf = off => { let s = 0; for (let i = 0; i < n; i++) s += x[off + i] * x[off + i]; return Math.sqrt(s / n); };
  for (let off = 0; off + n < x.length; off += hop) { const r = rmsOf(off); peak = Math.max(peak, r); out.push({ t: (off + n / 2) / sr, off, rms: r }); }
  const gate = Math.max(peak * 0.08, 0.004); // quieter than this is silence or breath
  for (const fr of out) {
    if (fr.rms < gate) { fr.midi = NaN; continue; }
    const { f } = yin(x, fr.off, n, sr);
    fr.midi = f ? freqMidi(f) : NaN;
  }
  // a 5-frame median smooths octave slips and jitter
  const m = out.map(f => f.midi);
  for (let i = 0; i < out.length; i++) {
    const w = m.slice(Math.max(0, i - 2), i + 3).filter(v => !Number.isNaN(v)).sort((a, b) => a - b);
    out[i].midi = Number.isNaN(m[i]) || w.length < 3 ? m[i] : w[w.length >> 1];
  }
  return out.map(({ t, midi, rms }) => ({ t, midi, rms }));
}

const median = a => { const s = a.slice().sort((p, q) => p - q); return s.length ? s[s.length >> 1] : NaN; };

// Notes from the track: a note is a run of voiced frames at about the same pitch. A new note starts
// after silence, when the pitch moves by a semitone or more for 40 ms, or when the voice dips and
// rises again on the same pitch ("da-da"). Notes shorter than 80 ms are dropped.
// Returns [{ t, dur, midi (float), rms }].
export function segment(frames) {
  const notes = [];
  let cur = null, away = 0, low = false;
  const close = () => {
    if (cur && cur.end - cur.t >= 0.08) notes.push({ t: cur.t, dur: cur.end - cur.t, midi: median(cur.ps), rms: cur.peak });
    cur = null; away = 0; low = false;
  };
  for (const f of frames) {
    if (Number.isNaN(f.midi)) { close(); continue; }
    if (!cur) { cur = { t: f.t, end: f.t + HOP, ps: [f.midi], peak: f.rms }; continue; }
    const ref = median(cur.ps.slice(-12));
    if (Math.abs(f.midi - ref) >= 0.8) {
      if (++away >= 4) { // it really moved: the new note began where it started to move
        const keep = cur.ps.slice(0, -3); cur.ps = keep.length ? keep : cur.ps; cur.end = f.t - 3 * HOP;
        close(); cur = { t: f.t - 3 * HOP, end: f.t + HOP, ps: [f.midi], peak: f.rms }; continue;
      }
    } else away = 0;
    if (f.rms < cur.peak * 0.45) low = true; // a dip in the voice…
    else if (low && f.rms > cur.peak * 0.7) { close(); cur = { t: f.t, end: f.t + HOP, ps: [f.midi], peak: f.rms }; continue; } // …and a new attack
    cur.ps.push(f.midi); cur.end = f.t + HOP; cur.peak = Math.max(cur.peak, f.rms);
  }
  close();
  return notes;
}

// Nobody sings exactly at A440: the whole melody is moved by the median of how far its notes sit
// from the nearest semitone, then rounded. Returns integer MIDI notes.
export function tune(notes) {
  const off = median(notes.map(n => n.midi - Math.round(n.midi)));
  return notes.map(n => ({ ...n, midi: Math.round(n.midi - (Number.isNaN(off) ? 0 : off)) }));
}

// The lyre's 15 strings in a mode: two octaves from Ré 3 (MIDI 50) and the top Ré.
export const stringsOf = mode => { const s = []; for (let o = 0; o < 2; o++) for (const st of MODES[mode].steps) s.push(50 + o * 12 + st); s.push(74); return s; };

// The mode and transposition that keep the most of the melody (weighted by length) on the strings,
// like tools/abc2lyre.py; ties prefer the mode asked for, then the smallest shift.
export function fit(notes, prefer = 'dorico', modes = Object.keys(MODES)) {
  let best = null;
  for (const md of modes) {
    const S = new Set(stringsOf(md));
    for (let sh = -36; sh <= 36; sh++) {
      let miss = 0;
      for (const n of notes) if (!S.has(n.midi + sh)) miss += n.dur;
      const score = [Math.round(miss * 1000), md === prefer ? 0 : 1, Math.abs(sh)];
      if (!best || score[0] < best.score[0] || (score[0] === best.score[0] && (score[1] < best.score[1] || (score[1] === best.score[1] && score[2] < best.score[2])))) best = { score, mode: md, shift: sh };
    }
  }
  const strings = stringsOf(best.mode);
  let moved = 0;
  const out = notes.map(n => {
    const m = n.midi + best.shift;
    if (strings.includes(m)) return { ...n, midi: m };
    moved++;
    const near = strings.reduce((a, s) => (Math.abs(s - m) < Math.abs(a - m) || (Math.abs(s - m) === Math.abs(a - m) && s < a) ? s : a), strings[0]);
    return { ...n, midi: near }; // a note off the strings goes to the nearest one
  });
  return { notes: out, mode: best.mode, shift: best.shift, moved };
}

// Tidier rhythm: each gap between onsets becomes a whole number of grid steps, so a singer who
// drifts in tempo does not throw the later notes off. The grid is the largest step (0.1–0.45 s)
// that the gaps fit well (mean squared error under 0.02 steps²), or else the one they fit best.
export function quantize(notes) {
  if (notes.length < 3) return { notes: notes.map(n => ({ ...n })), grid: 0 };
  const iois = notes.slice(1).map((n, i) => n.t - notes[i].t);
  const cost = g => iois.reduce((s, d) => { const q = d / g, e = q - Math.max(1, Math.round(q)); return s + e * e; }, 0) / iois.length;
  let grid = 0, best = Infinity, bestG = 0.25;
  for (let g = 0.45; g >= 0.1 - 1e-9; g -= 0.005) {
    const c = cost(g);
    if (c < 0.02) { grid = g; break; }
    if (c < best) { best = c; bestG = g; }
  }
  if (!grid) grid = bestG;
  let k = 0;
  const out = notes.map((n, i) => {
    if (i) k += Math.max(1, Math.round(iois[i - 1] / grid));
    return { ...n, t: +(k * grid).toFixed(4) };
  });
  return { notes: out, grid };
}

// The whole way, from samples to a recording's notes.
export function transcribe(x, sr, opts = {}) { return arrange(segment(track(x, sr)), opts); }

// Notes found by any analysis ([{ t, dur, midi, rms }], the voice's or a song's, melody.js) →
// a recording on the lyre: tuned, fitted to the strings, its rhythm tidied.
export function arrange(raw, { prefer = 'dorico', autoMode = true, rhythm = true } = {}) {
  if (!raw.length) return null;
  const tuned = tune(raw);
  const fitted = fit(tuned, prefer, autoMode ? undefined : [prefer]);
  const t0 = fitted.notes[0].t;
  let notes = fitted.notes.map(n => ({ ...n, t: n.t - t0 }));
  let grid = 0;
  if (rhythm) ({ notes, grid } = quantize(notes));
  const peak = Math.max(...notes.map(n => n.rms)) || 1;
  const rec = notes.map(n => ({ t: +n.t.toFixed(3), midi: n.midi, vel: +(0.32 + 0.3 * Math.sqrt(n.rms / peak)).toFixed(2) }));
  const lastEnd = Math.max(...notes.map(n => n.t + (n.dur || 0)));
  const loopLen = +(Math.max(lastEnd + 0.6, rec[rec.length - 1].t + Math.max(0.8, grid * 2))).toFixed(3);
  return { notes: rec, loopLen, mode: fitted.mode, shift: fitted.shift, moved: fitted.moved, grid };
}
