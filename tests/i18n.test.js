// Languages (v0.10): every language has every key of Portuguese, with the same placeholders,
// the plural functions run, and every built-in song's translation refers to a real song.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import pt from '../js/lang/pt.js';
import en from '../js/lang/en.js';
import es from '../js/lang/es.js';
import zh from '../js/lang/zh.js';
import { SONGBOOK } from '../js/songbook.js';

const holes = s => (typeof s === 'string' ? [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join() : 'fn');
const sample = { len: '4,0 s', n: 2, max: true, i: 1, muted: true, when: 'x', mode: 'Dórico', shift: -2, moved: 1, time: '1:00', fading: true, m: 10, round: 3 };

for (const [name, d] of Object.entries({ en, es, zh })) {
  test(`${name}: same keys and placeholders as Portuguese`, () => {
    for (const k of Object.keys(pt)) {
      assert.ok(k in d, `${name} lacks ${k}`);
      assert.equal(holes(d[k]), holes(pt[k]), `${name} ${k}`);
      if (typeof d[k] === 'function') assert.equal(typeof d[k](sample), 'string');
    }
  });
  test(`${name}: song translations refer to real songs`, () => {
    const names = new Set(SONGBOOK.map(s => s.name));
    for (const k of Object.keys(d).filter(k => k.startsWith('song:'))) assert.ok(names.has(k.slice(5)), `${name} ${k}`);
    for (const s of SONGBOOK) assert.ok(('song:' + s.name) in d, `${name} lacks a line for ${s.name}`);
  });
}
