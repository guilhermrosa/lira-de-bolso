// Relax mode: a gentle generative melody over a bass on the downbeat, with an optional timer
// that fades the volume out over the last minute and then stops.

import { $, state, audio, now, play, setVolume, FULL_VOLUME, MODES } from './core.js';

const TIMERS = [0, 10, 20, 30, 60]; // minutes; 0 = no limit
let minutes = 20;
let on = false, timer = null, clock = null, nextT = 0, step = 0, melody = 9;
let endsAt = 0, fading = false;
const BPM = 66, EIGHTH = 60 / BPM / 2;

function schedule() {
  const notes = state.notes, steps = MODES[state.modeKey].steps, per = steps.length, n = notes.length;
  while (nextT < now() + 0.3) {
    const bar = Math.floor(step / 8), beat = step % 8;
    if (beat === 0) {
      const fifth = steps.indexOf(7);
      const bassDeg = (bar % 4 === 2 && fifth >= 0) ? fifth : 0;
      play(notes[bassDeg], nextT, 0.45, { sustain: Math.max(state.P.sustain, 70) });
    }
    if (beat === 4 && bar % 2 === 1) play(notes[2], nextT, 0.26);
    const resolve = bar % 4 === 3 && beat >= 6;
    if (resolve) {
      if (beat === 6) play(notes[per], nextT, 0.36);
    } else if (Math.random() > 0.42) { // sparser than the play tab's music: calmer
      melody += [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
      melody = Math.max(per - 2, Math.min(n - 1, melody));
      play(notes[melody], nextT, beat % 2 ? 0.26 : 0.33);
    }
    nextT += EIGHTH * (beat % 2 ? 0.92 : 1.08);
    step++;
  }
}

const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function tickClock() {
  if (!on) return;
  if (!endsAt) { $('relaxLeft').textContent = 'Sem limite de tempo'; return; }
  const left = Math.max(0, endsAt - Date.now() / 1000);
  $('relaxLeft').textContent = left > 0 ? `${mmss(left)} restantes${fading ? ' · diminuindo o volume' : ''}` : 'Terminando…';
  if (!fading && left <= 60) { fading = true; setVolume(0, left); }
  if (left <= 0) stop();
}

export function start() {
  if (!audio()) return;
  on = true;
  fading = false;
  setVolume(FULL_VOLUME);
  nextT = now() + 0.1;
  step = 0;
  melody = MODES[state.modeKey].steps.length + 2;
  clearInterval(timer);
  timer = setInterval(schedule, 80);
  schedule();
  endsAt = minutes ? Date.now() / 1000 + minutes * 60 : 0;
  clearInterval(clock);
  clock = setInterval(tickClock, 500);
  tickClock();
  render();
}

export function stop() {
  on = false;
  clearInterval(timer);
  clearInterval(clock);
  if (fading) setTimeout(() => { if (!on) setVolume(FULL_VOLUME); }, 400);
  fading = false;
  render();
}

export const isOn = () => on;

function render() {
  $('relaxBtn').textContent = on ? 'Parar' : 'Começar';
  $('relaxBtn').classList.toggle('primary', !on);
  if (!on) $('relaxLeft').textContent = minutes ? `Toca por ${minutes} minutos e diminui o volume no último.` : 'Toca até você parar.';
  document.querySelectorAll('[data-min]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.min === minutes));
}

export function initRelax() {
  const box = $('relaxTimers');
  for (const m of TIMERS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.min = m;
    b.textContent = m ? `${m} min` : 'Sem limite';
    b.addEventListener('click', () => {
      minutes = m;
      if (on) { endsAt = m ? Date.now() / 1000 + m * 60 : 0; if (fading) { fading = false; setVolume(FULL_VOLUME, 1); } tickClock(); }
      render();
    });
    box.appendChild(b);
  }
  $('relaxBtn').addEventListener('click', () => (on ? stop() : start()));
  render();
}
