// Recording in layers (a loop pedal for the lyre).
// The first recording sets the loop length: start, play, stop. Each new layer records for one
// full turn of the loop while the earlier layers keep playing, then stops by itself.
// Recordings keep note numbers, so they replay with whatever timbre is chosen.

import { $, store, state, audio, now, play, onPluck, setMode, MODES } from './core.js';

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
const fmt = s => `${s.toFixed(1).replace('.', ',')} s`;

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
function saved() { return store.get('loops', []); }
function saveCurrent() {
  if (!L.loopLen) return;
  const list = saved();
  const n = list.length + 1;
  list.unshift({ name: `Gravação ${n}`, at: new Date().toISOString(), ...snapshot() });
  store.set('loops', list.slice(0, 30));
  render();
  $('loopSave').textContent = 'Salva';
  setTimeout(() => { $('loopSave').textContent = 'Salvar gravação'; }, 1400);
}

// ---- UI ----
function render() {
  const has = L.loopLen > 0;
  const rec = !!L.rec;
  $('loopRec').textContent = rec ? (has ? 'Parar camada' : 'Parar e fazer o loop') : (has ? 'Gravar nova camada' : 'Gravar');
  $('loopRec').classList.toggle('recording', rec);
  $('loopRec').disabled = L.layers.length >= MAX_LAYERS && !rec;
  $('loopPlay').textContent = L.playing ? 'Parar' : 'Tocar';
  $('loopPlay').disabled = !has;
  $('loopUndo').disabled = !has || rec;
  $('loopClear').disabled = !L.layers.length || rec;
  $('loopSave').disabled = !has || rec;
  $('loopStatus').textContent = rec
    ? (has ? 'Gravando uma volta do loop por cima das camadas anteriores…' : 'Gravando… toque as cordas e aperte "Parar" para fechar o loop.')
    : has ? `Loop de ${fmt(L.loopLen)} · ${L.layers.length} ${L.layers.length === 1 ? 'camada' : 'camadas'}${L.layers.length >= MAX_LAYERS ? ' (máximo)' : ''}`
      : 'Aperte "Gravar", toque uma melodia e aperte de novo para fechar o loop.';
  const ul = $('loopLayers');
  ul.innerHTML = '';
  L.layers.forEach((layer, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('aria-pressed', !layer.muted);
    b.textContent = `Camada ${i + 1} · ${layer.notes.length} notas${layer.muted ? ' (mudo)' : ''}`;
    b.addEventListener('click', () => { layer.muted = !layer.muted; autosave(); render(); });
    li.appendChild(b);
    ul.appendChild(li);
  });
  const list = saved();
  const sl = $('loopSaved');
  sl.innerHTML = list.length ? '' : '<li class="note">Nenhuma gravação salva ainda.</li>';
  list.forEach((r, i) => {
    const li = document.createElement('li');
    li.className = 'saved-row';
    const when = (() => { try { return new Date(r.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } })();
    li.innerHTML = `<span><b></b><small></small></span>`;
    li.querySelector('b').textContent = r.name;
    li.querySelector('small').textContent = `${when} · ${fmt(r.loopLen)} · ${r.layers.length} ${r.layers.length === 1 ? 'camada' : 'camadas'}`;
    const open = document.createElement('button');
    open.type = 'button'; open.className = 'btn'; open.textContent = 'Abrir';
    open.addEventListener('click', () => load(r));
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'btn'; del.textContent = 'Apagar';
    del.addEventListener('click', () => {
      if (!del.dataset.armed) { del.dataset.armed = '1'; del.textContent = 'Confirmar'; return; }
      const l = saved(); l.splice(i, 1); store.set('loops', l); render();
    });
    li.append(open, del);
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
  if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Toque de novo para limpar'; setTimeout(() => { b.dataset.armed = ''; b.textContent = 'Limpar'; }, 2500); return; }
  b.dataset.armed = ''; b.textContent = 'Limpar';
  stopPlayback();
  L.layers = []; L.loopLen = 0; L.rec = null;
  autosave();
  render();
});
$('loopSave').addEventListener('click', saveCurrent);

// restore the loop from the last session (not playing until asked)
const cur = store.get('loop-current', null);
if (cur && cur.loopLen && Array.isArray(cur.layers)) {
  L.layers = cur.layers.map(l => ({ notes: l.notes.slice(), muted: !!l.muted }));
  L.loopLen = cur.loopLen;
}

export function initLooper() { render(); }
export function stopLooper() { if (L.rec) stopRecording(); }
