// "Web page only" mode: works without window sharing (captureVisibleTab)

import { ensureFit, getActiveTab, captureTabImage } from './window-fit.js';
import { renderAndSave } from './output.js';
import { countdown } from './feedback.js';
import { t } from './i18n.js';

export async function shootPage(windowId, settings, profile) {
  if (settings.autoFit) await ensureFit(windowId, profile, settings);
  await countdown(settings.delaySec);

  const tab = await getActiveTab(windowId);
  let img;
  try {
    img = await captureTabImage(windowId);
  } catch (e) {
    throw new Error(t('errPageCapture', e.message));
  }
  try {
    return await renderAndSave({
      source: img,
      rect: { x: 0, y: 0, w: img.width, h: img.height },
      profile,
      settings,
      title: tab.title,
    });
  } finally {
    img.close();
  }
}
