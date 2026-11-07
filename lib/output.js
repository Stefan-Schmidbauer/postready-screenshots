// Scaling, encoding and saving the screenshots

import { FORMATS, DEFAULT_BASENAME } from './settings.js';
import { t } from './i18n.js';

// Largest allowed aspect ratio deviation before we abort instead of distorting
const ASPECT_TOLERANCE = 0.005;

export function drawScaled(source, sx, sy, sw, sh, tw, th) {
  let src = source;
  let x = sx, y = sy, w = sw, h = sh;
  // For large reductions, halve step by step: much sharper than a single step
  while (w / 2 >= tw && h / 2 >= th) {
    const step = new OffscreenCanvas(Math.round(w / 2), Math.round(h / 2));
    const ctx = step.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, x, y, w, h, 0, 0, step.width, step.height);
    src = step;
    x = 0; y = 0; w = step.width; h = step.height;
  }
  const out = new OffscreenCanvas(tw, th);
  const ctx = out.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, x, y, w, h, 0, 0, tw, th);
  return out;
}

function sanitize(part) {
  return part
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .slice(0, 150);
}

function slug(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^\w-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Free text from the popup: umlauts stay, spaces and special characters become hyphens
function baseName(text) {
  return sanitize(
    String(text ?? '')
      .replace(/[<>:"/\\|?*\x00-\x1f\s]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, ''),
  );
}

export function formatFilename(settings, profile, { title = '', nr = 1, date = new Date() } = {}) {
  const pad = (n) => String(n).padStart(2, '0');
  const datum = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const zeit = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  const vars = {
    basis: baseName(settings.baseName) || DEFAULT_BASENAME,
    name: slug(profile.name),
    kategorie: slug(profile.category),
    w: profile.width,
    h: profile.height,
    datum,
    zeit,
    zeitstempel: `${datum}_${zeit}`,
    modus: profile.mode,
    titel: slug(title).slice(0, 60),
    nr: String(nr).padStart(3, '0'),
  };
  // English placeholders
  Object.assign(vars, {
    base: vars.basis,
    category: vars.kategorie,
    date: datum,
    time: zeit,
    timestamp: vars.zeitstempel,
    mode: vars.modus,
    title: vars.titel,
  });


  const base = sanitize(settings.filenamePattern.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key] : m)));
  const folder = settings.subfolder
    .split(/[\\/]+/)
    .map(sanitize)
    .filter((p) => p && p !== '..')
    .join('/');
  return `${folder ? `${folder}/` : ''}${base || 'screenshot'}.${FORMATS[profile.format].ext}`;
}

async function buildFilename(settings, profile, title) {
  let nr = 1;
  if (settings.filenamePattern.includes('{nr}')) {
    const { counter = 0 } = await chrome.storage.local.get('counter');
    nr = counter + 1;
    await chrome.storage.local.set({ counter: nr });
  }
  return formatFilename(settings, profile, { title, nr });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Hide Chrome's download bubble/icon only for the duration of our download,
// so it does not end up in the next window screenshot.
function restoreDownloadUiAfter(downloadId) {
  const restore = () => {
    chrome.downloads.onChanged.removeListener(onChanged);
    clearTimeout(timer);
    chrome.downloads.setUiOptions({ enabled: true }).catch(() => {});
  };
  const onChanged = (delta) => {
    if (delta.id === downloadId && delta.state && delta.state.current !== 'in_progress') setTimeout(restore, 1000);
  };
  const timer = setTimeout(restore, 15000);
  chrome.downloads.onChanged.addListener(onChanged);
}

async function saveBlob(blob, filename, settings) {
  const url = await blobToDataUrl(blob);
  const hideUi = settings.hideDownloadUi && !settings.saveAs && !!chrome.downloads.setUiOptions;
  if (hideUi) await chrome.downloads.setUiOptions({ enabled: false }).catch(() => {});
  try {
    const id = await chrome.downloads.download({ url, filename, saveAs: settings.saveAs, conflictAction: 'uniquify' });
    if (hideUi) restoreDownloadUiAfter(id);
    return id;
  } catch (e) {
    if (hideUi) chrome.downloads.setUiOptions({ enabled: true }).catch(() => {});
    throw e;
  }
}

// Opens the folder of the last screenshot in the file manager (with the file selected), or the
// Downloads folder if there is none yet or it has been deleted or removed from Chrome's history
export async function openScreenshotFolder() {
  const { lastDownloadId } = await chrome.storage.local.get('lastDownloadId');
  if (lastDownloadId != null) {
    const [item] = await chrome.downloads.search({ id: lastDownloadId }).catch(() => []);
    if (item?.state === 'complete' && item.exists !== false) {
      chrome.downloads.show(lastDownloadId);
      return;
    }
  }
  chrome.downloads.showDefaultFolder();
}

export async function renderAndSave({ source, rect, profile, settings, title = '', notes = [] }) {
  if (profile.freeHeight) {
    // Width from the format, height from the aspect ratio of the captured area
    profile = { ...profile, height: Math.round((rect.h * profile.width) / rect.w) };
  } else {
    const aspect = rect.w / rect.h;
    const targetAspect = profile.width / profile.height;
    if (Math.abs(aspect - targetAspect) / targetAspect > ASPECT_TOLERANCE) {
      throw new Error(t('errAspect', `${rect.w} × ${rect.h}`, `${profile.width} × ${profile.height}`));
    }
  }
  if (rect.w !== profile.width || rect.h !== profile.height) {
    notes.push(t(rect.w < profile.width ? 'noteScaledUp' : 'noteScaled', `${rect.w} × ${rect.h}`));
  }

  const canvas = drawScaled(source, rect.x, rect.y, rect.w, rect.h, profile.width, profile.height);
  const blob = await canvas.convertToBlob({ type: FORMATS[profile.format].mime, quality: profile.quality / 100 });
  const filename = await buildFilename(settings, profile, title);
  const downloadId = await saveBlob(blob, filename, settings);
  await chrome.storage.local.set({ lastDownloadId: downloadId });

  return {
    ok: true,
    message: t('savedAs', filename),
    filename,
    blob,
    width: profile.width,
    height: profile.height,
    notes,
  };
}
