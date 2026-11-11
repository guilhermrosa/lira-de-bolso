// Lira de Bolso: entry point. Tabs (Tocar, Relaxar, Aprender, Canções), timbre and scale
// controls, and offline support. The strings and audio live in core.js.

import { $, state, audio, applyTimbre, saveSettings, buildStrings, setMode, onModeChange, play, strum, MODES, PRESETS } from './core.js';
import { initLooper, stopLooper } from './looper.js';
import { initRelax } from './relax.js';
import { initLearn, stopLearn } from './learn.js';
import { initSongs, stopSongs, refreshSongs } from './songs.js';

// ---- timbre and scale ----
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

function syncUI() {
  const P = state.P;
  for (const k in sliders) { sliders[k].value = P[k]; outs[k].textContent = P[k]; }
  presetsEl.querySelectorAll('[data-preset]').forEach(b => b.setAttribute('aria-pressed', b.dataset.preset === state.presetKey));
  modesEl.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === state.modeKey));
  $('modeDesc').textContent = MODES[state.modeKey].desc;
  const pName = state.presetKey ? PRESETS[state.presetKey].name : 'Personalizado';
  $('summary').textContent = `${pName} · ${MODES[state.modeKey].name} · Caráter ${P.chip} · Brilho ${P.bright} · Sustentação ${P.sustain} · Eco ${P.echo}`;
}
for (const k in sliders) {
  sliders[k].addEventListener('input', () => {
    state.P[k] = +sliders[k].value;
    state.presetKey = null;
    applyTimbre();
    syncUI();
  });
  sliders[k].addEventListener('change', () => { saveSettings(); play(state.notes[7], 0, 0.5); });
}
presetsEl.addEventListener('click', e => {
  const b = e.target.closest('[data-preset]');
  if (!b) return;
  state.presetKey = b.dataset.preset;
  Object.assign(state.P, PRESETS[state.presetKey]);
  audio();
  applyTimbre();
  syncUI();
  saveSettings();
  strum([0, 2, 4, 7].map(i => state.notes[i]), 70, 0.45);
});
modesEl.addEventListener('click', e => {
  const b = e.target.closest('[data-mode]');
  if (!b) return;
  setMode(b.dataset.mode);
  strum(state.notes.slice(0, MODES[state.modeKey].steps.length + 1), 90, 0.45);
});
onModeChange(syncUI);

// ---- tabs ----
const TABS = ['tocar', 'relaxar', 'aprender', 'cancoes'];
function showTab(name) {
  if (!TABS.includes(name)) name = 'tocar';
  for (const t of TABS) {
    $('tab-' + t).setAttribute('aria-selected', t === name);
    $('panel-' + t).hidden = t !== name;
  }
  // games that wait for the player stop when you leave their tab; music and loops keep playing
  if (name !== 'aprender') stopLearn();
  if (name !== 'cancoes') stopSongs();
  else refreshSongs();
  if (name !== 'tocar') stopLooper();
  if (location.hash.slice(1) !== name) history.replaceState(null, '', '#' + name);
}
for (const t of TABS) $('tab-' + t).addEventListener('click', () => showTab(t));
addEventListener('hashchange', () => showTab(location.hash.slice(1)));

if (matchMedia('(hover: none)').matches) $('kbdHint').textContent = 'Arraste o dedo para dedilhar várias cordas.';
buildStrings();
syncUI();
initLooper();
initRelax();
initLearn();
initSongs();
showTab(location.hash.slice(1));

// ---- offline / installable (PWA) ----
// When a new version takes over, reload once so it shows right away; check for one on every return.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => {});
  });
}
