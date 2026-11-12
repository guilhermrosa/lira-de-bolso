// Every built-in melody must be playable: each note on one of the 15 strings of its scale
// (from Ré 3), and every name unique.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SONGBOOK, parseMelody } from '../js/songbook.js';
import { scaleNotes, MODES, NOTE_NAMES } from '../js/lyre.js';

const ROOT = 50; // Ré 3, as in core.js

for (const song of SONGBOOK) {
  test(song.name, () => {
    assert.ok(MODES[song.mode], 'unknown scale ' + song.mode);
    assert.ok(song.beat > 0.2 && song.beat < 1.5, 'odd tempo');
    const strings = scaleNotes(ROOT, song.mode);
    const notes = parseMelody(song.mel);
    assert.ok(notes.length >= 10);
    for (const [midi, beats] of notes) {
      const name = NOTE_NAMES[midi % 12] + Math.floor(midi / 12 - 1);
      assert.ok(strings.includes(midi), `${name} is not on the ${MODES[song.mode].name} strings`);
      assert.ok(beats > 0 && beats <= 6);
    }
  });
}

test('names are unique', () => {
  assert.equal(new Set(SONGBOOK.map(s => s.name)).size, SONGBOOK.length);
});
