// "Da sua voz para a lira" (v0.7): hum, sing or whistle into the microphone (or open an audio file
// with one voice) and the lyre plays it back; the result can be saved as a recording or taken into
// the layered recorder. Everything happens on the device: the sound is analysed here (pitch.js)
// and never sent anywhere.

import { $, state, audio, phrase, setMode, MODES } from './core.js';
import { transcribe, stringsOf, ANALYSIS_RATE } from './pitch.js';
import { addSaved, loadIntoLooper } from './looper.js';

const MAX_SECONDS = 30;
const H = { rec: null, samples: null, result: null, stopPlay: null, auto: true, rhythm: true, source: '' };

const status = text => { $('humStatus').textContent = text; };

// Any audio (a recorded clip or a file) → mono samples at the analysis rate, at most MAX_SECONDS
// (files: the first 60 s). The browser's own resampler does the work.
async function toSamples(arrayBuffer, limit) {
  const ac = audio();
  const buf = await ac.decodeAudioData(arrayBuffer);
  const len = Math.min(buf.length, Math.floor(limit * buf.sampleRate));
  const off = new OfflineAudioContext(1, Math.ceil(len / buf.sampleRate * ANALYSIS_RATE), ANALYSIS_RATE);
  const src = off.createBufferSource();
  src.buffer = buf;
  src.connect(off.destination);
  src.start();
  return (await off.startRendering()).getChannelData(0);
}

// ---- microphone ----
async function startMic() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    status('Este navegador não deixa gravar a voz. Tente "Abrir áudio" com um arquivo gravado no celular.');
    return;
  }
  const ac = audio();
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } });
  } catch (e) {
    status('Sem acesso ao microfone. Para gravar, permita o microfone para este site nas configurações do navegador.');
    return;
  }
  stopListening();
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
    status(`Gravando… ${Math.floor(s)} s de ${MAX_SECONDS}. Aperte "Parar" quando terminar.`);
    if (s >= MAX_SECONDS) { stopMic(); return; }
    H.rec.timer = requestAnimationFrame(meter);
  };
  rec.onstop = async () => {
    stream.getTracks().forEach(t => t.stop());
    mic.disconnect();
    $('humLevel').style.setProperty('--p', 0);
    status('Ouvindo as notas…');
    try {
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      H.samples = await toSamples(await blob.arrayBuffer(), MAX_SECONDS);
      H.source = 'voz';
      analyse();
    } catch (e) { status('Não consegui ler a gravação neste navegador.'); }
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
  stopListening();
  status('Ouvindo as notas…');
  try {
    H.samples = await toSamples(await file.arrayBuffer(), 60);
    H.source = 'arquivo';
    analyse();
  } catch (e) {
    status('Não consegui abrir esse arquivo. Tente um áudio comum (mp3, m4a, wav, ogg).');
  }
  render();
}

// ---- analysis ----
function analyse() {
  if (!H.samples) return;
  H.result = transcribe(H.samples, ANALYSIS_RATE, { prefer: state.modeKey, autoMode: H.auto, rhythm: H.rhythm });
  if (!H.result) {
    status('Não encontrei uma melodia. Cante mais perto do celular, num lugar quieto, uma nota de cada vez.');
    return;
  }
  const r = H.result, n = r.notes.length;
  status(`${n} ${n === 1 ? 'nota' : 'notas'} em ${MODES[r.mode].name}${r.shift ? `, ${Math.abs(r.shift)} ${Math.abs(r.shift) === 1 ? 'semitom' : 'semitons'} ${r.shift > 0 ? 'acima' : 'abaixo'} do que foi cantado` : ''}.${r.moved ? ` ${r.moved} ${r.moved === 1 ? 'nota ficava fora das cordas e foi para a mais próxima' : 'notas ficavam fora das cordas e foram para as mais próximas'}.` : ''}`);
}

function listen() {
  if (!H.result) return;
  if (H.stopPlay) { stopListening(); return; }
  setMode(H.result.mode);
  H.stopPlay = phrase(H.result.notes.map(n => ({ t: n.t, midi: n.midi, vel: n.vel })), () => { H.stopPlay = null; render(); });
  render();
}
function stopListening() { if (H.stopPlay) { H.stopPlay(); H.stopPlay = null; render(); } }

const asRecording = () => ({
  loopLen: H.result.loopLen,
  layers: [{ notes: H.result.notes, muted: false }],
  mode: H.result.mode, preset: state.presetKey, params: { ...state.P },
});

// ---- drawing: the melody on the lyre's strings, a row per string, low at the bottom ----
function drawRoll() {
  const cv = $('humRoll'), r = H.result;
  if (!r) return;
  const dpr = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const strings = stringsOf(r.mode), rows = strings.length, rowH = h / rows;
  ctx.fillStyle = css.getPropertyValue('--black'); ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = css.getPropertyValue('--clay-deep');
  for (let i = 0; i < rows; i++) { const y = h - (i + 0.5) * rowH; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  const k = (w - 8) / r.loopLen;
  ctx.fillStyle = css.getPropertyValue('--cream');
  r.notes.forEach((n, j) => {
    const i = strings.indexOf(n.midi), next = r.notes[j + 1];
    const len = Math.max(6, ((next ? next.t : r.loopLen - 0.3) - n.t) * k - 3);
    ctx.fillRect(4 + n.t * k, h - (i + 1) * rowH + 2, len, Math.max(3, rowH - 4));
  });
}

function render() {
  const recording = !!H.rec;
  $('humRec').textContent = recording ? 'Parar' : 'Gravar voz';
  $('humRec').classList.toggle('recording', recording);
  $('humFileBtn').classList.toggle('disabled', recording);
  $('humResult').hidden = !H.result || recording;
  $('humPlay').textContent = H.stopPlay ? 'Parar' : 'Ouvir';
  $('humAuto').setAttribute('aria-pressed', H.auto);
  $('humRhythm').setAttribute('aria-pressed', H.rhythm);
  if (H.result && !recording) requestAnimationFrame(drawRoll);
}

export function initHum() {
  $('humRec').addEventListener('click', () => (H.rec ? stopMic() : startMic()));
  $('humFile').addEventListener('change', e => { openFile(e.target.files[0]); e.target.value = ''; });
  $('humPlay').addEventListener('click', listen);
  $('humAuto').addEventListener('click', () => { H.auto = !H.auto; stopListening(); analyse(); render(); });
  $('humRhythm').addEventListener('click', () => { H.rhythm = !H.rhythm; stopListening(); analyse(); render(); });
  $('humSave').addEventListener('click', () => {
    if (!H.result) return;
    const name = addSaved(asRecording(), H.source === 'arquivo' ? 'Do arquivo' : 'Da voz');
    status(`"${name}" salva em Gravações salvas (dá para renomear lá). Também aparece em Canções, em "Suas gravações".`);
  });
  $('humToLoop').addEventListener('click', () => {
    if (!H.result) return;
    stopListening();
    loadIntoLooper(asRecording());
    status('A melodia virou a primeira camada do gravador acima: grave outras camadas por cima.');
    $('hRec').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('humDiscard').addEventListener('click', () => { stopListening(); H.result = null; H.samples = null; status('Cantarole, cante ou assobie uma melodia (até 30 s) e a lira toca de volta.'); render(); });
  addEventListener('resize', () => { if (H.result) drawRoll(); });
  render();
}
export function stopHum() { stopMic(); stopListening(); }
