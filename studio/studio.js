import {
  loadSettings,
  saveSettings,
  captureProfile,
  formatsIn,
  selectCategory,
  MODES,
  HEIGHT_MODES,
  FORMATS,
} from '../lib/settings.js';
import { fitToProfile, ensureFit, getActiveTab, captureTabImage, getCalib, setCalib, sleep } from '../lib/window-fit.js';
import { analyzeFrame, composeCrop } from '../lib/compose.js';
import { renderAndSave, formatFilename, openScreenshotFolder } from '../lib/output.js';
import { shootPage } from '../lib/shoot-page.js';
import { report, countdown } from '../lib/feedback.js';
import { t, localizeDocument } from '../lib/i18n.js';

localizeDocument();

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);
const ownWindow = await chrome.windows.getCurrent();

// Active window share
const cap = { windowId: null, stream: null, reader: null, video: null, frame: null, frameAt: 0, waiters: [] };
let settings = await loadSettings();
let busy = false;
let previewUrl = null;

/* ---------- Log & status ---------- */

function log(text, kind = 'info') {
  const list = $('#log');
  const li = document.createElement('li');
  li.className = kind;
  const time = document.createElement('time');
  time.textContent = new Date().toLocaleTimeString();
  const span = document.createElement('span');
  span.textContent = text;
  li.append(time, span);
  list.prepend(li);
  while (list.children.length > 50) list.lastChild.remove();
}

function setStatus(state) {
  const pill = $('#status');
  pill.className = `pill ${state}`;
  pill.textContent = t({ off: 'statusOff', pending: 'statusPending', on: 'statusOn' }[state]);
  $('#connect').textContent = t(state === 'on' ? 'disconnect' : 'connect');
}

function setBusy(value) {
  busy = value;
  for (const id of ['#connect', '#fit', '#shoot']) $(id).disabled = value;
}

/* ---------- Window and profile selection ---------- */

function selectedWindowId() {
  return Number($('#window').value) || null;
}

async function refreshWindows(preferId = selectedWindowId()) {
  const wins = await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] });
  const select = $('#window');
  select.replaceChildren(
    ...wins.map((w, i) => {
      const title = w.tabs.find((tab) => tab.active)?.title || t('newTab');
      return new Option(t(w.id === cap.windowId ? 'windowOptionConnected' : 'windowOption', i + 1, title), w.id);
    }),
  );
  let id = wins.some((w) => w.id === preferId) ? preferId : null;
  id ??= (await chrome.windows.getLastFocused({ windowTypes: ['normal'] }).catch(() => null))?.id;
  if (id != null) select.value = String(id);
}

function fillSelect(id, options, value) {
  $(id).replaceChildren(...options.map(([v, label]) => new Option(label, v)));
  $(id).value = value;
}

function renderSelection() {
  fillSelect('#category', settings.categories.map((c) => [c.id, c.name]), settings.activeCategoryId);
  const list = formatsIn(settings, settings.activeCategoryId);
  fillSelect('#format', list.map((f) => [f.id, `${f.name} (${f.width} × ${f.height})`]), settings.activeFormatId);
  $('#format').disabled = !list.length;
  fillSelect('#mode', Object.entries(MODES).map(([v, m]) => [v, m.label]), settings.mode);
  fillSelect('#fileType', Object.entries(FORMATS).map(([v, f]) => [v, f.label]), settings.fileType);
  fillSelect('#heightMode', Object.entries(HEIGHT_MODES).map(([v, h]) => [v, h.label]), settings.heightMode);
  $('#profileHint').textContent = `${MODES[settings.mode].hint} ${HEIGHT_MODES[settings.heightMode].hint}`;
  // do not overwrite while the user is typing here
  if (document.activeElement !== $('#baseName')) $('#baseName').value = settings.baseName;
  updatePreview();
}

function updatePreview() {
  const name = formatFilename(settings, captureProfile(settings), { nr: 1 }).split('/').pop();
  $('#filenamePreview').textContent = `→ ${name}`;
}

/* ---------- Window sharing ---------- */

function onFrame() {
  cap.frameAt = performance.now();
  for (const resolve of cap.waiters.splice(0)) resolve();
}

function startFrames(track) {
  if ('MediaStreamTrackProcessor' in window) {
    const reader = new MediaStreamTrackProcessor({ track }).readable.getReader();
    cap.reader = reader;
    (async () => {
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          if (cap.reader !== reader) {
            value.close();
            break;
          }
          cap.frame?.close();
          cap.frame = value;
          onFrame();
        }
      } catch {
        // Sharing has ended
      }
    })();
  } else {
    const video = Object.assign(document.createElement('video'), { muted: true, playsInline: true });
    video.srcObject = new MediaStream([track]);
    cap.video = video;
    const tick = () => {
      if (cap.video !== video) return;
      onFrame();
      video.requestVideoFrameCallback(tick);
    };
    video.requestVideoFrameCallback(tick);
    video.play();
  }
}

