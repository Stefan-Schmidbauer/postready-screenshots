// Sets the window size so that the chosen area exactly matches the target size.
// All sizes here are logical pixels (DIP), as reported by chrome.windows / chrome.tabs.

import { MODES } from './settings.js';
import { t } from './i18n.js';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getActiveTab(windowId) {
  const [tab] = await chrome.tabs.query({ active: true, windowId });
  if (!tab) throw new Error(t('errNoActiveTab'));
  if (!tab.width || !tab.height) throw new Error(t('errNoTabSize'));
  return tab;
}

// Visible tab content as an ImageBitmap (full device resolution, lossless).
export async function captureTabImage(windowId) {
  for (let attempt = 0; ; attempt++) {
    try {
      const url = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
      const blob = await (await fetch(url)).blob();
      return await createImageBitmap(blob);
    } catch (e) {
      // captureVisibleTab is limited to 2 calls per second
      if (attempt < 3 && /MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND/.test(e.message)) {
        await sleep(600);
        continue;
      }
      throw e;
    }
  }
}

// Device pixels per logical pixel in the target window.
export async function getScale(windowId) {
  try {
    const tab = await getActiveTab(windowId);
    const img = await captureTabImage(windowId);
    const scale = img.width / tab.width;
    img.close();
    await chrome.storage.session.set({ lastScale: scale });
    return scale;
  } catch {
    const { lastScale } = await chrome.storage.session.get('lastScale');
    return lastScale || globalThis.devicePixelRatio || 1;
  }
}

// Calibration: how much smaller is the visible window than the bounds reported
// by Chrome (e.g. invisible resize borders on Windows)?
export async function getCalib() {
  const { calib } = await chrome.storage.local.get('calib');
  return { dw: calib?.dw ?? 0, dh: calib?.dh ?? 0 };
}

export async function setCalib(calib) {
  await chrome.storage.local.set({ calib: { dw: Math.round(calib.dw), dh: Math.round(calib.dh) } });
}

export function measure(mode, win, tab, settings, calib) {
  switch (mode) {
    case 'window':
      return { w: win.width - calib.dw, h: win.height - calib.dh };
    case 'page':
      return { w: tab.width, h: tab.height };
    default:
      return { w: win.width - calib.dw - 2 * settings.border, h: tab.height };
  }
}

// With fractional scale factors (e.g. 125 %), Chrome rounds window sizes when converting between
// logical and physical pixels, by 1–2 px depending on window position. The result is scaled to the
// exact target size anyway, and renderAndSave also checks the aspect ratio.
const FIT_TOLERANCE = 2;

// Window managers apply size changes asynchronously
async function waitForBounds(windowId, prev, timeout = 1200) {
  const start = Date.now();
  for (;;) {
    await sleep(100);
    const win = await chrome.windows.get(windowId);
    const resized = win.width !== prev.width || win.height !== prev.height;
    if (resized || Date.now() - start >= timeout) {
      if (resized) await sleep(150); // let the tab content lay out again
      return win;
    }
  }
}

async function workAreaOf(win) {
  const displays = await chrome.system.display.getInfo().catch(() => []);
  const cx = win.left + win.width / 2;
  const cy = win.top + win.height / 2;
  const contains = (b) => cx >= b.left && cx < b.left + b.width && cy >= b.top && cy < b.top + b.height;
  const display = displays.find((d) => contains(d.bounds)) ?? displays.find((d) => d.isPrimary) ?? displays[0];
  return display?.workArea ?? null;
}

// freeHeight: only fit the width, the window height stays as it is
export async function fitWindow(windowId, profile, settings, scale = 1, { freeHeight = false } = {}) {
  let win = await chrome.windows.get(windowId);
  if (win.type !== 'normal') throw new Error(t('errNotNormalWindow'));
  if (win.state !== 'normal') {
    await chrome.windows.update(windowId, { state: 'normal' });
    win = await waitForBounds(windowId, win);
  }

  const calib = await getCalib();
  const unit = settings.sizeUnit === 'device' ? scale : 1;
  const target = { w: profile.width / unit, h: profile.height / unit };
  const label = MODES[profile.mode].label;
  const required = (size) => ({
    width: Math.round(win.width + target.w - size.w),
    height: Math.round(win.height + target.h - size.h),
  });

  let size = measure(profile.mode, win, await getActiveTab(windowId), settings, calib);
  if (freeHeight) target.h = size.h;
  const wanted = `${profile.width} × ${freeHeight ? Math.round(size.h * unit) : profile.height}`;
  const area = await workAreaOf(win);
  const need = required(size);
  if (area && (need.width > area.width + FIT_TOLERANCE || need.height > area.height + FIT_TOLERANCE)) {
    return {
      ok: false,
      changed: false,
      message: t(
        'fitTooSmall',
        label,
        wanted,
        `${need.width} × ${need.height}`,
        `${area.width} × ${area.height}`,
        unit === 1 ? t('fitTooSmallDeviceHint') : '',
      ),
    };
  }

  let changed = false;
  let lastRequest = null;
  for (let i = 0; i < 5; i++) {
    const req = required(size);
    if (req.width === win.width && req.height === win.height) break;
    // Rounding oscillates or the window manager refuses the size: further attempts are pointless
    if (lastRequest && req.width === lastRequest.width && req.height === lastRequest.height) break;
    if (area) {
      // Move the window into the work area so the window manager does not shrink it again
      const right = area.left + area.width;
      const bottom = area.top + area.height;
      if (win.left + req.width > right) req.left = Math.max(area.left, right - req.width);
      if (win.top + req.height > bottom) req.top = Math.max(area.top, bottom - req.height);
    }
    lastRequest = req;
    await chrome.windows.update(windowId, req);
    changed = true;
    win = await waitForBounds(windowId, win);
    size = measure(profile.mode, win, await getActiveTab(windowId), settings, calib);
  }

  const ok = Math.abs(size.w - target.w) <= FIT_TOLERANCE && Math.abs(size.h - target.h) <= FIT_TOLERANCE;
  const reached = `${Math.round(size.w * unit)} × ${Math.round(size.h * unit)}`;
  return {
    ok,
    changed,
    message: ok
      ? t('fitOk', label, wanted)
      : t('fitFailed', label, reached, wanted),
  };
}

export async function fitToProfile(windowId, profile, settings, options) {
  const scale = settings.sizeUnit === 'device' ? await getScale(windowId) : 1;
  return fitWindow(windowId, profile, settings, scale, options);
}

// Before the screenshot: with "Free height" only correct the width, so a height dragged by hand
// is kept ("Fit window", by contrast, always sets the exact size)
export async function ensureFit(windowId, profile, settings) {
  const result = await fitToProfile(windowId, profile, settings, { freeHeight: profile.freeHeight });
  if (!result.ok) throw new Error(result.message);
  return result;
}
