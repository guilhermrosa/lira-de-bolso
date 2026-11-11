// Learn mode: a musical memory game. The lyre plays a short phrase, lighting its strings;
// the player repeats it. Each correct round adds one note.

import { $, store, state, audio, now, play, onPluck, guide } from './core.js';

const RANGE = [4, 11];       // strings used: a comfortable middle octave
const START_LEN = 3;
let seq = [], pos = 0, phase = 'idle'; // idle | listen | your-turn | over
let best = store.get('learn-best', 0);
let timers = [];

// the pentatonic scale has fewer strings, so the range follows the strings on screen
const rnd = () => {
  const hi = Math.min(RANGE[1], state.notes.length - 1);
  return RANGE[0] + Math.floor(Math.random() * (hi - RANGE[0] + 1));
};
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function clearTimers() { timers.forEach(clearTimeout); timers = []; }

function playSequence() {
  phase = 'listen';
  render(`Ouça: ${seq.length} notas.`);
  const gap = Math.max(0.32, 0.55 - seq.length * 0.015);
  const t0 = now() + 0.5;
  seq.forEach((i, k) => {
    play(state.notes[i], t0 + k * gap, 0.55);
    later(() => guide([i]), (0.5 + k * gap) * 1000);
    later(() => guide([]), (0.5 + k * gap + gap * 0.8) * 1000);
  });
  later(() => { phase = 'your-turn'; pos = 0; render('Sua vez: repita nas cordas.'); }, (0.5 + seq.length * gap + 0.2) * 1000);
}

function newGame() {
  if (!audio()) return;
  clearTimers();
  seq = Array.from({ length: START_LEN }, rnd);
  playSequence();
}

onPluck(i => {
  if (phase !== 'your-turn') return;
  if (i === seq[pos]) {
    pos++;
    if (pos === seq.length) {
      phase = 'listen';
      const round = seq.length - START_LEN + 1;
      if (round > best) { best = round; store.set('learn-best', best); }
      render(`Isso! Rodada ${round} completa.`);
      seq.push(rnd());
      later(playSequence, 1100);
    }
  } else {
    phase = 'over';
    clearTimers();
    const round = seq.length - START_LEN;
    guide([seq[pos]]);
    later(() => guide([]), 1400);
    render(`Era a corda acesa. Você completou ${round} ${round === 1 ? 'rodada' : 'rodadas'}.`);
  }
});

function render(msg) {
  if (msg) $('learnStatus').textContent = msg;
  $('learnBest').textContent = best ? `Melhor: ${best} ${best === 1 ? 'rodada' : 'rodadas'}` : 'Ainda sem recorde';
  $('learnBtn').textContent = phase === 'idle' ? 'Começar' : 'Recomeçar';
}

export function initLearn() {
  $('learnBtn').addEventListener('click', newGame);
  render('A lira toca uma frase curta e acende as cordas. Repita na mesma ordem; a cada acerto a frase ganha uma nota.');
}
export function stopLearn() {
  clearTimers();
  guide([]);
  if (phase !== 'idle') { phase = 'idle'; render('Jogo interrompido. Toque em "Começar" para jogar de novo.'); }
}
