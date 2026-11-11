// Songs: public-domain melodies, plus your own saved recordings, to listen to or play along with.
// "Tocar junto" lights the next string and waits for it; "Ouvir" plays the melody.
// Built-in melodies are written as [string index, beats] on the Ionian (major) layout from Ré 3:
// index 7 = Ré 4 (the tonic), 8 = Mi, 9 = Fá♯, 10 = Sol, 11 = Lá, 12 = Si, 4 = Lá 3.

import { $, ROOT, store, state, audio, phrase, onPluck, guide, setMode, MODES } from './core.js';
import { scaleNotes } from './lyre.js';

const q = (...xs) => xs.map(x => (Array.isArray(x) ? x : [x, 1]));
const BEAT = 0.55; // seconds per beat for the built-in melodies

export const SONGS = [
  {
    name: 'Brilha, Brilha, Estrelinha', from: 'Melodia tradicional francesa',
    notes: q(7, 7, 11, 11, 12, 12, [11, 2], 10, 10, 9, 9, 8, 8, [7, 2],
      11, 11, 10, 10, 9, 9, [8, 2], 11, 11, 10, 10, 9, 9, [8, 2],
      7, 7, 11, 11, 12, 12, [11, 2], 10, 10, 9, 9, 8, 8, [7, 2]),
  },
  {
    name: 'Ode à Alegria', from: 'Beethoven, 9ª Sinfonia',
    notes: q(9, 9, 10, 11, 11, 10, 9, 8, 7, 7, 8, 9, [9, 1.5], [8, 0.5], [8, 2],
      9, 9, 10, 11, 11, 10, 9, 8, 7, 7, 8, 9, [8, 1.5], [7, 0.5], [7, 2]),
  },
  {
    name: 'Frère Jacques', from: 'Cânone tradicional francês',
    notes: q(7, 8, 9, 7, 7, 8, 9, 7, 9, 10, [11, 2], 9, 10, [11, 2],
      [11, 0.5], [12, 0.5], [11, 0.5], [10, 0.5], 9, 7, [11, 0.5], [12, 0.5], [11, 0.5], [10, 0.5], 9, 7,
      7, 4, [7, 2], 7, 4, [7, 2]),
  },
  {
    name: 'Mary Had a Little Lamb', from: 'Canção infantil tradicional',
    notes: q(9, 8, 7, 8, 9, 9, [9, 2], 8, 8, [8, 2], 9, 11, [11, 2],
      9, 8, 7, 8, 9, 9, 9, 9, 8, 8, 9, 8, [7, 4]),
  },
];

// Everything playable as one shape: { key, name, from, mode, seq: [[midi, seconds until next]] }
function builtIn() {
  const strings = scaleNotes(ROOT, 'jonio');
  return SONGS.map((s, i) => ({
    key: 'b' + i, name: s.name, from: s.from, mode: 'jonio',
    seq: s.notes.map(([idx, beats]) => [strings[idx], beats * BEAT]),
  }));
}
// A saved recording becomes one melody: all its layers merged in time order, one turn of the loop.
function fromRecordings() {
  return store.get('loops', []).map((r, i) => {
    const notes = r.layers.filter(l => !l.muted).flatMap(l => l.notes).sort((a, b) => a.t - b.t);
    const seq = notes.map((n, k) => [n.midi, (k + 1 < notes.length ? notes[k + 1].t : r.loopLen) - n.t]);
    return { key: 'r' + i, name: r.name, from: `Sua gravação · escala ${MODES[r.mode]?.name || ''}`, mode: MODES[r.mode] ? r.mode : 'dorico', seq };
  }).filter(s => s.seq.length);
}

let list = [], current = null, mode = 'idle', pos = 0; // idle | listen | along
let cancel = () => {};

function stopAll() { cancel(); cancel = () => {}; guide([]); }

function ensureMode(m) {
  if (state.modeKey !== m) {
    setMode(m);
    $('songNote').textContent = `Esta melodia usa a escala ${MODES[m].name}; a escala foi trocada. Você pode mudá-la de volta em "Tocar".`;
    $('songNote').hidden = false;
  }
}
const indexOf = midi => state.notes.indexOf(midi);

function listen() {
  if (!audio() || !current) return;
  stopAll();
  ensureMode(current.mode);
  mode = 'listen';
  let t = 0.2;
  const items = current.seq.map(([midi, secs]) => {
    const i = indexOf(midi);
    const it = { t, midi, vel: 0.5, onStart: () => guide(i >= 0 ? [i] : []) };
    t += Math.max(0.08, secs);
    return it;
  });
  cancel = phrase(items, () => { guide([]); mode = 'idle'; render('Fim. Que tal tocar junto?'); });
  render('Ouvindo… as cordas acendem conforme a melodia.');
}

function along() {
  if (!audio() || !current) return;
  stopAll();
  ensureMode(current.mode);
  mode = 'along';
  pos = 0;
  guide([indexOf(current.seq[0][0])]);
  render(progressText());
}

const progressText = () => `Toque a corda acesa · nota ${pos + 1} de ${current.seq.length}`;

onPluck(i => {
  if (mode !== 'along') return;
  if (i !== indexOf(current.seq[pos][0])) { render('Essa não: toque a corda acesa.'); return; }
  pos++;
  if (pos >= current.seq.length) {
    mode = 'idle';
    guide([]);
    render(`Muito bem! Você tocou "${current.name}" inteira.`);
    return;
  }
  guide([indexOf(current.seq[pos][0])]);
  render(progressText());
});

function render(msg) {
  if (msg) $('songStatus').textContent = msg;
  document.querySelectorAll('[data-song]').forEach(b => b.setAttribute('aria-pressed', current && b.dataset.song === current.key));
  $('songFrom').textContent = current ? current.from : '';
}

function chip(s) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.dataset.song = s.key;
  b.textContent = s.name;
  b.addEventListener('click', () => { current = s; stopAll(); mode = 'idle'; render('Escolha ouvir ou tocar junto.'); });
  return b;
}

// Rebuilds the lists; called on start and whenever the tab opens (recordings may have changed).
export function refreshSongs() {
  const mine = fromRecordings();
  list = [...builtIn(), ...mine];
  if (!current || !list.some(s => s.key === current.key && s.name === current.name)) current = list[0];
  else current = list.find(s => s.key === current.key);
  $('songList').replaceChildren(...list.filter(s => s.key[0] === 'b').map(chip));
  $('mySongs').replaceChildren(...mine.map(chip));
  $('mySongsEmpty').hidden = mine.length > 0;
  render();
}

export function initSongs() {
  $('songListen').addEventListener('click', listen);
  $('songAlong').addEventListener('click', along);
  refreshSongs();
  render('Escolha uma melodia. "Ouvir" toca; "Tocar junto" acende a próxima corda e espera você.');
}

export function stopSongs() {
  stopAll();
  mode = 'idle';
}
