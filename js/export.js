// Turn a recording into an audio file (WAV) and hand it to the phone's share sheet
// (WhatsApp, Files…) or download it. The lyre is rendered offline, faster than real time,
// with the timbre saved in the recording.

import { createLyre, PRESETS } from './lyre.js';

const RATE = 44100;

// How many turns of the loop go into the file: at least 2, about 20 s, at most 60 s.
function turnsFor(loopLen) {
  return Math.max(2, Math.min(Math.floor(60 / loopLen), Math.ceil(20 / loopLen)));
}

export async function renderRecording(rec) {
  const turns = turnsFor(rec.loopLen);
  const tail = 2.5; // let the last notes and the echo ring out
  const seconds = rec.loopLen * turns + tail;
  const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ac = new Off(1, Math.ceil(seconds * RATE), RATE);
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 3;
  comp.connect(ac.destination);
  const out = ac.createGain();
  out.gain.value = 0.8;
  out.connect(comp);
  const lyre = createLyre(ac, out, { ...PRESETS.ruina, ...(rec.params || {}) });
  for (let k = 0; k < turns; k++) {
    for (const layer of rec.layers) {
      if (layer.muted) continue;
      for (const n of layer.notes) lyre.pluck(n.midi, 0.05 + k * rec.loopLen + n.t, n.vel ?? 0.5);
    }
  }
  const buffer = await ac.startRendering();
  return encodeWav(buffer);
}

function encodeWav(buffer) {
  const data = buffer.getChannelData(0);
  const bytes = 44 + data.length * 2;
  const view = new DataView(new ArrayBuffer(bytes));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); view.setUint32(4, bytes - 8, true); str(8, 'WAVE');
  str(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, RATE, true); view.setUint32(28, RATE * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  str(36, 'data'); view.setUint32(40, data.length * 2, true);
  let o = 44;
  for (let i = 0; i < data.length; i++, o += 2) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: 'audio/wav' });
}

const safeName = name => (name || 'gravacao').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'gravacao';

// Share when the device can share files (phones), otherwise download.
// Returns 'shared', 'downloaded' or 'cancelled'.
export async function shareOrDownload(blob, name) {
  const filename = `${safeName(name)}.wav`;
  const file = new File([blob], filename, { type: 'audio/wav' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
      // sharing failed for another reason: fall back to a download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'downloaded';
}