function waitForFrame(since, timeout) {
  if (cap.frameAt > since) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      cap.waiters = cap.waiters.filter((w) => w !== done);
      resolve();
    }, timeout);
    cap.waiters.push(done);
  });
}

// Briefly waits for a fresh frame (static windows may not produce any new ones)
async function grabFrame(timeout = 800) {
  await waitForFrame(performance.now(), timeout);
  if (cap.frame) {
    const copy = cap.frame.clone();
    try {
      return await createImageBitmap(copy);
    } finally {
      copy.close();
    }
  }
  if (cap.video?.videoWidth) return createImageBitmap(cap.video);
  throw new Error(t('errNoFrame'));
}

function disconnect() {
  cap.reader?.cancel().catch(() => {});
  cap.frame?.close();
  cap.stream?.getTracks().forEach((t) => t.stop());
  if (cap.video) cap.video.srcObject = null;
  Object.assign(cap, { windowId: null, stream: null, reader: null, video: null, frame: null, frameAt: 0 });
  for (const resolve of cap.waiters.splice(0)) resolve();
  setStatus('off');
  refreshWindows();
}

async function connect(windowId) {
  disconnect();
  const tab = await getActiveTab(windowId).catch(() => null);
  setStatus('pending');
  log(tab?.title ? t('logPickWindowTitled', tab.title) : t('logPickWindow'));
  await chrome.windows.update(ownWindow.id, { focused: true });
  try {
    const streamId = await new Promise((resolve, reject) => {
      chrome.desktopCapture.chooseDesktopMedia(['window'], (id) =>
        id ? resolve(id) : reject(new Error(t('errPickCancelled'))),
      );
    });
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: streamId,
          maxWidth: 8192,
          maxHeight: 8192,
          maxFrameRate: 15,
        },
      },
    });
    const [track] = stream.getVideoTracks();
    track.addEventListener('ended', () => {
      if (cap.stream !== stream) return;
      disconnect();
      log(t('logShareEnded'));
    });
    cap.stream = stream;
    cap.windowId = windowId;
    startFrames(track);
    await waitForFrame(0, 3000);
    await checkConnection(windowId);
    setStatus('on');
    await refreshWindows(windowId);
    log(t('logConnected'), 'ok');
  } catch (e) {
    disconnect();
    throw e;
  }
}

async function checkConnection(windowId) {
  const fw = cap.frame?.displayWidth ?? cap.video?.videoWidth;
  const fh = cap.frame?.displayHeight ?? cap.video?.videoHeight;
  if (!fw || !fh) return;
  const win = await chrome.windows.get(windowId);
  const ratio = fw / fh / (win.width / win.height);
  if (ratio < 0.85 || ratio > 1.18) {
    log(t('logWrongAspect'), 'err');
  }
}

/* ---------- Capture ---------- */

async function shootWindow(windowId, profile) {
  if (cap.windowId !== windowId) await connect(windowId);

  for (let attempt = 0; ; attempt++) {
    if (settings.autoFit) {
      const fit = await ensureFit(windowId, profile, settings);
      if (fit.changed) await sleep(300);
    }
    await chrome.windows.update(windowId, { focused: true });
    if (attempt === 0) await countdown(settings.delaySec);
    await sleep(250); // the window repaints after the focus change

    const [win, tab] = await Promise.all([chrome.windows.get(windowId), getActiveTab(windowId)]);
    const tabImg = await captureTabImage(windowId).catch(() => null);
    const frame = await grabFrame();
    try {
      const analysis = analyzeFrame({
        frame,
        win,
        tab,
        tabImg,
        mode: profile.mode,
        borderDip: settings.border,
        fallbackScale: devicePixelRatio,
      });

      const calib = await getCalib();
      if (Math.abs(calib.dw - analysis.calib.dw) > 0.5 || Math.abs(calib.dh - analysis.calib.dh) > 0.5) {
        await setCalib(analysis.calib);
        if (settings.autoFit && attempt === 0) {
          log(t('logRecalibrate'));
          continue;
        }
      }

      const canvas = composeCrop(frame, tabImg, analysis, settings.lossless);
      return await renderAndSave({
        source: canvas,
        rect: { x: 0, y: 0, w: canvas.width, h: canvas.height },
        profile,
        settings,
        title: tab.title,
        notes: analysis.notes,
      });
    } finally {
      frame.close();
      tabImg?.close();
    }
  }
}

