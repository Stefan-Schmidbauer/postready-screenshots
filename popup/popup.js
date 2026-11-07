import { loadSettings, saveSettings, formatsIn, selectCategory, captureProfile, MODES, HEIGHT_MODES, FORMATS } from '../lib/settings.js';
import { formatFilename, openScreenshotFolder } from '../lib/output.js';
import { t, localizeDocument } from '../lib/i18n.js';

localizeDocument();

const $ = (sel) => document.querySelector(sel);
const win = await chrome.windows.getCurrent();
let settings = await loadSettings();

function setStatus(text, kind = '') {
  const el = $('#status');
  el.textContent = text;
  el.className = `status ${kind}`;
}

function radio(name, value, checked, onChange) {
  const input = Object.assign(document.createElement('input'), { type: 'radio', name, value, checked });
  input.addEventListener('change', onChange);
  return input;
}

function renderCategories() {
  $('#category').replaceChildren(
    ...settings.categories.map((c) => new Option(`${c.name} (${formatsIn(settings, c.id).length})`, c.id)),
  );
  $('#category').value = settings.activeCategoryId;
}

function renderFormats() {
  const list = formatsIn(settings, settings.activeCategoryId);
  const container = $('#formats');
  if (!list.length) {
    const empty = Object.assign(document.createElement('p'), {
      className: 'empty',
      textContent: t('emptyCategory'),
    });
    container.replaceChildren(empty);
    return;
  }
  container.replaceChildren(
    ...list.map((f) => {
      const label = document.createElement('label');
      label.className = 'format';
      const input = radio('format', f.id, f.id === settings.activeFormatId, async () => {
        settings.activeFormatId = f.id;
        updatePreview();
        await saveSettings(settings);
      });
      const name = Object.assign(document.createElement('span'), { className: 'name', textContent: f.name, title: f.name });
      const size = Object.assign(document.createElement('span'), { className: 'size', textContent: `${f.width} × ${f.height}` });
      label.append(input, name, size);
      return label;
    }),
  );
  container.querySelector('input:checked')?.closest('label').scrollIntoView({ block: 'nearest' });
  updatePreview();
}

function updatePreview() {
  const name = formatFilename(settings, captureProfile(settings), { nr: 1 }).split('/').pop();
  $('#filenamePreview').textContent = `→ ${name}`;
  $('#filenamePreview').title = name;
}

function renderSegment(container, entries, key) {
  container.replaceChildren(
    ...Object.entries(entries).map(([value, entry]) => {
      const label = document.createElement('label');
      label.title = entry.hint ?? entry.label;
      label.append(
        radio(key, value, settings[key] === value, async () => {
          settings[key] = value;
          updatePreview();
          await saveSettings(settings);
          showModeHint();
        }),
        entry.short,
      );
      return label;
    }),
  );
}

function showModeHint() {
  if (settings.mode === 'page') setStatus('');
  else setStatus(t('studioHint'), 'muted');
}

async function send(type) {
  return chrome.runtime.sendMessage({ to: 'background', type, windowId: win.id });
}

$('#category').addEventListener('change', async (e) => {
  selectCategory(settings, e.target.value);
  await saveSettings(settings);
  renderFormats();
});

$('#fit').addEventListener('click', async () => {
  setStatus(t('fitting'));
  const result = await send('fit');
  setStatus(result.message, result.ok ? 'ok' : 'err');
});

let baseNameTimer = null;
$('#baseName').addEventListener('input', (e) => {
  settings.baseName = e.target.value;
  updatePreview();
  clearTimeout(baseNameTimer);
  baseNameTimer = setTimeout(() => saveSettings(settings), 250);
});

async function shoot() {
  clearTimeout(baseNameTimer);
  await saveSettings(settings); // make sure the typed file name is saved
  await send('shoot');
  window.close();
}

$('#shoot').addEventListener('click', shoot);
$('#baseName').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') shoot();
});

$('#openStudio').addEventListener('click', async () => {
  await send('open-studio');
  window.close();
});

$('#openOptions').addEventListener('click', () => chrome.runtime.openOptionsPage());
$('#openFolder').addEventListener('click', openScreenshotFolder);
$('#editFormats').addEventListener('click', () => chrome.runtime.openOptionsPage());

async function showShortcuts() {
  const commands = await chrome.commands.getAll();
  const shot = commands.find((c) => c.name === 'take-screenshot')?.shortcut;
  $('#shortcuts').textContent = shot ? t('popupShortcut', shot) : '';
}

async function showLastResult() {
  const { lastResult } = await chrome.storage.session.get('lastResult');
  if (lastResult && Date.now() - lastResult.at < 10 * 60 * 1000) {
    setStatus(lastResult.message, lastResult.ok ? 'ok' : 'err');
  } else {
    showModeHint();
  }
}

$('#baseName').value = settings.baseName;
renderCategories();
renderFormats();
renderSegment($('#mode'), MODES, 'mode');
renderSegment($('#fileType'), FORMATS, 'fileType');
renderSegment($('#heightMode'), HEIGHT_MODES, 'heightMode');
showShortcuts();
showLastResult();
