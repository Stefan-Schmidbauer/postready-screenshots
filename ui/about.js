// About dialog, shared by the popup and the settings page. It is built on first use, so the
// pages need no markup for it; the version comes straight from the manifest so it never drifts.

import { t } from '../lib/i18n.js';

const REPO_URL = 'https://github.com/Stefan-Schmidbauer/postready-screenshots';
const STORE_URL = 'https://chromewebstore.google.com/detail/postready-screenshots/jgplipgmkfmcknlpakfaoihdhafcgpfi';
const FEEDBACK_URL = 'mailto:support@ancroo.com?subject=PostReady%20Feedback';

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

// One line of a group: label left, value right. With `href` the whole line is a link.
function row(label, value, { href, kind = '' } = {}) {
  const props = { className: 'about-row' };
  if (href) Object.assign(props, { href }, href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener' });
  return el(
    href ? 'a' : 'div',
    props,
    el('span', { className: 'about-label' }, label),
    el('span', { className: `about-value ${kind}` }, value),
  );
}

const group = (...rows) => el('div', { className: 'about-group' }, ...rows);
const actions = (...rows) => el('div', { className: 'about-group about-actions' }, ...rows);

function build() {
  const close = el('button', { type: 'button', className: 'link' }, t('close'));
  const dialog = el(
    'dialog',
    { className: 'about' },
    el('div', { className: 'about-bar' }, el('strong', {}, t('about')), close),
    el(
      'div',
      { className: 'about-body' },
      el('img', { className: 'about-logo', src: chrome.runtime.getURL('icons/icon128.png'), alt: '', width: 64, height: 64 }),
      el('div', { className: 'about-name' }, 'PostReady Screenshots'),
      el('div', { className: 'about-tagline' }, t('aboutTagline')),
      el('div', { className: 'about-motto' }, t('aboutMotto')),
      group(row(t('aboutVersion'), chrome.runtime.getManifest().version)),
      group(
        row(t('aboutAuthor'), 'Stefan Schmidbauer'),
        row(t('aboutLicense'), 'MIT'),
        row(t('aboutSource'), 'GitHub', { href: REPO_URL, kind: 'link' }),
        row(t('aboutPrivacy'), t('aboutPrivacyLink'), { href: `${REPO_URL}/blob/main/PRIVACY.md`, kind: 'link' }),
      ),
      actions(
        row(t('aboutRate'), '★', { href: `${STORE_URL}/reviews`, kind: 'star' }),
        row(t('aboutFeedback'), '✉', { href: FEEDBACK_URL, kind: 'link' }),
      ),
      el('p', { className: 'about-foot' }, t('aboutLocal')),
      el('p', { className: 'about-foot' }, t('aboutAi')),
    ),
  );
  close.addEventListener('click', () => dialog.close());
  // A click on the backdrop (outside the box) closes the dialog
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  document.body.append(dialog);
  return dialog;
}

export function setupAbout(button) {
  let dialog = null;
  button.addEventListener('click', () => (dialog ??= build()).showModal());
}
