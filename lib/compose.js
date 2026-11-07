// Analyses a window image from the window share:
//  1. Determine the scale (device pixels per logical pixel)
//  2. Find the actual window in the image (shadow borders on Linux, invisible borders on Windows)
//  3. Locate the web page in the image (matched against captureVisibleTab), to cut out the content
//     area exactly and insert the page content losslessly

import { t } from './i18n.js';

const LUMA_TOLERANCE = 10; // mean luma difference above which a match counts as failed
const DARK = 20; // highest channel value that still counts as a transparent shadow border

function readPixels(src) {
  const canvas = new OffscreenCanvas(src.width, src.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(src, 0, 0);
  return ctx.getImageData(0, 0, src.width, src.height).data;
}

function luma(d, o) {
  return (d[o] * 77 + d[o + 1] * 150 + d[o + 2] * 29) >> 8;
}

function guessScale(fw, win, dpr) {
  const sx = fw / win.width;
  return Math.abs(sx - dpr) / dpr < 0.08 ? dpr : sx;
}

// Per axis: is the image larger (shadow border → inset) or smaller (invisible border → shrink)?
function fitAxis(frameSize, expected) {
  const d = frameSize - expected;
  return d >= -2 ? { inset: Math.max(0, d), shrink: 0 } : { inset: 0, shrink: -d };
}

function isDarkLine(data, fw, fh, axis, index) {
  const len = axis === 'x' ? fh : fw;
  const step = Math.max(1, Math.floor(len / 200));
  let dark = 0, total = 0;
  for (let i = 0; i < len; i += step) {
    const o = (axis === 'x' ? i * fw + index : index * fw + i) * 4;
    if (Math.max(data[o], data[o + 1], data[o + 2]) <= DARK) dark++;
    total++;
  }
  return dark / total >= 0.97;
}

function darkRun(data, fw, fh, axis, fromEnd, max) {
  const len = axis === 'x' ? fw : fh;
  let n = 0;
  while (n < max && isDarkLine(data, fw, fh, axis, fromEnd ? len - 1 - n : n)) n++;
  return n;
}

function findOffset(data, fw, fh, axis, inset) {
  const lead = darkRun(data, fw, fh, axis, false, inset);
  const trail = darkRun(data, fw, fh, axis, true, inset);
  if (lead) return Math.min(lead, inset);
  if (trail) return inset - Math.min(trail, inset);
  // No shadow detected: vertically this is usually a window manager title bar (at the top)
  return axis === 'y' ? inset : Math.round(inset / 2);
}

// Samples from the tab image: edges preferred (they pin down the exact pixel position)
function pickSamples(tdata, tw, th) {
  const grid = [];
  const cols = 120, rows = 80;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = Math.min(tw - 2, Math.floor(((i + 0.5) * tw) / cols));
      const y = Math.min(th - 2, Math.floor(((j + 0.5) * th) / rows));
      const o = (y * tw + x) * 4;
      const l = luma(tdata, o);
      const g = Math.abs(l - luma(tdata, o + 4)) + Math.abs(l - luma(tdata, o + tw * 4));
      grid.push({ x, y, l, g });
    }
  }
  const strong = grid.filter((p) => p.g > 24).sort((a, b) => b.g - a.g).slice(0, 1000);
  const plain = grid.filter((_, k) => k % 13 === 0).slice(0, 500);
  return strong.concat(plain);
}

function score(fdata, fw, samples, cx, cy, limit) {
  const max = limit * samples.length;
  let sum = 0;
  for (const p of samples) {
    sum += Math.abs(luma(fdata, ((cy + p.y) * fw + cx + p.x) * 4) - p.l);
    if (sum > max) return Infinity;
  }
  return sum / samples.length;
}

