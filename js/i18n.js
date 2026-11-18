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
