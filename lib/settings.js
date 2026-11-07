// Settings (chrome.storage.local): a library of categories and formats (sizes)
// plus the current capture options area, height and file type, which apply to every format.

import { t, isGerman } from './i18n.js';

export const MODES = {
  content: { label: t('modeContentLabel'), short: t('modeContentShort'), hint: t('modeContentHint') },
  window: { label: t('modeWindowLabel'), short: t('modeWindowShort'), hint: t('modeWindowHint') },
  page: { label: t('modePageLabel'), short: t('modePageShort'), hint: t('modePageHint') },
};

// Height: exactly as in the format, or free (width stays fixed, height comes from the window)
export const HEIGHT_MODES = {
  fixed: { label: t('heightFixedLabel'), short: t('heightFixedShort'), hint: t('heightFixedHint') },
  free: { label: t('heightFreeLabel'), short: t('heightFreeShort'), hint: t('heightFreeHint') },
};

// File types
export const FORMATS = {
  png: { label: 'PNG', short: 'PNG', mime: 'image/png', ext: 'png' },
  jpeg: { label: 'JPEG', short: 'JPEG', mime: 'image/jpeg', ext: 'jpg' },
};

// Version of the bundled library. Categories with `since` > the stored version are added to
// existing libraries on load (the user's own changes stay untouched).
const LIBRARY_VERSION = 1;

// [id, category, formats, since library version], formats as [id, name, width, height].
// IDs are fixed numbers (stored as strings): never change or reuse them, new entries get the
// next free number. Names are 'same in both languages' or [german, english].
const DEFAULT_LIBRARY = [
  [1, ['Extension-Stores', 'Extension stores'], [
    [1, 'Chrome Web Store', 1280, 800],
    [2, ['Chrome Web Store (klein)', 'Chrome Web Store (small)'], 640, 400],
    [3, 'Chrome Web Store Marquee', 1400, 560],
    [4, 'Firefox Add-ons', 1280, 800],
    [5, 'Edge Add-ons', 1280, 800],
    [6, ['Edge Add-ons (klein)', 'Edge Add-ons (small)'], 640, 480],
  ]],
  [2, 'Mac App Store', [
    [7, 'Mac App Store', 1280, 800],
    [8, 'Mac App Store (1440)', 1440, 900],
    [9, 'Mac App Store Retina', 2560, 1600],
    [10, ['Mac App Store Retina (groß)', 'Mac App Store Retina (large)'], 2880, 1800],
  ]],
  [3, 'LinkedIn', [
    [11, ['LinkedIn quer', 'LinkedIn landscape'], 1200, 627],
    [12, ['LinkedIn quadratisch', 'LinkedIn square'], 1200, 1200],
    [13, ['LinkedIn hochkant', 'LinkedIn portrait'], 1080, 1350],
    [14, ['LinkedIn Karussell (1:1)', 'LinkedIn carousel (1:1)'], 1080, 1080],
    [15, ['LinkedIn Karussell (4:5)', 'LinkedIn carousel (4:5)'], 1080, 1350],
    [16, ['LinkedIn Artikel-/Newsletter-Titelbild', 'LinkedIn article/newsletter cover'], 1920, 1080],
  ]],
  [4, ['Artikel & Blogs', 'Articles & blogs'], [
    [17, ['Medium Artikelbild', 'Medium article image'], 1400, 787],
    [18, ['Substack Beitragsbild', 'Substack post image'], 1456, 1048],
    [19, ['Blog-Titelbild (16:9)', 'Blog header (16:9)'], 1200, 675],
    [20, ['Blog-Titelbild Full HD', 'Blog header Full HD'], 1920, 1080],
    [21, ['Artikelbild (3:2)', 'Article image (3:2)'], 1200, 800],
    [22, ['Artikelbild Retina (16:10)', 'Article image Retina (16:10)'], 1600, 1000],
    [23, 'dev.to Cover', 1000, 420],
    [24, 'Hashnode Cover', 1600, 840],
  ]],
  [7, 'README & Docs', [
    [39, 'GitHub Social Preview', 1280, 640],
    [40, 'README Hero (16:9)', 1600, 900],
    [41, 'README Screenshot (16:10)', 1600, 1000],
    [42, 'README Banner (3:1)', 1500, 500],
    [43, ['README klein (4:3)', 'README small (4:3)'], 800, 600],
    [44, ['Docs-Seite', 'Docs page'], 1400, 875],
  ]],
  [5, 'Web & Social', [
    [25, 'Social Card (Open Graph)', 1200, 630],
    [26, ['X/Twitter-Bild', 'X/Twitter image'], 1200, 675],
    [27, ['Product Hunt Galerie', 'Product Hunt gallery'], 1270, 760],
    [28, ['YouTube-Thumbnail', 'YouTube thumbnail'], 1280, 720],
    [29, ['YouTube-Video Full HD', 'YouTube video Full HD'], 1920, 1080],
  ]],
  [6, ['Bildschirmformate', 'Screen sizes'], [
    [30, 'HD (720p)', 1280, 720],
    [31, 'WXGA', 1280, 800],
    [32, 'Laptop', 1366, 768],
    [33, 'WXGA+', 1440, 900],
    [34, 'Full HD (1080p)', 1920, 1080],
    [35, 'WUXGA', 1920, 1200],
    [36, 'WQHD (1440p)', 2560, 1440],
    [37, 'WQXGA', 2560, 1600],
    [38, '4K UHD', 3840, 2160],
  ]],
];

