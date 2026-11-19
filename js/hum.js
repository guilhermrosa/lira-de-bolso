// "Da sua voz para a lira" (v0.7): hum, sing or whistle into the microphone (or open an audio file
// with one voice) and the lyre plays it back; the result can be saved as a recording or taken into
// the layered recorder. v0.11: "Abrir música" takes a song with a band: pick a stretch of up to
// 30 s, the Basic Pitch model (song-ai.js) hears every note in it and melody.js picks the tune.
// Everything happens on the device: the sound is analysed here and never sent anywhere.

import { t, noteName } from './i18n.js';
import { $, state, audio, play, phrase, setMode, MODES } from './core.js';
import { track, segment, arrange, stringsOf, ANALYSIS_RATE } from './pitch.js';
import { melody } from './melody.js';
import { loadModel, posteriors, MODEL_RATE } from './song-ai.js';
import { addSaved, loadIntoLooper } from './looper.js';

const MAX_SECONDS = 30;
const CLIP = 30; // seconds of a song analysed at once
const H = { rec: null, raw: null, result: null, stopPlay: null, auto: true, rhythm: true, source: '', song: null, busy: false, preview: null, sel: -1, undo: [], at: -1 };
const PPS = 70; // roll pixels per second: wide enough to tap a note, the roll scrolls sideways

const status = text => { $('humStatus').textContent = text; };

// Any audio (a recorded clip or a file) → mono samples at the analysis rate, at most MAX_SECONDS
// (files: the first 60 s). The browser's own resampler does the work.
async function toSamples(arrayBuffer, limit, rate = ANALYSIS_RATE) {
  const ac = audio();
  const buf = await ac.decodeAudioData(arrayBuffer);
  const len = Math.min(buf.length, Math.floor(limit * buf.sampleRate));
  const off = new OfflineAudioContext(1, Math.ceil(len / buf.sampleRate * rate), rate);
  const src = off.createBufferSource();
  src.buffer = buf;
  src.connect(off.destination);
  src.start();
  return (await off.startRendering()).getChannelData(0);
}

// ---- microphone ----
async function startMic() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    status(t('hum.noRecorder'));
    return;
  }
  const ac = audio();
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } });
  } catch (e) {
    status(t('hum.noMic'));
    return;
  }
  stopListening(); stopPreview(); H.song = null;
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  const an = ac.createAnalyser();
  an.fftSize = 1024;
  const mic = ac.createMediaStreamSource(stream);
  mic.connect(an);
  const data = new Float32Array(an.fftSize);
  const t0 = performance.now();
  H.rec = { rec, stream, mic, timer: 0 };
  const meter = () => {
    if (!H.rec) return;
    an.getFloatTimeDomainData(data);
    let peak = 0; for (const v of data) peak = Math.max(peak, Math.abs(v));
    $('humLevel').style.setProperty('--p', Math.min(1, peak * 1.6).toFixed(3));
    const s = (performance.now() - t0) / 1000;
    status(t('hum.recording', { s: Math.floor(s), max: MAX_SECONDS }));
    if (s >= MAX_SECONDS) { stopMic(); return; }
    H.rec.timer = requestAnimationFrame(meter);
  };
  rec.onstop = async () => {
    stream.getTracks().forEach(t => t.stop());
    mic.disconnect();
    $('humLevel').style.setProperty('--p', 0);
    status(t('hum.analysing'));
    try {
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      H.raw = segment(track(await toSamples(await blob.arrayBuffer(), MAX_SECONDS), ANALYSIS_RATE));
      H.source = 'voz';
      analyse();
    } catch (e) { status(t('hum.readFailed')); }
    render();
  };
  rec.start();
  meter();
  render();
}
function stopMic() {
  if (!H.rec) return;
  cancelAnimationFrame(H.rec.timer);
  const { rec } = H.rec;
  H.rec = null;
  if (rec.state !== 'inactive') rec.stop();
  render();
}

// ---- file ----
async function openFile(file) {
  if (!file) return;
  stopListening(); stopPreview(); H.song = null;
  status(t('hum.analysing'));
  try {
    H.raw = segment(track(await toSamples(await file.arrayBuffer(), 60), ANALYSIS_RATE));
    H.source = 'arquivo';
    analyse();
  } catch (e) {
    status(t('hum.fileFailed'));
  }
  render();
}

