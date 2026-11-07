// Feedback via the toolbar icon (badge) and the last result

import { sleep } from './window-fit.js';

let clearTimer = null;

async function badge(text, color) {
  clearTimeout(clearTimer);
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text });
}

export async function countdown(seconds) {
  for (let i = seconds; i > 0; i--) {
    await badge(String(i), '#d97706');
    await sleep(1000);
  }
  if (seconds) await chrome.action.setBadgeText({ text: '' });
}

export async function report({ ok, message, filename = null }) {
  await chrome.storage.session.set({ lastResult: { ok, message, filename, at: Date.now() } });
  await badge(ok ? '✓' : '!', ok ? '#16a34a' : '#dc2626');
  await chrome.action.setTitle({ title: `PostReady – ${message}` });
  clearTimer = setTimeout(() => chrome.action.setBadgeText({ text: '' }).catch(() => {}), ok ? 2500 : 8000);
}