function matchViewport(fdata, fw, fh, tabImg, anchors, ay, rx, ry) {
  const tw = tabImg.width, th = tabImg.height;
  const samples = pickSamples(readPixels(tabImg), tw, th);
  const results = [];
  let best = Infinity;

  for (const anchor of anchors) {
    for (let dy = -ry; dy <= ry; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        const x = anchor.x + dx, y = ay + dy;
        if (x < 0 || y < 0 || x + tw > fw || y + th > fh) continue;
        const sc = score(fdata, fw, samples, x, y, Math.min(best + 1, LUMA_TOLERANCE + 1));
        if (sc === Infinity) continue;
        best = Math.min(best, sc);
        results.push({ x, y, sc, side: anchor.side, penalty: Math.abs(dx) + Math.abs(dy) + (anchor.side === 'right' ? 0 : 0.5) });
      }
    }
  }
  if (best > LUMA_TOLERANCE) return null;
  // With equally good matches (single-colour pages), prefer the expected position
  return results.filter((r) => r.sc <= best + 0.75).sort((a, b) => a.penalty - b.penalty)[0];
}

/**
 * @returns {{ scale, crop: {x,y,w,h}, paste: {x,y}|null, calib: {dw,dh}, notes: string[] }}
 */
export function analyzeFrame({ frame, win, tab, tabImg, mode, borderDip = 0, fallbackScale = 1 }) {
  const fw = frame.width, fh = frame.height;
  const notes = [];

  let s = tabImg ? tabImg.width / tab.width : guessScale(fw, win, fallbackScale);
  let canPaste = !!tabImg;
  if (fw < win.width * s * 0.94 || fh < win.height * s * 0.94) {
    // The share delivers a downscaled image
    s = Math.min(fw / win.width, fh / win.height);
    if (canPaste) notes.push(t('noteReducedResolution'));
    canPaste = false;
  }

  const ew = Math.round(win.width * s), eh = Math.round(win.height * s);
  if (fw > ew * 1.25 || fh > eh * 1.25) throw new Error(t('errWrongWindow'));

  const data = readPixels(frame);
  const ax = fitAxis(fw, ew), ay = fitAxis(fh, eh);
  const wr = {
    x: ax.inset ? findOffset(data, fw, fh, 'x', ax.inset) : 0,
    y: ay.inset ? findOffset(data, fw, fh, 'y', ay.inset) : 0,
    w: Math.min(ew, fw),
    h: Math.min(eh, fh),
  };
  const b = Math.round(borderDip * s);

  const vw = canPaste ? tabImg.width : Math.round(tab.width * s);
  const vh = canPaste ? tabImg.height : Math.round(tab.height * s);
  // Expected layout: the web page ends at the bottom window edge, side panel on the right (or none)
  let vx = wr.x + b;
  let vy = wr.y + wr.h - b - vh;
  let matched = null;

  if (canPaste) {
    const anchors = [{ x: wr.x + b, side: 'right' }];
    const leftPanelX = wr.x + wr.w - b - vw;
    if (Math.abs(leftPanelX - anchors[0].x) > 1) anchors.push({ x: leftPanelX, side: 'left' });
    const base = Math.ceil(10 * s);
    matched = matchViewport(data, fw, fh, tabImg, anchors, vy, ax.inset + base, ay.inset + base);

    if (matched) {
      vx = matched.x;
      vy = matched.y;
      if (ax.inset) {
        const x = matched.side === 'right' ? vx - b : vx + vw + b - wr.w;
        wr.x = Math.min(Math.max(0, x), fw - wr.w);
      }
      if (ay.inset) wr.y = Math.min(Math.max(0, vy + vh + b - wr.h), fh - wr.h);
    } else {
      notes.push(t('notePageNotFound'));
    }
  } else if (!tabImg) {
    notes.push(t('noteNoTabImage'));
  }

  const crop = mode === 'window'
    ? { ...wr }
    : { x: wr.x + b, y: Math.max(0, vy), w: wr.w - 2 * b, h: Math.min(vh, fh - Math.max(0, vy)) };

  return {
    scale: s,
    crop,
    paste: matched ? { x: vx - crop.x, y: vy - crop.y } : null,
    calib: { dw: ax.shrink / s, dh: ay.shrink / s },
    notes,
  };
}

export function composeCrop(frame, tabImg, analysis, lossless) {
  const { crop, paste } = analysis;
  const canvas = new OffscreenCanvas(crop.w, crop.h);
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.drawImage(frame, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
  if (lossless && paste && tabImg) {
    ctx.drawImage(tabImg, paste.x, paste.y);
    analysis.notes.push(t('noteLossless'));
  }
  return canvas;
}