// ---- a song with a band ----
const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function clipRange() {
  const len = H.song.x.length / MODEL_RATE, from = Math.min(+$('songStart').value, Math.max(0, len - 1));
  return { from, to: Math.min(len, from + CLIP) };
}
function showClip() {
  const { from, to } = clipRange();
  $('songClipInfo').textContent = t('song.clip', { from: clock(from), to: clock(to) });
}
async function openSong(file) {
  if (!file) return;
  stopListening(); stopPreview();
  status(t('song.reading'));
  H.busy = true; render();
  try {
    const x = await toSamples(await file.arrayBuffer(), 20 * 60, MODEL_RATE); // whole song, mono
    H.song = { x };
    const len = x.length / MODEL_RATE;
    $('songStart').max = Math.max(0, Math.floor(len - CLIP));
    $('songStart').value = 0;
    showClip();
    status(t('song.pick'));
    loadModel().catch(() => {}); // start fetching the model while a stretch is chosen
  } catch (e) {
    H.song = null;
    status(t('hum.fileFailed'));
  }
  H.busy = false; render();
}
function preview() {
  if (H.preview) { stopPreview(); return; }
  const ac = audio(), { from, to } = clipRange();
  const buf = ac.createBuffer(1, H.song.x.length, MODEL_RATE);
  buf.getChannelData(0).set(H.song.x);
  const src = ac.createBufferSource(), g = ac.createGain();
  g.gain.value = 0.8;
  src.buffer = buf; src.connect(g).connect(ac.destination);
  src.onended = () => { if (H.preview === src) { H.preview = null; render(); } };
  src.start(0, from, to - from);
  H.preview = src; render();
}
function stopPreview() { if (H.preview) { const p = H.preview; H.preview = null; try { p.stop(); } catch (e) { /* ended */ } render(); } }
async function extract() {
  if (!H.song || H.busy) return;
  stopPreview(); stopListening();
  H.busy = true; render();
  const { from, to } = clipRange();
  const x = H.song.x.subarray(Math.floor(from * MODEL_RATE), Math.floor(to * MODEL_RATE));
  try {
    status(t('song.loading'));
    await loadModel();
  } catch (e) {
    status(t('song.loadFailed'));
    H.busy = false; render(); return;
  }
  try {
    const p = await posteriors(x, f => { status(t('song.listening', { p: Math.round(f * 100) })); $('humLevel').style.setProperty('--p', f.toFixed(3)); });
    $('humLevel').style.setProperty('--p', 0);
    H.raw = melody(p.frames, p.onsets);
    H.source = 'musica';
    H.song = null;
    analyse();
  } catch (e) {
    status(t('song.failed'));
  }
  H.busy = false; render();
}

// ---- analysis ----
// keep = true when an option is switched on a result: the result before it can be undone
function analyse(keep = false) {
  if (!H.raw) return;
  if (keep && H.result) H.undo.push(snapshot()); else H.undo = [];
  H.sel = -1;
  H.result = arrange(H.raw, { prefer: state.modeKey, autoMode: H.auto, rhythm: H.rhythm });
  if (!H.result) {
    status(t(H.source === 'musica' ? 'song.nothing' : 'hum.nothing'));
    return;
  }
  summary();
}
function summary() {
  const r = H.result, n = r.notes.length;
  status(t('hum.result', { n, mode: t('mode.' + r.mode), shift: r.shift, moved: r.moved }) + (H.source === 'musica' ? ' ' + t('song.approx') : ''));
}