const localName = (name) => (Array.isArray(name) ? name[isGerman() ? 0 : 1] : name);

// Default names by ID ('c<id>' for categories, 'f<id>' for formats) in both languages
const DEFAULT_NAMES = new Map(
  DEFAULT_LIBRARY.flatMap(([catId, name, entries]) => [
    [`c${catId}`, name],
    ...entries.map(([id, formatName]) => [`f${id}`, formatName]),
  ]),
);

// Entries that still carry a default name (in either language) follow the current UI
// language; renamed entries keep the user's name
function localizeDefaultName(item, prefix) {
  const name = DEFAULT_NAMES.get(prefix + item.id);
  if (name && [name].flat().includes(item.name)) item.name = localName(name);
  return item;
}

export function defaultLibrary() {
  const categories = [];
  const formats = [];
  for (const [catId, name, entries] of DEFAULT_LIBRARY) {
    const categoryId = String(catId);
    categories.push({ id: categoryId, name: localName(name) });
    for (const [id, formatName, width, height] of entries) {
      formats.push({ id: String(id), name: localName(formatName), categoryId, width, height });
    }
  }
  return { categories, formats };
}

// Insert new default categories into an existing library, each one behind the closest
// preceding default category that still exists
function addNewDefaults(categories, formats, fromVersion) {
  const lib = defaultLibrary();
  const order = lib.categories.map((c) => c.id);
  for (const [catId, , , since = 1] of DEFAULT_LIBRARY) {
    const id = String(catId);
    if (since <= fromVersion || categories.some((c) => c.id === id)) continue;
    const prev = order
      .slice(0, order.indexOf(id))
      .reverse()
      .find((pid) => categories.some((c) => c.id === pid));
    const at = prev ? categories.findIndex((c) => c.id === prev) + 1 : categories.length;
    categories.splice(at, 0, lib.categories.find((c) => c.id === id));
    formats.push(...lib.formats.filter((f) => f.categoryId === id && !formats.some((x) => x.id === f.id)));
  }
}

export const DEFAULT_SETTINGS = {
  ...defaultLibrary(),
  libraryVersion: LIBRARY_VERSION,
  activeCategoryId: '1',
  activeFormatId: '1',
  mode: 'content',
  heightMode: 'fixed',
  fileType: 'png',
  jpegQuality: 92,
  sizeUnit: 'css', // 'css' = logical pixels, 'device' = physical screen pixels
  autoFit: true,
  delaySec: 0,
  lossless: true,
  border: 0,
  subfolder: 'PostReady-Screenshots',
  baseName: '', // Text from the popup; empty = DEFAULT_BASENAME
  filenamePattern: isGerman() ? '{basis}-{name}-{zeitstempel}' : '{base}-{name}-{timestamp}',
  saveAs: false,
  hideDownloadUi: true,
};

