// Songs: public-domain melodies to listen to or play along with.
// "Tocar junto" lights the next string and waits for it; "Ouvir" plays the melody.
// Melodies are written as [string index, beats] on the Ionian (major) layout from Ré 3:
// index 7 = Ré 4 (the tonic), 8 = Mi, 9 = Fá♯, 10 = Sol, 11 = Lá, 12 = Si, 4 = Lá 3.

import { $, state, audio, now, play, onPluck, guide, setMode } from './core.js';

const q = (...xs) => xs.map(x => (Array.isArray(x) ? x : [x, 1]));

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

let song = 0, mode = 'idle', pos = 0; // idle | listen | along
let timers = [];
const BEAT = 0.55; // seconds per beat when listening

function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function stopAll() { timers.forEach(clearTimeout); timers = []; guide([]); }

function ensureMajor() {
  if (state.modeKey !== 'jonio') {
    setMode('jonio');
    $('songNote').hidden = false;
  }
}

function listen() {
  if (!audio()) return;
  stopAll();
  ensureMajor();
  mode = 'listen';
  let t = 0.3;
  const t0 = now();
  for (const [i, beats] of SONGS[song].notes) {
    const at = t;
    play(state.notes[i], t0 + at, 0.5);
    later(() => guide([i]), at * 1000);
    t += beats * BEAT;
  }
  later(() => { guide([]); mode = 'idle'; render('Fim. Que tal tocar junto?'); }, t * 1000 + 200);
  render('Ouvindo… as cordas acendem conforme a melodia.');
}

function along() {
  if (!audio()) return;
  stopAll();
  ensureMajor();
  mode = 'along';
  pos = 0;
  guide([SONGS[song].notes[0][0]]);
  render(progressText());
}

const progressText = () => `Toque a corda acesa · nota ${pos + 1} de ${SONGS[song].notes.length}`;

onPluck(i => {
  if (mode !== 'along') return;
  const notes = SONGS[song].notes;
  if (i !== notes[pos][0]) { render('Essa não: toque a corda acesa.'); return; }
  pos++;
  if (pos >= notes.length) {
    mode = 'idle';
    guide([]);
    render(`Muito bem! Você tocou "${SONGS[song].name}" inteira.`);
    return;
  }
  guide([notes[pos][0]]);
  render(progressText());
});

function render(msg) {
  if (msg) $('songStatus').textContent = msg;
  document.querySelectorAll('[data-song]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.song === song));
  $('songFrom').textContent = SONGS[song].from;
}

export function initSongs() {
  const box = $('songList');
  SONGS.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.song = i;
    b.textContent = s.name;
    b.addEventListener('click', () => { song = i; stopAll(); mode = 'idle'; render('Escolha ouvir ou tocar junto.'); });
    box.appendChild(b);
  });
  $('songListen').addEventListener('click', listen);
  $('songAlong').addEventListener('click', along);
  render('Escolha uma canção. "Ouvir" toca a melodia; "Tocar junto" acende a próxima corda e espera você.');
}

export function stopSongs() {
  stopAll();
  mode = 'idle';
}
