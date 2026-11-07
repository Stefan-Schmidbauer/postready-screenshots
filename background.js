import { loadSettings, captureProfile } from './lib/settings.js';
import { fitToProfile } from './lib/window-fit.js';
import { shootPage } from './lib/shoot-page.js';
import { report } from './lib/feedback.js';
import { t } from './lib/i18n.js';

const STUDIO_URL = chrome.runtime.getURL('studio/studio.html');

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.to !== 'background') return false;
  handle(msg).then(sendResponse, (e) => sendResponse({ ok: false, message: e.message }));
  return true;
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  const windowId = await resolveBrowserWindow(tab?.windowId);
  if (command === 'take-screenshot') {
    shoot(windowId);
  } else if (command === 'fit-window') {
    fit(windowId).then(report, (e) => report({ ok: false, message: e.message }));
  }
});

// If the Studio has focus, the last normal browser window is meant
async function resolveBrowserWindow(windowId) {
  if (windowId != null) {
    const win = await chrome.windows.get(windowId).catch(() => null);
    if (win?.type === 'normal') return windowId;
  }
  return (await chrome.windows.getLastFocused({ windowTypes: ['normal'] })).id;
}

async function handle(msg) {
  switch (msg.type) {
    case 'fit':
      return fit(msg.windowId);
    case 'shoot':
      shoot(msg.windowId); // The popup closes right away; the result arrives via badge/Studio
      return { ok: true };
    case 'open-studio':
      await openStudio(msg.windowId, null);
      return { ok: true };
    default:
      return { ok: false, message: t('errUnknownAction', msg.type) };
  }
}

async function fit(windowId) {
  const settings = await loadSettings();
  return fitToProfile(windowId, captureProfile(settings), settings);
}

async function shoot(windowId) {
  const settings = await loadSettings();
  const profile = captureProfile(settings);
  if (profile.mode !== 'page') return openStudio(windowId, 'shoot');
  try {
    await report(await shootPage(windowId, settings, profile));
  } catch (e) {
    await report({ ok: false, message: e.message });
  }
}

async function openStudio(windowId, action) {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['TAB'] });
  const studio = contexts.find((c) => c.documentUrl?.startsWith(STUDIO_URL));
  if (studio) {
    if (action) await chrome.runtime.sendMessage({ to: 'studio', type: action, windowId }).catch(() => {});
    else await chrome.windows.update(studio.windowId, { focused: true });
    return;
  }
  const url = `${STUDIO_URL}?target=${windowId}${action ? `&action=${action}` : ''}`;
  await chrome.windows.create({ url, type: 'popup', width: 440, height: 780, focused: true });
}
