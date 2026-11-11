// Lira de Bolso: playable lyre strings, timbre controls, scales and generative music.

import { createLyre, scaleNotes, NOTE_NAMES, MODES, PRESETS } from './lyre.js';

const $ = id => document.getElementById(id);
const ROOT = 50; // Ré 3

// ---- saved settings (optional; the app works without storage) ----
const store = {
  get(k, d) { try { const v = localStorage.getItem('lira-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('lira-' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
};
let presetKey = store.get('preset', 'ruina');
let modeKey = store.get('mode', 'dorico');
if (presetKey && !PRESETS[presetKey]) presetKey = 'ruina';
if (!MODES[modeKey]) modeKey = 'dorico';
const P = { ...PRESETS.ruina, ...store.get('params', {}) };
if (presetKey) Object.assign(P, PRESETS[presetKey]);
let notes = [];

// ---- audio ----
let ac = null, lyre = null;
function audio() {
  if (!ac) {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    comp.connect(ac.destination);
    const out = ac.createGain();
    out.gain.value = 0.7;
    out.connect(comp);
    lyre = createLyre(ac, out, P);
  }
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  return ac;
}
function play(midi, when = 0, vel = 0.5, opt = {}) {
  if (!audio()) return;
  const t = lyre.pluck(midi, when, vel, opt);
  const si = notes.indexOf(midi);
  if (si >= 0) setTimeout(() => flash(si), Math.max(0, (t - ac.currentTime) * 1000));
}
function strum(list, gapMs, vel) {
  if (!audio()) return;
  const t0 = ac.currentTime + 0.01;
  list.forEach((m, i) => play(m, t0 + i * gapMs / 1000, vel));
}

// ---- strings ----
const stringsEl = $('strings'), labelsEl = $('labels');
let strEls = [];
function buildStrings() {
  notes = scaleNotes(ROOT, modeKey);
  stringsEl.innerHTML = '';
  labelsEl.innerHTML = '';
  strEls = notes.map((m, i) => {
    const d = document.createElement('div');
    d.className = 'str';
    d.style.setProperty('--w', (3.2 - 2 * i / (notes.length - 1)).toFixed(2) + 'px');
    stringsEl.appendChild(d);
    const l = document.createElement('span');
    l.textContent = NOTE_NAMES[m % 12];
    if (m % 12 === ROOT % 12) l.className = 'root';
    labelsEl.appendChild(l);
    return d;
  });
}
function flash(i) {
  const el = strEls[i];
  if (!el) return;
  el.classList.remove('on');
  void el.offsetWidth;
  el.classList.add('on');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('on'), 600);
}
function idxAt(x) {
  const r = stringsEl.getBoundingClientRect();
  return Math.max(0, Math.min(notes.length - 1, Math.floor((x - r.left) / r.width * notes.length)));
}
let dragging = false, lastIdx = -1;
stringsEl.addEventListener('pointerdown', e => {
  dragging = true;
  stringsEl.setPointerCapture(e.pointerId);
  lastIdx = idxAt(e.clientX);
  play(notes[lastIdx], 0, 0.55);
});
stringsEl.addEventListener('pointermove', e => {
  if (!dragging) return;
  const i = idxAt(e.clientX);
  if (i === lastIdx) return;
  const dir = i > lastIdx ? 1 : -1;
  for (let j = lastIdx + dir; j !== i + dir; j += dir) play(notes[j], 0, 0.42);
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
  if (i >= 0 && i < notes.length) { play(notes[i], 0, 0.55); e.preventDefault(); }
});

// ---- controls ----
const presetsEl = $('presets'), modesEl = $('modes');
for (const [key, p] of Object.entries(PRESETS)) {
  const b = document.createElement('button');
  b.className = 'chip'; b.type = 'button'; b.dataset.preset = key; b.textContent = p.name;
  presetsEl.appendChild(b);
}
for (const [key, m] of Object.entries(MODES)) {
  const b = document.createElement('button');
  b.className = 'chip'; b.type = 'button'; b.dataset.mode = key; b.textContent = m.name;
  modesEl.appendChild(b);
}
const sliders = { chip: $('sChip'), bright: $('sBright'), sustain: $('sSustain'), echo: $('sEcho') };
const outs = { chip: $('oChip'), bright: $('oBright'), sustain: $('oSustain'), echo: $('oEcho') };

function save() {
  store.set('preset', presetKey);
  store.set('mode', modeKey);
  store.set('params', P);
}
function syncUI() {
  for (const k in sliders) { sliders[k].value = P[k]; outs[k].textContent = P[k]; }
  presetsEl.querySelectorAll('[data-preset]').forEach(b => b.setAttribute('aria-pressed', b.dataset.preset === presetKey));
  modesEl.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === modeKey));
  $('modeDesc').textContent = MODES[modeKey].desc;
  const pName = presetKey ? PRESETS[presetKey].name : 'Personalizado';
  $('summary').textContent = `${pName} · ${MODES[modeKey].name} · Caráter ${P.chip} · Brilho ${P.bright} · Sustentação ${P.sustain} · Eco ${P.echo}`;
}
for (const k in sliders) {
  sliders[k].addEventListener('input', () => {
    P[k] = +sliders[k].value;
    presetKey = null;
    if (lyre) lyre.set(P);
    syncUI();
  });
  sliders[k].addEventListener('change', () => { save(); play(notes[7], 0, 0.5); });
}
presetsEl.addEventListener('click', e => {
  const b = e.target.closest('[data-preset]');
  if (!b) return;
  presetKey = b.dataset.preset;
  Object.assign(P, PRESETS[presetKey]);
  audio();
  lyre.set(P);
  syncUI();
  save();
  strum([0, 2, 4, 7].map(i => notes[i]), 70, 0.45);
});
modesEl.addEventListener('click', e => {
  const b = e.target.closest('[data-mode]');
  if (!b) return;
  modeKey = b.dataset.mode;
  buildStrings();
  syncUI();
  save();
  strum(notes.slice(0, MODES[modeKey].steps.length + 1), 90, 0.45);
});