// ---- editing (v0.12, step 3): tap a note to pick it, then move it a string up or down, earlier
// or later, or delete it; tap an empty spot to put a note there. Every change can be undone.
const snapshot = () => JSON.parse(JSON.stringify(H.result));
const step = () => H.result.grid || 0.05; // moves follow the rhythm's grid when there is one
function edited(fn) {
  H.undo.push(snapshot());
  if (H.undo.length > 60) H.undo.shift();
  const r = H.result, picked = r.notes[H.sel];
  fn(r);
  r.notes.sort((a, b) => a.t - b.t || a.midi - b.midi);
  H.sel = picked ? r.notes.indexOf(picked) : H.sel;
  const last = r.notes.length ? r.notes[r.notes.length - 1].t : 0;
  r.loopLen = +Math.max(r.loopLen, last + Math.max(0.8, (r.grid || 0) * 2)).toFixed(3);
  if (H.sel >= 0) play(r.notes[H.sel].midi, 0, 0.55);
  render();
}
function pick(i) { H.sel = i; if (i >= 0) play(H.result.notes[i].midi, 0, 0.55); render(); }
function moveString(d) {
  if (H.sel < 0) return;
  const strings = stringsOf(H.result.mode);
  edited(r => { const n = r.notes[H.sel], i = strings.indexOf(n.midi); n.midi = strings[Math.max(0, Math.min(strings.length - 1, i + d))]; });
}
function moveTime(d) {
  if (H.sel < 0) return;
  edited(r => { const n = r.notes[H.sel]; n.t = +Math.max(0, n.t + d * step()).toFixed(3); });
}
function remove() {
  if (H.sel < 0) return;
  edited(r => { r.notes.splice(H.sel, 1); H.sel = -1; });
}
function undo() {
  if (!H.undo.length) return;
  stopListening();
  H.result = H.undo.pop();
  H.sel = -1;
  summary(); render();
}
// a tap on the roll: the note under the finger, or a new note on that string at that time
function tapRoll(e) {
  const r = H.result;
  if (!r || H.stopPlay) return;
  const cv = $('humRoll'), box = cv.getBoundingClientRect();
  const x = e.clientX - box.left, y = e.clientY - box.top;
  const strings = stringsOf(r.mode), rowH = box.height / strings.length;
  const row = Math.max(0, Math.min(strings.length - 1, Math.floor((box.height - y) / rowH)));
  const hit = rects().findIndex(q => x >= q.x - 6 && x <= q.x + q.w + 6 && y >= q.y - 4 && y <= q.y + q.h + 4);
  if (hit >= 0) { pick(hit === H.sel ? -1 : hit); return; }
  if (H.sel >= 0) { pick(-1); return; } // a tap beside the picked note lets it go
  const g = step(), at = Math.max(0, Math.round(((x - 4) / PPS) / g) * g);
  const note = { t: +at.toFixed(3), midi: strings[row], vel: 0.5 };
  edited(r2 => { r2.notes.push(note); H.sel = -1; });
  H.sel = r.notes.indexOf(note); play(note.midi, 0, 0.55); render();
}

function listen() {
  if (!H.result) return;
  if (H.stopPlay) { stopListening(); return; }
  setMode(H.result.mode);
  H.sel = -1;
  H.stopPlay = phrase(H.result.notes.map((n, i) => ({ t: n.t, midi: n.midi, vel: n.vel, onStart: () => { H.at = i; drawRoll(); follow(n); } })), () => { H.stopPlay = null; H.at = -1; render(); });
  render();
}
function stopListening() { if (H.stopPlay) { H.stopPlay(); H.stopPlay = null; H.at = -1; render(); } }
// keep the note that sounds in view while listening
function follow(n) {
  const wrap = $('humRollWrap'), x = 4 + n.t * PPS;
  if (x < wrap.scrollLeft + 20 || x > wrap.scrollLeft + wrap.clientWidth - 40) wrap.scrollLeft = Math.max(0, x - 40);
}

const asRecording = () => ({
  loopLen: H.result.loopLen,
  layers: [{ notes: H.result.notes, muted: false }],
  mode: H.result.mode, preset: state.presetKey, params: { ...state.P },
});

