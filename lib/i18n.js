// Translations via chrome.i18n (_locales/<language>/messages.json)

export function t(key, ...substitutions) {
  return globalThis.chrome?.i18n?.getMessage(key, substitutions.map(String)) || key;
}

export function uiLanguage() {
  return globalThis.chrome?.i18n?.getUILanguage?.() ?? 'en';
}

export function isGerman() {
  return uiLanguage().toLowerCase().startsWith('de');
}

// Translates static text: data-i18n (text), data-i18n-html (text with markup from messages.json)
// and data-i18n-<attribute> (e.g. data-i18n-title, data-i18n-placeholder, data-i18n-data-empty)
const ATTRIBUTES = ['title', 'placeholder', 'aria-label', 'alt', 'data-empty'];

function localizeTree(root) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const attr of ATTRIBUTES) {
    for (const el of root.querySelectorAll(`[data-i18n-${attr}]`)) {
      el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`)));
    }
  }
}

export function localizeDocument() {
  document.documentElement.lang = uiLanguage();
  localizeTree(document);
  for (const template of document.querySelectorAll('template')) localizeTree(template.content);
}
