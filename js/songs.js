// Songs: public-domain melodies, plus your own saved recordings, to listen to or play along with.
// "Tocar junto" lights the next string and waits for it; "Ouvir" plays the melody.
// Built-in melodies live in songbook.js (note names, scale and tempo per melody).

import { t, songText } from './i18n.js';
import { $, store, state, audio, phrase, onPluck, guide, setMode, MODES } from './core.js';
import { SONGBOOK, GROUPS, parseMelody } from './songbook.js';

// Everything playable as one shape: { key, name, from, mode, seq: [[midi, seconds until next]] }
function builtIn() {
  return SONGBOOK.map((s, i) => ({
    key: 'b' + i, ...songText(s), mode: s.mode, group: s.group,
    seq: parseMelody(s.mel).map(([midi, beats]) => [midi, beats * s.beat]),
  }));
}
// A saved recording becomes one melody: all its layers merged in time order, one turn of the loop.
function fromRecordings() {
  return store.get('loops', []).map((r, i) => {
    const notes = r.layers.filter(l => !l.muted).flatMap(l => l.notes).sort((a, b) => a.t - b.t);
    const seq = notes.map((n, k) => [n.midi, (k + 1 < notes.length ? notes[k + 1].t : r.loopLen) - n.t]);
    return { key: 'r' + i, name: r.name, from: t('songs.fromMine', { mode: MODES[r.mode] ? t('mode.' + r.mode) : '' }), mode: MODES[r.mode] ? r.mode : 'dorico', seq };
  }).filter(s => s.seq.length);
}

let list = [], current = null, mode = 'idle', pos = 0; // idle | listen | along
let cancel = () => {};

function stopAll() { cancel(); cancel = () => {}; guide([]); }

function ensureMode(m) {
  if (state.modeKey !== m) {
    setMode(m);
    $('songNote').textContent = t('songs.modeChanged', { mode: t('mode.' + m) });
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
  cancel = phrase(items, () => { guide([]); mode = 'idle'; render(t('songs.end')); });
  render(t('songs.listening'));
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

const progressText = () => t('songs.progress', { i: pos + 1, n: current.seq.length });

onPluck(i => {
  if (mode !== 'along') return;
  if (i !== indexOf(current.seq[pos][0])) { render(t('songs.notThat')); return; }
  pos++;
  if (pos >= current.seq.length) {
    mode = 'idle';
    guide([]);
    render(t('songs.done', { name: current.name }));
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
  b.addEventListener('click', () => { current = s; stopAll(); mode = 'idle'; render(t('songs.pick')); });
  return b;
}

// Rebuilds the lists; called on start and whenever the tab opens (recordings may have changed).
export function refreshSongs() {
  const mine = fromRecordings();
  list = [...builtIn(), ...mine];
  if (!current || !list.some(s => s.key === current.key && s.name === current.name)) current = list[0];
  else current = list.find(s => s.key === current.key);
  $('songList').replaceChildren(...GROUPS.flatMap(g => {
    const songs = list.filter(s => s.key[0] === 'b' && s.group === g.key);
    if (!songs.length) return [];
    const h = document.createElement('h3');
    h.className = 'sub';
    h.textContent = t('group.' + g.key);
    const box = document.createElement('div');
    box.className = 'chips';
    box.append(...songs.map(chip));
    return [h, box];
  }));
  $('mySongs').replaceChildren(...mine.map(chip));
  $('mySongsEmpty').hidden = mine.length > 0;
  render();
}

export function initSongs() {
  $('songListen').addEventListener('click', listen);
  $('songAlong').addEventListener('click', along);
  refreshSongs();
  render(t('songs.intro'));
}

export function stopSongs() {
  stopAll();
  mode = 'idle';
}