// ---- generative music ----
let musicOn = false, timer = null, nextT = 0, step = 0, melody = 9;
const BPM = 76, EIGHTH = 60 / BPM / 2;
function schedule() {
  while (nextT < ac.currentTime + 0.25) {
    const n = notes.length, per = MODES[modeKey].steps.length;
    const bar = Math.floor(step / 8), beat = step % 8;
    if (beat === 0) {
      const fifth = MODES[modeKey].steps.indexOf(7);
      const bassDeg = (bar % 4 === 2 && fifth >= 0) ? fifth : 0;
      play(notes[bassDeg], nextT, 0.5, { sustain: Math.max(P.sustain, 60) });
    }
    if (beat === 4 && bar % 2 === 1) play(notes[2], nextT, 0.3);
    const resolve = bar % 4 === 3 && beat >= 6;
    if (resolve) {
      if (beat === 6) play(notes[per], nextT, 0.42);
    } else if (Math.random() > 0.32) {
      melody += [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
      melody = Math.max(per - 2, Math.min(n - 1, melody));
      play(notes[melody], nextT, beat % 2 ? 0.3 : 0.38);
    }
    nextT += EIGHTH * (beat % 2 ? 0.9 : 1.1); // light swing
    step++;
  }
}
$('btnMusic').addEventListener('click', () => {
  if (!audio()) return;
  musicOn = !musicOn;
  $('btnMusic').textContent = musicOn ? 'Parar música' : 'Tocar música';
  if (musicOn) {
    nextT = ac.currentTime + 0.05;
    step = 0;
    melody = MODES[modeKey].steps.length + 2;
    timer = setInterval(schedule, 60);
    schedule();
  } else {
    clearInterval(timer);
  }
});

if (matchMedia('(hover: none)').matches) $('kbdHint').textContent = 'Arraste o dedo para dedilhar várias cordas.';
buildStrings();
syncUI();

// ---- offline / installable (PWA) ----
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