export const DEFAULT_BASENAME = 'screenshot';

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function normalizeCategory(c) {
  return {
    id: typeof c?.id === 'string' && c.id ? c.id : newId(),
    name: String(c?.name ?? '').trim() || t('defaultCategoryName'),
  };
}

export function normalizeFormat(f, categoryIds) {
  return {
    id: typeof f?.id === 'string' && f.id ? f.id : newId(),
    name: String(f?.name ?? '').trim() || t('defaultFormatName'),
    categoryId: categoryIds.includes(f?.categoryId) ? f.categoryId : categoryIds[0],
    width: clampInt(f?.width, 100, 7680, 1280),
    height: clampInt(f?.height, 100, 4320, 800),
  };
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => !seen.has(item.id) && seen.add(item.id));
}

export function normalizeSettings(raw = {}) {
  const s = { ...DEFAULT_SETTINGS, ...raw };

  let categories = Array.isArray(s.categories) ? uniqueById(s.categories.map(normalizeCategory)) : [];
  let formats = Array.isArray(s.formats) ? s.formats : [];
  if (!categories.length || !formats.length) {
    ({ categories, formats } = defaultLibrary());
  } else {
    const storedVersion = Number(raw.libraryVersion) || LIBRARY_VERSION;
    if (storedVersion < LIBRARY_VERSION) {
      formats = [...formats];
      addNewDefaults(categories, formats, storedVersion);
    }
  }
  s.libraryVersion = LIBRARY_VERSION;
  const categoryIds = categories.map((c) => c.id);
  s.categories = categories.map((c) => localizeDefaultName(c, 'c'));
  s.formats = uniqueById(formats.map((f) => localizeDefaultName(normalizeFormat(f, categoryIds), 'f')));

  if (!s.formats.some((f) => f.id === s.activeFormatId)) s.activeFormatId = s.formats[0].id;
  if (!categoryIds.includes(s.activeCategoryId)) s.activeCategoryId = activeFormat(s).categoryId;
  s.mode = s.mode in MODES ? s.mode : 'content';
  s.heightMode = s.heightMode in HEIGHT_MODES ? s.heightMode : 'fixed';
  s.fileType = s.fileType in FORMATS ? s.fileType : 'png';
  s.jpegQuality = clampInt(s.jpegQuality, 10, 100, 92);

  s.sizeUnit = s.sizeUnit === 'device' ? 'device' : 'css';
  s.autoFit = !!s.autoFit;
  s.lossless = !!s.lossless;
  s.saveAs = !!s.saveAs;
  s.hideDownloadUi = !!s.hideDownloadUi;
  s.delaySec = clampInt(s.delaySec, 0, 30, 0);
  s.border = clampInt(s.border, 0, 50, 0);
  s.subfolder = String(s.subfolder ?? '');
  s.baseName = String(s.baseName ?? '').slice(0, 100);
  s.filenamePattern = String(s.filenamePattern ?? '').trim() || DEFAULT_SETTINGS.filenamePattern;
  return s;
}

export async function loadSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  return normalizeSettings(settings);
}

export async function saveSettings(settings) {
  await chrome.storage.local.set({ settings: normalizeSettings(settings) });
}

export function formatsIn(settings, categoryId) {
  return settings.formats.filter((f) => f.categoryId === categoryId);
}

export function activeFormat(settings) {
  return settings.formats.find((f) => f.id === settings.activeFormatId) ?? settings.formats[0];
}

// Switches the category; if the active format is not in it, its first format becomes active
export function selectCategory(settings, categoryId) {
  settings.activeCategoryId = categoryId;
  const list = formatsIn(settings, categoryId);
  if (list.length && !list.some((f) => f.id === settings.activeFormatId)) settings.activeFormatId = list[0].id;
}

// Everything a capture needs: active format + area + height + file type
export function captureProfile(settings) {
  const format = activeFormat(settings);
  const category = settings.categories.find((c) => c.id === format.categoryId);
  return {
    name: format.name,
    category: category?.name ?? '',
    width: format.width,
    height: format.height,
    mode: settings.mode,
    freeHeight: settings.heightMode === 'free',
    format: settings.fileType,
    quality: settings.jpegQuality,
  };
}

export function describeProfile(p) {
  return `${p.width} × ${p.height} · ${MODES[p.mode].label} · ${FORMATS[p.format].label}`;
}
