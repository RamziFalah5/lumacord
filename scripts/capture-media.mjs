// Genuine local application captures. Start npm run dev first.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
const page = await browser.newPage({ viewport: { width: 1280, height: 760 }, deviceScaleFactor: 1 });
const url = process.env.LUMACORD_URL || 'http://127.0.0.1:5173';
const media = resolve('media');
await mkdir(media, { recursive: true });
try {
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(media, 'off.png') });
  await page.locator('.cord-hit').click();
  await page.waitForTimeout(2600);
  await page.screenshot({ path: resolve(media, 'on.png') });

  if (process.argv.includes('--frames')) {
    const frames = resolve('.local-backup/media-frames');
    await mkdir(frames, { recursive: true });
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    const box = await page.locator('.cord-hit').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 68; i++) {
      if (i === 8 || i === 44) await page.mouse.down();
      if ((i >= 9 && i <= 13) || (i >= 45 && i <= 49)) {
        const distance = (i <= 13 ? i - 8 : i - 44) * 13;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + distance);
      }
      if (i === 14 || i === 50) await page.mouse.up();
      if (i === 40) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.screenshot({ path: resolve(frames, `${String(i).padStart(3, '0')}.png`) });
      await page.waitForTimeout(85);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.cord-hit').click();
  await page.waitForTimeout(2600);
  await page.screenshot({ path: resolve(media, 'mobile-on.png'), fullPage: true });
} finally {
  await browser.close();
}
console.log('Saved genuine application screenshots to media/.');
