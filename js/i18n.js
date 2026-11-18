// Languages (v0.10): Portuguese (Brazil), English, Spanish and Chinese (Simplified).
// Every text on screen comes from the dictionaries in js/lang/. A text is a string with {name}
// placeholders, or a function (for plurals). Static HTML carries data-i18n keys (text),
// data-i18n-aria (aria-label) and data-i18n-ph (placeholder), filled by translatePage().
// The language is chosen once, from the saved choice or the device; changing it reloads the page.

import pt from './lang/pt.js';
import en from './lang/en.js';
import es from './lang/es.js';
import zh from './lang/zh.js';

export const LANGS = { pt: 'Português', en: 'English', es: 'Español', zh: '中文（简体）' };
// a small flag beside each language (inline SVG: flag emoji do not show on Windows)
export const FLAGS = {"pt": "<svg viewBox=\"0 0 30 20\" aria-hidden=\"true\"><rect width=\"30\" height=\"20\" fill=\"#009c3b\"/><path d=\"M15 2.5 27 10 15 17.5 3 10z\" fill=\"#ffdf00\"/><circle cx=\"15\" cy=\"10\" r=\"4.6\" fill=\"#002776\"/><path d=\"M10.6 9.2q4.6-1.6 8.8 1.4\" stroke=\"#fff\" stroke-width=\".9\" fill=\"none\"/></svg>", "en": "<svg viewBox=\"0 0 30 20\" aria-hidden=\"true\"><rect width=\"30\" height=\"20\" fill=\"#fff\"/><g fill=\"#b22234\"><rect width=\"30\" height=\"1.54\"/><rect y=\"3.08\" width=\"30\" height=\"1.54\"/><rect y=\"6.15\" width=\"30\" height=\"1.54\"/><rect y=\"9.23\" width=\"30\" height=\"1.54\"/><rect y=\"12.3\" width=\"30\" height=\"1.54\"/><rect y=\"15.4\" width=\"30\" height=\"1.54\"/><rect y=\"18.46\" width=\"30\" height=\"1.54\"/></g><rect width=\"12\" height=\"10.77\" fill=\"#3c3b6e\"/><g fill=\"#fff\"><circle cx=\"2.5\" cy=\"2.2\" r=\".55\"/><circle cx=\"6\" cy=\"2.2\" r=\".55\"/><circle cx=\"9.5\" cy=\"2.2\" r=\".55\"/><circle cx=\"4.2\" cy=\"4.3\" r=\".55\"/><circle cx=\"7.8\" cy=\"4.3\" r=\".55\"/><circle cx=\"2.5\" cy=\"6.4\" r=\".55\"/><circle cx=\"6\" cy=\"6.4\" r=\".55\"/><circle cx=\"9.5\" cy=\"6.4\" r=\".55\"/><circle cx=\"4.2\" cy=\"8.5\" r=\".55\"/><circle cx=\"7.8\" cy=\"8.5\" r=\".55\"/></g></svg>", "es": "<svg viewBox=\"0 0 30 20\" aria-hidden=\"true\"><rect width=\"30\" height=\"20\" fill=\"#aa151b\"/><rect y=\"5\" width=\"30\" height=\"10\" fill=\"#f1bf00\"/></svg>", "zh": "<svg viewBox=\"0 0 30 20\" aria-hidden=\"true\"><rect width=\"30\" height=\"20\" fill=\"#de2910\"/><path d=\"M5 2.2 6.2 5.8 2.4 3.6h5.2L3.8 5.8z\" fill=\"#ffde00\"/><g fill=\"#ffde00\"><circle cx=\"10\" cy=\"2\" r=\".8\"/><circle cx=\"12\" cy=\"4\" r=\".8\"/><circle cx=\"12\" cy=\"6.8\" r=\".8\"/><circle cx=\"10\" cy=\"8.8\" r=\".8\"/></g></svg>"};
const DICTS = { pt, en, es, zh };
const HTML_LANG = { pt: 'pt-BR', en: 'en', es: 'es', zh: 'zh-Hans' };
export const LOCALE = { pt: 'pt-BR', en: 'en-GB', es: 'es', zh: 'zh-CN' };

function saved() { try { return JSON.parse(localStorage.getItem('lira-lang')); } catch (e) { return null; } }
// the device's language, or English when the Lira does not speak it
function fromDevice() {
  for (const l of navigator.languages || [navigator.language || '']) {
    const k = String(l).toLowerCase().slice(0, 2);
    if (DICTS[k]) return k;
  }
  return 'en';
}
export const lang = DICTS[saved()] ? saved() : fromDevice();
document.documentElement.lang = HTML_LANG[lang];

export function t(key, vars = {}) {
  let s = DICTS[lang][key] ?? pt[key];
  if (s === undefined) return key;
  if (typeof s === 'function') return s(vars);
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}
export const has = key => DICTS[lang][key] !== undefined;
// A built-in song's name and origin: the songbook's own (Portuguese) unless the language has
// its own under 'song:<Portuguese name>' as [name, origin]; a name may stay the original.
export function songText(s) {
  const tr = DICTS[lang]['song:' + s.name];
  return tr ? { name: tr[0] || s.name, from: tr[1] || s.from } : { name: s.name, from: s.from };
}

export function setLang(l) {
  if (!DICTS[l] || l === lang) return;
  try { localStorage.setItem('lira-lang', JSON.stringify(l)); } catch (e) { /* ignore */ }
  location.reload();
}

// Note names under the strings: Dó Ré Mi in Portuguese, Do Re Mi in Spanish, C D E elsewhere.
const NAMES = {
  pt: ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'],
  es: ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'],
  en: ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'],
};
export const noteName = midi => (NAMES[lang] || NAMES.en)[midi % 12];

export function translatePage(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  root.querySelectorAll('[data-i18n-ph]').forEach(el => el.setAttribute('placeholder', t(el.dataset.i18nPh)));
  document.title = t('app.title');
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', t('app.description'));
}
