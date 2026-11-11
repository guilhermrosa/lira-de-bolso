// Shared core of the app: audio, the strings on screen, the chosen timbre and scale.
// Every tab (play, relax, learn, songs) builds on this module.

import { createLyre, scaleNotes, NOTE_NAMES, MODES, PRESETS } from './lyre.js';

export const $ = id => document.getElementById(id);
export const ROOT = 50; // Ré 3

// ---- saved settings (optional; the app works without storage) ----
export const store = {
  get(k, d) { try { const v = localStorage.getItem('lira-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('lira-' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
};

export const state = {
  presetKey: store.get('preset', 'ruina'),
  modeKey: store.get('mode', 'dorico'),
  P: null,     // timbre params (chip, bright, sustain, echo)
  notes: [],   // MIDI note of each string, low to high
};
if (state.presetKey && !PRESETS[state.presetKey]) state.presetKey = 'ruina';
if (!MODES[state.modeKey]) state.modeKey = 'dorico';
state.P = { ...PRESETS.ruina, ...store.get('params', {}) };
if (state.presetKey) Object.assign(state.P, PRESETS[state.presetKey]);

export function saveSettings() {
  store.set('preset', state.presetKey);
  store.set('mode', state.modeKey);
  store.set('params', state.P);
}

// ---- audio ----
let ac = null, lyre = null, out = null;
export function audio() {
  if (!ac) {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    comp.connect(ac.destination);
    out = ac.createGain();
    out.gain.value = 0.7;
    out.connect(comp);
    lyre = createLyre(ac, out, state.P);
  }
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  return ac;
}
export const now = () => (ac ? ac.currentTime : 0);
export function applyTimbre() { if (lyre) lyre.set(state.P); }

// master volume, used by the relax timer to fade out
export function setVolume(v, seconds = 0) {
  if (!audio()) return;
  const g = out.gain, t = ac.currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  if (seconds > 0) g.linearRampToValueAtTime(v, t + seconds);
  else g.setValueAtTime(v, t);
}
export const FULL_VOLUME = 0.7;

// Play a note; its string flashes when it sounds. Returns the start time.
export function play(midi, when = 0, vel = 0.5, opt = {}) {
  if (!audio()) return 0;
  const t = lyre.pluck(midi, when, vel, opt);
  const si = state.notes.indexOf(midi);
  if (si >= 0) setTimeout(() => flash(si), Math.max(0, (t - ac.currentTime) * 1000));
  return t;
}
// Play a phrase: items [{ t, midi, vel, onStart }] with t in seconds from now.
// Notes are handed to the audio engine at most 0.25 s ahead, so cancel() silences the rest
// of the phrase at once (scheduling everything up front could not be taken back).
export function phrase(items, onEnd) {
  if (!audio()) return () => {};
  const t0 = ac.currentTime + 0.1;
  const queue = items.slice().sort((a, b) => a.t - b.t);
  let k = 0;
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  const tick = () => {
    const horizon = ac.currentTime + 0.25;
    while (k < queue.length && t0 + queue[k].t < horizon) {
      const it = queue[k++];
      play(it.midi, t0 + it.t, it.vel ?? 0.5);
      if (it.onStart) later(it.onStart, Math.max(0, (t0 + it.t - ac.currentTime) * 1000));
    }
    if (k >= queue.length) {
      clearInterval(iv);
      const end = queue.length ? t0 + queue[queue.length - 1].t : ac.currentTime;
      if (onEnd) later(onEnd, Math.max(0, (end - ac.currentTime) * 1000) + 400);
    }
  };
  const iv = setInterval(tick, 40);
  tick();
  return () => { clearInterval(iv); timers.forEach(clearTimeout); timers.clear(); };
}

export function strum(list, gapMs, vel) {
  if (!audio()) return;
  const t0 = ac.currentTime + 0.01;
  list.forEach((m, i) => play(m, t0 + i * gapMs / 1000, vel));
}

// ---- strings ----
const stringsEl = $('strings'), labelsEl = $('labels');
let strEls = [];
const pluckListeners = new Set();
const modeListeners = new Set();
export const onPluck = fn => { pluckListeners.add(fn); return () => pluckListeners.delete(fn); };
export const onModeChange = fn => { modeListeners.add(fn); };

export function buildStrings() {
  state.notes = scaleNotes(ROOT, state.modeKey);
  stringsEl.innerHTML = '';
  labelsEl.innerHTML = '';
  strEls = state.notes.map((m, i) => {
    const d = document.createElement('div');
    d.className = 'str';
    d.style.setProperty('--w', (3.2 - 2 * i / (state.notes.length - 1)).toFixed(2) + 'px');
    stringsEl.appendChild(d);
    const l = document.createElement('span');
    l.textContent = NOTE_NAMES[m % 12];
    if (m % 12 === ROOT % 12) l.className = 'root';
    labelsEl.appendChild(l);
    return d;
  });
}
export function setMode(key) {
  if (!MODES[key] || key === state.modeKey) return;
  state.modeKey = key;
  buildStrings();
  saveSettings();
  for (const fn of modeListeners) fn(key);
}

export function flash(i) {
  const el = strEls[i];
  if (!el) return;
  el.classList.remove('on');
  void el.offsetWidth;
  el.classList.add('on');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('on'), 600);
}
// a steady highlight that shows which string to play next (learn and songs tabs)
export function guide(indices) {
  strEls.forEach((el, i) => el.classList.toggle('guide', indices.includes(i)));
}

// the player touched string i
function userPluck(i, vel) {
  const midi = state.notes[i];
  play(midi, 0, vel);
  for (const fn of pluckListeners) fn(i, midi, vel, now());
}
function idxAt(x) {
  const r = stringsEl.getBoundingClientRect();
  return Math.max(0, Math.min(state.notes.length - 1, Math.floor((x - r.left) / r.width * state.notes.length)));
}
let dragging = false, lastIdx = -1;
stringsEl.addEventListener('pointerdown', e => {
  dragging = true;
  stringsEl.setPointerCapture(e.pointerId);
  lastIdx = idxAt(e.clientX);
  userPluck(lastIdx, 0.55);
});
stringsEl.addEventListener('pointermove', e => {
  if (!dragging) return;
  const i = idxAt(e.clientX);
  if (i === lastIdx) return;
  const dir = i > lastIdx ? 1 : -1;
  for (let j = lastIdx + dir; j !== i + dir; j += dir) userPluck(j, 0.42);
  lastIdx = i;
});
const stop = () => { dragging = false; lastIdx = -1; };
stringsEl.addEventListener('pointerup', stop);
stringsEl.addEventListener('pointercancel', stop);
const KEYS = 'zxcvbnmasdfghjklqwertyuiop';
addEventListener('keydown', e => {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target instanceof HTMLInputElement) return;
  const i = KEYS.indexOf(e.key.toLowerCase());
  if (i >= 0 && i < state.notes.length) { userPluck(i, 0.55); e.preventDefault(); }
});

export { MODES, PRESETS };