// ---- drawing: the melody on the lyre's strings, a row per string, low at the bottom ----
// where each note is drawn (also what a tap hits): until the next note, at most 0.6 s
function rects() {
  const r = H.result, cv = $('humRoll'), h = cv.clientHeight;
  const strings = stringsOf(r.mode), rowH = h / strings.length;
  return r.notes.map((n, j) => {
    const next = r.notes.slice(j + 1).find(m => m.t > n.t);
    const len = Math.max(8, Math.min(0.6, (next ? next.t : r.loopLen) - n.t) * PPS - 3);
    const i = strings.indexOf(n.midi);
    return { x: 4 + n.t * PPS, y: h - (i + 1) * rowH + 2, w: len, h: Math.max(3, rowH - 4) };
  });
}
function drawRoll() {
  const cv = $('humRoll'), r = H.result;
  if (!r) return;
  const wrap = $('humRollWrap');
  cv.style.width = Math.max(wrap.clientWidth, Math.ceil(r.loopLen * PPS + 12)) + 'px';
  const dpr = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const strings = stringsOf(r.mode), rows = strings.length, rowH = h / rows;
  ctx.fillStyle = css.getPropertyValue('--lyre-bg'); ctx.fillRect(0, 0, w, h); // the lyre's own colours, in any theme
  ctx.strokeStyle = css.getPropertyValue('--clay-deep');
  for (let i = 0; i < rows; i++) { const y = h - (i + 0.5) * rowH; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  // a faint mark every second
  ctx.fillStyle = css.getPropertyValue('--clay-deep');
  for (let s = 1; s * PPS < w; s++) ctx.fillRect(4 + s * PPS, 0, 1, 4);
  const ink = css.getPropertyValue('--lyre-ink'), hot = css.getPropertyValue('--string-hot');
  rects().forEach((q, j) => {
    ctx.fillStyle = j === H.sel || j === H.at ? hot : ink;
    ctx.fillRect(q.x, q.y, q.w, q.h);
    if (j === H.sel) { ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.strokeRect(q.x - 2, q.y - 2, q.w + 4, q.h + 4); }
  });
}

function render() {
  const recording = !!H.rec;
  $('humRec').textContent = recording ? t('hum.stop') : t('hum.record');
  $('humRec').classList.toggle('recording', recording);
  $('humRec').disabled = H.busy;
  $('humFileBtn').classList.toggle('disabled', recording || H.busy);
  $('songFileBtn').classList.toggle('disabled', recording || H.busy);
  $('songClip').hidden = !H.song || recording;
  $('songGo').disabled = $('songPreview').disabled = $('songStart').disabled = H.busy;
  $('songPreview').textContent = H.preview ? t('hum.stop') : t('song.preview');
  $('humResult').hidden = !H.result || recording || !!H.song;
  $('humPlay').textContent = H.stopPlay ? t('hum.stop') : t('hum.listen');
  $('humAuto').setAttribute('aria-pressed', H.auto);
  $('humRhythm').setAttribute('aria-pressed', H.rhythm);
  const n = H.result && H.sel >= 0 ? H.result.notes[H.sel] : null;
  ['editUp', 'editDown', 'editLeft', 'editRight', 'editDelete'].forEach(id => { $(id).disabled = !n || !!H.stopPlay; });
  $('editUndo').disabled = !H.undo.length || !!H.stopPlay;
  $('editInfo').textContent = n ? `${noteName(n.midi)}${Math.floor(n.midi / 12) - 1} · ${n.t.toFixed(2).replace('.', t('edit.decimal'))} s` : t('edit.hint');
  if (H.result && !recording) requestAnimationFrame(drawRoll);
}

export function initHum() {
  $('humRec').addEventListener('click', () => (H.rec ? stopMic() : startMic()));
  $('humFile').addEventListener('change', e => { openFile(e.target.files[0]); e.target.value = ''; });
  $('humPlay').addEventListener('click', listen);
  $('humAuto').addEventListener('click', () => { H.auto = !H.auto; stopListening(); analyse(true); render(); });
  $('humRhythm').addEventListener('click', () => { H.rhythm = !H.rhythm; stopListening(); analyse(true); render(); });
  $('humRoll').addEventListener('click', tapRoll);
  $('editUp').addEventListener('click', () => moveString(1));
  $('editDown').addEventListener('click', () => moveString(-1));
  $('editLeft').addEventListener('click', () => moveTime(-1));
  $('editRight').addEventListener('click', () => moveTime(1));
  $('editDelete').addEventListener('click', remove);
  $('editUndo').addEventListener('click', undo);
  $('humSave').addEventListener('click', () => {
    if (!H.result) return;
    const name = addSaved(asRecording(), t({ arquivo: 'hum.nameFile', musica: 'hum.nameSong' }[H.source] || 'hum.nameVoice'));
    status(t('hum.savedMsg', { name }));
  });
  $('humToLoop').addEventListener('click', () => {
    if (!H.result) return;
    stopListening();
    loadIntoLooper(asRecording());
    status(t('hum.toLoopMsg'));
    $('hRec').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('humDiscard').addEventListener('click', () => { stopListening(); H.result = null; H.raw = null; H.undo = []; H.sel = -1; status(t('hum.intro')); render(); });
  $('songFile').addEventListener('change', e => { openSong(e.target.files[0]); e.target.value = ''; });
  $('songStart').addEventListener('input', () => { stopPreview(); showClip(); });
  $('songPreview').addEventListener('click', preview);
  $('songGo').addEventListener('click', extract);
  $('songCancel').addEventListener('click', () => { stopPreview(); H.song = null; if (H.result) summary(); else status(t('hum.intro')); render(); });
  addEventListener('resize', () => { if (H.result) drawRoll(); });
  addEventListener('themechange', () => { if (H.result) drawRoll(); });
  render();
}
export function stopHum() { stopMic(); stopListening(); stopPreview(); }
