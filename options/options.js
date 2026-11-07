import {
  loadSettings,
  saveSettings,
  normalizeSettings,
  normalizeFormat,
  captureProfile,
  defaultLibrary,
  DEFAULT_SETTINGS,
  newId,
} from '../lib/settings.js';
import { formatFilename } from '../lib/output.js';
import { t, localizeDocument } from '../lib/i18n.js';

localizeDocument();

const $ = (sel, root = document) => root.querySelector(sel);

const REPO_URL = 'https://github.com/Stefan-Schmidbauer/postready-screenshots';
const LINKS = {
  linkSource: REPO_URL,
  linkPrivacy: `${REPO_URL}/blob/main/PRIVACY.md`,
  linkFeedback: 'mailto:support@ancroo.com',
};
let settings = await loadSettings();
let saveTimer = null;
let savedTimer = null;

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await saveSettings(settings);
    const saved = $('#saved');
    saved.hidden = false;
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => (saved.hidden = true), 1500);
  }, 300);
  updatePreview();
}

function updatePreview() {
  const s = normalizeSettings(settings);
  $('#filenamePreview').textContent = formatFilename(s, captureProfile(s), { title: t('samplePageTitle'), nr: 1 });
}

// Delete non-empty items only on the second click
function confirmClick(button, label, action) {
  if (button.classList.contains('confirm')) {
    action();
    return;
  }
  const { textContent, title } = button;
  button.classList.add('confirm');
  button.title = label;
  if (!button.classList.contains('icon-btn')) button.textContent = label;
  setTimeout(() => {
    button.classList.remove('confirm');
    button.title = title;
    button.textContent = textContent;
  }, 3000);
}

/* ---------- Library: categories and formats ---------- */

function clone(tplId) {
  return $(tplId).content.firstElementChild.cloneNode(true);
}

function formatsOf(categoryId) {
  return settings.formats.filter((f) => f.categoryId === categoryId);
}

function move(list, item, delta) {
  const from = list.indexOf(item);
  const to = from + delta;
  if (to < 0 || to >= list.length) return;
  [list[from], list[to]] = [list[to], list[from]];
}

// Moves a format within its category (all formats share one mixed array)
function moveFormat(format, delta) {
  const siblings = formatsOf(format.categoryId);
  const neighbor = siblings[siblings.indexOf(format) + delta];
  if (!neighbor) return;
  const a = settings.formats.indexOf(format);
  const b = settings.formats.indexOf(neighbor);
  [settings.formats[a], settings.formats[b]] = [settings.formats[b], settings.formats[a]];
}

function changed({ focus } = {}) {
  renderLibrary();
  scheduleSave();
  if (focus) {
    const input = $(`[data-id="${CSS.escape(focus)}"] input[type="text"]`);
    input?.focus();
    input?.select();
  }
}

function renderFormatRow(f, index, siblings) {
  const row = clone('#formatTpl');
  row.dataset.id = f.id;
  row.classList.toggle('active', f.id === settings.activeFormatId);
  if (f.id === settings.activeFormatId) row.title = t('activeInPopup');

  const name = $('.f-name', row);
  name.value = f.name;
  name.addEventListener('input', () => {
    f.name = name.value;
    scheduleSave();
  });

  for (const key of ['width', 'height']) {
    const input = $(`.f-${key}`, row);
    input.value = f[key];
    input.addEventListener('input', () => {
      f[key] = Number(input.value);
      scheduleSave();
    });
    // Reset to valid values on blur
    input.addEventListener('change', () => {
      input.value = normalizeFormat(f, [f.categoryId])[key];
    });
  }

  const category = $('.f-category', row);
  category.replaceChildren(...settings.categories.map((c) => new Option(c.name, c.id)));
  category.value = f.categoryId;
  category.addEventListener('change', () => {
    f.categoryId = category.value;
    // to the end of the new category
    settings.formats.splice(settings.formats.indexOf(f), 1);
    settings.formats.push(f);
    changed();
  });

  $('.f-up', row).disabled = index === 0;
  $('.f-down', row).disabled = index === siblings.length - 1;
  $('.f-up', row).addEventListener('click', () => {
    moveFormat(f, -1);
    changed();
  });
  $('.f-down', row).addEventListener('click', () => {
    moveFormat(f, 1);
    changed();
  });

  const remove = $('.f-remove', row);
  remove.disabled = settings.formats.length === 1;
  remove.addEventListener('click', () => {
    settings.formats = settings.formats.filter((x) => x !== f);
    changed();
  });
  return row;
}

