// Runs the Basic Pitch model (vendor/) over a song, in the browser (v0.11). TensorFlow.js and the
// model (about 2 MB) are loaded only the first time a song is opened; the service worker keeps them
// in a cache of their own, so later it works offline too. The audio never leaves the device.

const BASE = new URL('../vendor/', import.meta.url);
const SCRIPTS = ['tfjs/tf-core.es2017.min.js', 'tfjs/tf-backend-cpu.es2017.min.js', 'tfjs/tf-backend-webgl.es2017.min.js', 'tfjs/tf-converter.es2017.min.js'];
export const MODEL_RATE = 22050;

let ready = null;
const script = src => new Promise((ok, fail) => {
  const s = document.createElement('script');
  s.src = new URL(src, BASE); s.onload = ok; s.onerror = () => fail(new Error('load ' + src));
  document.head.append(s);
});
// the model, loaded once; WebGL when the device has it, otherwise the (slower) CPU
export function loadModel() {
  if (!ready) {
    ready = (async () => {
      for (const s of SCRIPTS) await script(s);
      const tf = self.tf;
      try { if (!(await tf.setBackend('webgl'))) throw 0; } catch (e) { await tf.setBackend('cpu'); }
      await tf.ready();
      return tf.loadGraphModel(new URL('basic-pitch/model.json', BASE).href);
    })();
    ready.catch(() => { ready = null; }); // try again next time
  }
  return ready;
}

const HOPA = 256, NS = MODEL_RATE * 2 - HOPA, OV = 30 * HOPA, HOP = NS - OV, HALF = 15;
const OUT = ['Identity_1', 'Identity_2']; // frames, onsets (the contours are not used)

// 22050 Hz mono samples → { frames, onsets }: rows of 88 (one per 1/86 s), as melody.js wants.
// onProgress(0..1) after each 2 s window; the page stays responsive between windows.
export async function posteriors(x, onProgress = () => {}) {
  const model = await loadModel();
  const tf = self.tf;
  const n = Math.floor(x.length * Math.floor(MODEL_RATE / HOPA) / MODEL_RATE);
  const padded = new Float32Array(OV / 2 + x.length); padded.set(x, OV / 2);
  const windows = Math.max(1, Math.ceil(n / (NS / HOPA - 2 * HALF)));
  const out = { frames: [], onsets: [] };
  for (let w = 0, s = 0; out.frames.length < n && w < windows + 2; w++, s += HOP) {
    const win = new Float32Array(NS); win.set(padded.subarray(s, s + NS));
    const res = tf.tidy(() => model.execute(tf.tensor(win, [1, NS, 1]), OUT));
    const data = await Promise.all(res.map(r => r.data()));
    const [, T, F] = res[0].shape;
    res.forEach(r => r.dispose());
    for (let t = HALF; t < T - HALF && out.frames.length < n; t++) {
      out.frames.push(data[0].subarray(t * F, (t + 1) * F));
      out.onsets.push(data[1].subarray(t * F, (t + 1) * F));
    }
    onProgress(Math.min(1, out.frames.length / n));
    await new Promise(r => setTimeout(r, 0));
  }
  return out;
}
