// Learn mode: a musical memory game. The lyre plays a short phrase, lighting its strings;
// the player repeats it. Each correct round adds one note.

import { t } from './i18n.js';
import { $, store, state, audio, phrase, onPluck, guide } from './core.js';

const RANGE = [4, 11];       // strings used: a comfortable middle octave
const START_LEN = 3;
let seq = [], pos = 0, phase = 'idle'; // idle | listen | your-turn | over
let best = store.get('learn-best', 0);
let timers = [];
let cancelPhrase = () => {};

// the pentatonic scale has fewer strings, so the range follows the strings on screen
const rnd = () => {
  const hi = Math.min(RANGE[1], state.notes.length - 1);
  return RANGE[0] + Math.floor(Math.random() * (hi - RANGE[0] + 1));
};
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function clearTimers() { timers.forEach(clearTimeout); timers = []; cancelPhrase(); cancelPhrase = () => {}; }

function playSequence() {
  phase = 'listen';
  render(t('learn.listen', { n: seq.length }));
  const gap = Math.max(0.32, 0.55 - seq.length * 0.015);
  const items = seq.map((i, k) => ({
    t: 0.4 + k * gap, midi: state.notes[i], vel: 0.55,
    onStart: () => { guide([i]); later(() => guide([]), gap * 800); },
  }));
  cancelPhrase = phrase(items, () => { phase = 'your-turn'; pos = 0; render(t('learn.yourTurn')); });
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
      render(t('learn.right', { round }));
      seq.push(rnd());
      later(playSequence, 1100);
    }
  } else {
    phase = 'over';
    clearTimers();
    const round = seq.length - START_LEN;
    guide([seq[pos]]);
    later(() => guide([]), 1400);
    render(t('learn.wrong', { round }));
  }
});

function render(msg) {
  if (msg) $('learnStatus').textContent = msg;
  $('learnBest').textContent = best ? t('learn.best', { n: best }) : t('learn.noBest');
  $('learnBtn').textContent = phase === 'idle' ? t('learn.start') : t('learn.restart');
}

export function initLearn() {
  $('learnBtn').addEventListener('click', newGame);
  render(t('learn.intro'));
}
export function stopLearn() {
  clearTimers();
  guide([]);
  if (phase !== 'idle') { phase = 'idle'; render(t('learn.stopped')); }
}