function renderCategory(c, index) {
  const node = clone('#categoryTpl');
  node.dataset.id = c.id;
  const formats = formatsOf(c.id);

  const name = $('.c-name', node);
  name.value = c.name;
  name.addEventListener('input', () => {
    c.name = name.value;
    for (const option of document.querySelectorAll(`.f-category option[value="${CSS.escape(c.id)}"]`)) {
      option.textContent = c.name;
    }
    scheduleSave();
  });

  $('.c-count', node).textContent = formats.length === 1 ? t('formatCountOne') : t('formatCountMany', formats.length);

  $('.c-up', node).disabled = index === 0;
  $('.c-down', node).disabled = index === settings.categories.length - 1;
  $('.c-up', node).addEventListener('click', () => {
    move(settings.categories, c, -1);
    changed();
  });
  $('.c-down', node).addEventListener('click', () => {
    move(settings.categories, c, 1);
    changed();
  });

  const remove = $('.c-remove', node);
  const onlyFormatsHere = formats.length > 0 && formats.length === settings.formats.length;
  remove.disabled = settings.categories.length === 1 || onlyFormatsHere;
  if (formats.length) remove.title = t('removeCategoryWithFormats', formats.length);
  remove.addEventListener('click', () => {
    const doRemove = () => {
      settings.categories = settings.categories.filter((x) => x !== c);
      settings.formats = settings.formats.filter((f) => f.categoryId !== c.id);
      changed();
    };
    if (formats.length) confirmClick(remove, t('confirmRemoveCategory'), doRemove);
    else doRemove();
  });

  $('.c-formats', node).replaceChildren(...formats.map((f, i) => renderFormatRow(f, i, formats)));

  $('.c-add', node).addEventListener('click', () => {
    const format = { id: newId(), name: t('newFormat'), categoryId: c.id, width: 1280, height: 800 };
    settings.formats.push(format);
    changed({ focus: format.id });
  });
  return node;
}

function renderLibrary() {
  $('#library').replaceChildren(...settings.categories.map(renderCategory));
}

$('#addCategory').addEventListener('click', () => {
  const category = { id: newId(), name: t('newCategory') };
  settings.categories.push(category);
  changed({ focus: category.id });
});

$('#resetLibrary').addEventListener('click', (e) => {
  confirmClick(e.currentTarget, t('confirmReset'), () => {
    Object.assign(settings, defaultLibrary(), {
      activeCategoryId: DEFAULT_SETTINGS.activeCategoryId,
      activeFormatId: DEFAULT_SETTINGS.activeFormatId,
    });
    changed();
  });
});

// Pick up the selection from popup/Studio, so our next save does not overwrite it
chrome.storage.onChanged.addListener((changes, area) => {
  const next = area === 'local' && changes.settings?.newValue;
  if (!next) return;
  const keys = ['activeCategoryId', 'activeFormatId', 'mode', 'fileType', 'heightMode', 'baseName'];
  if (keys.every((k) => settings[k] === next[k])) return;
  for (const k of keys) settings[k] = next[k];
  for (const row of document.querySelectorAll('.format-row')) {
    const active = row.dataset.id === settings.activeFormatId;
    row.classList.toggle('active', active);
    row.title = active ? t('activeInPopup') : '';
  }
  updatePreview();
});

/* ---------- General settings ---------- */

function renderDelayOptions() {
  for (const option of $('#delay').options) {
    if (Number(option.value) > 0) option.textContent = t('delaySeconds', option.value);
  }
}

function bindGeneral() {
  for (const el of document.querySelectorAll('[data-key]')) {
    const key = el.dataset.key;
    if (el.type === 'checkbox') el.checked = settings[key];
    else if (el.type === 'radio') el.checked = settings[key] === el.value;
    else el.value = settings[key];

    const event = el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(event, () => {
      if (el.type === 'checkbox') settings[key] = el.checked;
      else if (el.type === 'radio') settings[key] = el.value;
      else settings[key] = el.dataset.type === 'number' ? Number(el.value) : el.value;
      scheduleSave();
    });
  }
}

/* ---------- Keyboard shortcuts ---------- */

async function renderShortcuts() {
  const commands = await chrome.commands.getAll();
  $('#shortcuts').replaceChildren(
    ...commands
      .filter((c) => c.description)
      .map((c) => {
        const li = document.createElement('li');
        const key = document.createElement('kbd');
        key.textContent = c.shortcut || t('notAssigned');
        li.append(key, ` ${c.description}`);
        return li;
      }),
  );
}

$('#editShortcuts').addEventListener('click', () => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }));

// About: the version comes straight from the manifest, so it can never drift
$('#version').textContent = t('aboutVersion', chrome.runtime.getManifest().version);
for (const [id, href] of Object.entries(LINKS)) $(`#${id}`).href = href;

renderLibrary();
renderDelayOptions();
bindGeneral();
updatePreview();
renderShortcuts();
