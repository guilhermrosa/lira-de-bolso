// Recording in layers (a loop pedal for the lyre).
// The first recording sets the loop length: start, play, stop. Each new layer records for one
// full turn of the loop while the earlier layers keep playing, then stops by itself.
// Recordings keep note numbers, so they replay with whatever timbre is chosen.

import { t, LOCALE, lang } from './i18n.js';
import { $, store, state, audio, now, play, onPluck, setMode, MODES } from './core.js';
import { renderRecording, shareOrDownload } from './export.js';

const L = {
  layers: [],        // { notes: [{ t, midi, vel }], muted }
  loopLen: 0,        // seconds; 0 = no loop yet
  loopStart: 0,      // audio time when turn 0 of the loop started
  playing: false,
  rec: null,         // { layer, start, until } while recording
  schedUntil: 0,     // audio time scheduled so far
  timer: null,
};

const MAX_LAYERS = 8;
const fmt = s => `${s.toLocaleString(LOCALE[lang], { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;

// ---- recording ----
onPluck((i, midi, vel, t) => {
  if (!L.rec) return;
  const layer = L.layers[L.rec.layer];
  if (!L.loopLen) layer.notes.push({ t: t - L.rec.start, midi, vel });
  else layer.notes.push({ t: (t - L.loopStart) % L.loopLen, midi, vel });
});

function startRecording() {
  if (!audio()) return;
  if (L.layers.length >= MAX_LAYERS) return;
  L.layers.push({ notes: [], muted: false });
  const t = now();
  if (!L.loopLen) {
    L.rec = { layer: L.layers.length - 1, start: t, until: Infinity };
  } else {
    if (!L.playing) startPlayback();
    L.rec = { layer: L.layers.length - 1, start: t, until: t + L.loopLen };
  }
  render();
}

function stopRecording() {
  if (!L.rec) return;
  const t = now();
  if (!L.loopLen) {
    const len = Math.max(1, t - L.rec.start);
    const layer = L.layers[L.rec.layer];
    if (!layer.notes.length) { L.layers.pop(); L.rec = null; render(); return; } // nothing played
    L.loopLen = len;
    L.loopStart = L.rec.start;
    L.rec = null;
    startPlayback(t);
  } else {
    L.rec = null;
  }
  autosave();
  render();
}

// ---- playback ----
function startPlayback(from) {
  if (!L.loopLen || !audio()) return;
  const t = from ?? now() + 0.05;
  if (from === undefined) L.loopStart = t; // restart from the top
  L.playing = true;
  L.schedUntil = t;
  clearInterval(L.timer);
  L.timer = setInterval(tick, 50);
  tick();
  render();
}
function stopPlayback() {
  L.playing = false;
  clearInterval(L.timer);
  if (L.rec && L.loopLen) L.rec = null;
  render();
}
function tick() {
  const ahead = now() + 0.2;
  if (L.rec && L.loopLen && now() >= L.rec.until) { L.rec = null; autosave(); render(); }
  while (L.schedUntil < ahead) {
    const a = L.schedUntil, b = Math.min(ahead, a + L.loopLen);
    const turn = Math.floor((a - L.loopStart) / L.loopLen);
    const base = L.loopStart + turn * L.loopLen;
    for (const layer of L.layers) {
      if (layer.muted) continue;
      for (const n of layer.notes) {
        for (const at of [base + n.t, base + L.loopLen + n.t]) {
          if (at >= a && at < b) play(n.midi, at, n.vel);
        }
      }
    }
    L.schedUntil = b;
  }
  drawBar();
}

function drawBar() {
  const bar = $('loopBar');
  if (!L.loopLen) { bar.style.setProperty('--p', 0); return; }
  const p = L.playing ? ((now() - L.loopStart) % L.loopLen) / L.loopLen : 0;
  bar.style.setProperty('--p', Math.max(0, p));
}

// ---- saved recordings ----
function snapshot() {
  return { loopLen: L.loopLen, layers: L.layers, mode: state.modeKey, preset: state.presetKey, params: { ...state.P } };
}
function autosave() { store.set('loop-current', snapshot()); }
function load(rec) {
  stopPlayback();
  L.layers = rec.layers.map(l => ({ notes: l.notes.slice(), muted: !!l.muted }));
  L.loopLen = rec.loopLen;
  L.rec = null;
  if (rec.mode && MODES[rec.mode]) setMode(rec.mode);
  render();
}
export function saved() { return store.get('loops', []); }
// From the voice (hum.js, v0.7): keep a recording in the saved list, or make it the loop's first layer.
export function addSaved(rec, base) {
  const list = saved();
  let k = 1; while (list.some(r => r.name === `${base} ${k}`)) k++;
  const name = `${base} ${k}`;
  list.unshift({ name, at: new Date().toISOString(), ...rec });
  store.set('loops', list.slice(0, 30));
  $('savedBox').open = true;
  render();
  return name;
}
export function loadIntoLooper(rec) { load(rec); autosave(); }

// Saving asks for a name first (prefilled), then opens the saved list so the result is visible.
function askName() {
  if (!L.loopLen) return;
  $('loopName').value = t('rec.defaultName', { n: saved().length + 1 });
  $('loopNameForm').hidden = false;
  $('loopName').focus();
  $('loopName').select();
}
function saveCurrent(name) {
  const list = saved();
  list.unshift({ name: name.trim() || t('rec.defaultName', { n: list.length + 1 }), at: new Date().toISOString(), ...snapshot() });
  store.set('loops', list.slice(0, 30));
  $('loopNameForm').hidden = true;
  $('savedBox').open = true;
  render();
  flashMsg(t('rec.savedMsg', { name: list[0].name }));
}
let msgTimer = null;
function flashMsg(text) {
  $('loopMsg').textContent = text;
  $('loopMsg').hidden = false;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { $('loopMsg').hidden = true; }, 3500);
}

// Audio file: rendered from the recording, then shared (phones) or downloaded.
async function exportAudio(rec, btn) {
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = t('rec.exporting');
  try {
    const blob = await renderRecording(rec);
    const r = await shareOrDownload(blob, rec.name || t('rec.fileName'));
    flashMsg(r === 'shared' ? t('rec.shared') : r === 'downloaded' ? t('rec.downloaded') : t('rec.shareCancelled'));
  } catch (e) {
    flashMsg(t('rec.exportFailed'));
  }
  btn.disabled = false;
  btn.textContent = label;
}

// ---- UI ----
function render() {
  const has = L.loopLen > 0;
  const rec = !!L.rec;
  $('loopRec').textContent = rec ? (has ? t('rec.stopLayer') : t('rec.stopLoop')) : (has ? t('rec.newLayer') : t('rec.record'));
  $('loopRec').classList.toggle('recording', rec);
  $('loopRec').disabled = L.layers.length >= MAX_LAYERS && !rec;
  $('loopPlay').textContent = L.playing ? t('rec.stop') : t('rec.play');
  $('loopPlay').disabled = !has;
  $('loopUndo').disabled = !has || rec;
  $('loopClear').disabled = !L.layers.length || rec;
  $('loopSave').disabled = !has || rec;
  $('loopExport').disabled = !has || rec;
  $('loopStatus').textContent = rec
    ? (has ? t('rec.recLayer') : t('rec.recFirst'))
    : has ? t('rec.loopInfo', { len: fmt(L.loopLen), n: L.layers.length, max: L.layers.length >= MAX_LAYERS })
      : t('rec.idle');
  const ul = $('loopLayers');
  ul.innerHTML = '';
  L.layers.forEach((layer, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('aria-pressed', !layer.muted);
    b.textContent = t('rec.layer', { i: i + 1, n: layer.notes.length, muted: layer.muted });
    b.addEventListener('click', () => { layer.muted = !layer.muted; autosave(); render(); });
    li.appendChild(b);
    ul.appendChild(li);
  });
  const list = saved();
  const sl = $('loopSaved');
  sl.innerHTML = '';
  if (!list.length) { const li = document.createElement('li'); li.className = 'note'; li.textContent = t('rec.noneSaved'); sl.appendChild(li); }
  list.forEach((r, i) => {
    const li = document.createElement('li');
    li.className = 'saved-row';
    const when = (() => { try { return new Date(r.at).toLocaleString(LOCALE[lang], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } })();
    li.innerHTML = `<span><b></b><small></small></span>`;
    li.querySelector('b').textContent = r.name;
    li.querySelector('small').textContent = t('rec.savedInfo', { when, len: fmt(r.loopLen), n: r.layers.length });
    const open = document.createElement('button');
    open.type = 'button'; open.className = 'btn'; open.textContent = t('rec.open');
    open.addEventListener('click', () => { load(r); flashMsg(t('rec.openedMsg', { name: r.name })); });
    const ren = document.createElement('button');
    ren.type = 'button'; ren.className = 'btn'; ren.textContent = t('rec.rename');
    ren.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'text'; input.value = r.name; input.className = 'name-input'; input.maxLength = 40;
      input.setAttribute('aria-label', t('rec.renameAria'));
      const b = li.querySelector('b');
      b.replaceWith(input);
      input.focus(); input.select();
      const done = () => { const l = saved(); if (l[i]) { l[i].name = input.value.trim() || r.name; store.set('loops', l); } render(); };
      input.addEventListener('keydown', e => { if (e.key === 'Enter') done(); if (e.key === 'Escape') render(); });
      input.addEventListener('blur', done);
    });
    const dl = document.createElement('button');
    dl.type = 'button'; dl.className = 'btn'; dl.textContent = t('rec.export');
    dl.addEventListener('click', () => exportAudio(r, dl));
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'btn'; del.textContent = t('rec.delete');
    del.addEventListener('click', () => {
      if (!del.dataset.armed) { del.dataset.armed = '1'; del.textContent = t('rec.deleteConfirm'); return; }
      const l = saved(); l.splice(i, 1); store.set('loops', l); render();
    });
    li.append(open, ren, dl, del);
    sl.appendChild(li);
  });
  drawBar();
}

$('loopRec').addEventListener('click', () => (L.rec ? stopRecording() : startRecording()));
$('loopPlay').addEventListener('click', () => (L.playing ? stopPlayback() : startPlayback()));
$('loopUndo').addEventListener('click', () => {
  L.layers.pop();
  if (!L.layers.length) { L.loopLen = 0; stopPlayback(); }
  autosave();
  render();
});
$('loopClear').addEventListener('click', () => {
  const b = $('loopClear');
  if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = t('rec.clearConfirm'); setTimeout(() => { b.dataset.armed = ''; b.textContent = t('rec.clear'); }, 2500); return; }
  b.dataset.armed = ''; b.textContent = t('rec.clear');
  stopPlayback();
  L.layers = []; L.loopLen = 0; L.rec = null;
  autosave();
  render();
});
$('loopSave').addEventListener('click', askName);
$('loopNameForm').addEventListener('submit', e => { e.preventDefault(); saveCurrent($('loopName').value); });
$('loopNameCancel').addEventListener('click', () => { $('loopNameForm').hidden = true; });
$('loopExport').addEventListener('click', () => exportAudio({ name: t('rec.current'), ...snapshot() }, $('loopExport')));

// restore the loop from the last session (not playing until asked)
const cur = store.get('loop-current', null);
if (cur && cur.loopLen && Array.isArray(cur.layers)) {
  L.layers = cur.layers.map(l => ({ notes: l.notes.slice(), muted: !!l.muted }));
  L.loopLen = cur.loopLen;
}

export function initLooper() {
  if (saved().length) $('savedBox').open = true;
  render();
}
export function stopLooper() { if (L.rec) stopRecording(); }