function showResult(result) {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(result.blob);
  $('#preview').src = previewUrl;
  $('#resultMeta').textContent =
    `${result.filename} · ${result.width} × ${result.height} px · ${Math.round(result.blob.size / 1024)} KB`;
  $('#resultNotes').replaceChildren(
    ...result.notes.map((n) => Object.assign(document.createElement('li'), { textContent: n })),
  );
  $('#result').hidden = false;
}

async function shoot(windowId = selectedWindowId()) {
  if (busy) return;
  if (!windowId) {
    log(t('logNoTarget'), 'err');
    return;
  }
  setBusy(true);
  try {
    clearTimeout(baseNameTimer);
    await saveSettings(settings); // make sure the typed file name is saved
    settings = await loadSettings();
    const profile = captureProfile(settings);
    await refreshWindows(windowId);
    const result =
      profile.mode === 'page' ? await shootPage(windowId, settings, profile) : await shootWindow(windowId, profile);
    showResult(result);
    log(result.message, 'ok');
    await report(result);
  } catch (e) {
    log(e.message, 'err');
    await report({ ok: false, message: e.message });
  } finally {
    setBusy(false);
  }
}

/* ---------- Events ---------- */

$('#shoot').addEventListener('click', () => shoot());

$('#fit').addEventListener('click', async () => {
  setBusy(true);
  try {
    const result = await fitToProfile(selectedWindowId(), captureProfile(settings), settings);
    log(result.message, result.ok ? 'ok' : 'err');
  } catch (e) {
    log(e.message, 'err');
  } finally {
    setBusy(false);
  }
});

$('#connect').addEventListener('click', async () => {
  if (cap.windowId) {
    disconnect();
    log(t('logDisconnected'));
    return;
  }
  setBusy(true);
  try {
    await connect(selectedWindowId());
  } catch (e) {
    log(e.message, 'err');
  } finally {
    setBusy(false);
  }
});

async function updateSelection(change) {
  change();
  renderSelection();
  await saveSettings(settings);
}

$('#category').addEventListener('change', (e) => updateSelection(() => selectCategory(settings, e.target.value)));
$('#format').addEventListener('change', (e) => updateSelection(() => (settings.activeFormatId = e.target.value)));
$('#mode').addEventListener('change', (e) => updateSelection(() => (settings.mode = e.target.value)));
$('#fileType').addEventListener('change', (e) => updateSelection(() => (settings.fileType = e.target.value)));
$('#heightMode').addEventListener('change', (e) => updateSelection(() => (settings.heightMode = e.target.value)));
$('#editFormats').addEventListener('click', () => chrome.runtime.openOptionsPage());

let baseNameTimer = null;
$('#baseName').addEventListener('input', (e) => {
  settings.baseName = e.target.value;
  updatePreview();
  clearTimeout(baseNameTimer);
  baseNameTimer = setTimeout(() => saveSettings(settings), 250);
});
$('#baseName').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') shoot();
});

$('#window').addEventListener('focus', () => refreshWindows());
$('#openOptions').addEventListener('click', () => chrome.runtime.openOptionsPage());
$('#openFolder').addEventListener('click', openScreenshotFolder);

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local' || !changes.settings) return;
  settings = await loadSettings();
  renderSelection();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.to !== 'studio') return false;
  if (msg.type === 'shoot') shoot(msg.windowId);
  sendResponse({ ok: true });
  return false;
});

chrome.windows.onCreated.addListener(() => refreshWindows());
chrome.windows.onRemoved.addListener((id) => {
  if (id === cap.windowId) {
    disconnect();
    log(t('logWindowClosed'));
  } else {
    refreshWindows();
  }
});

window.addEventListener('pagehide', () => cap.stream?.getTracks().forEach((t) => t.stop()));

/* ---------- Startup ---------- */

async function showShortcuts() {
  const commands = await chrome.commands.getAll();
  const shot = commands.find((c) => c.name === 'take-screenshot')?.shortcut;
  const fit = commands.find((c) => c.name === 'fit-window')?.shortcut;
  const parts = [];
  if (shot) parts.push(t('shortcutShot', shot));
  if (fit) parts.push(t('shortcutFit', fit));
  $('#shortcuts').textContent = parts.length ? t('studioShortcuts', parts.join(' · ')) : '';
}

renderSelection();
setStatus('off');
showShortcuts();

const target = Number(params.get('target')) || null;
await refreshWindows(target);
const action = params.get('action');
history.replaceState(null, '', location.pathname); // a reload must not repeat the action
if (action === 'shoot') shoot(selectedWindowId());
