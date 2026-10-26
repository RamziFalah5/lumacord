// Serve the actual build beneath the intended repository subpath, locally only.
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (!url.pathname.startsWith('/lumacord/')) throw new Error('Outside subpath');
    const file = resolve(root, decodeURIComponent(url.pathname.slice('/lumacord/'.length)) || 'index.html');
    if (!file.startsWith(root + sep)) throw new Error('Outside build');
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    response.end(content);
  } catch {
    response.writeHead(404); response.end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  const page = await browser.newPage();
  const errors = [];
  const badResponses = [];
  const outsideRequests = [];
  const origin = `http://127.0.0.1:${server.address().port}`;
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) badResponses.push(response.url()); });
  page.on('request', request => { if (!request.url().startsWith(`${origin}/lumacord/`)) outsideRequests.push(request.url()); });
  await page.goto(`${origin}/lumacord/`);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('.cord-hit').getAttribute('aria-pressed'), 'false');
  await page.locator('.cord-hit').click();
  await page.waitForFunction(() => !document.querySelector('.login-panel').inert);
  await page.getByLabel('EMAIL', { exact: true }).fill('tester@example.com');
  await page.getByLabel('PASSWORD', { exact: true }).fill('test-password');
  await page.locator('.sign-in').click();
  await page.waitForFunction(() => document.querySelector('.form-feedback').textContent.includes('Demo only'));
  await page.locator('.cord-hit').click();
  assert.equal(await page.locator('.cord-hit').getAttribute('aria-pressed'), 'false');
  assert.deepEqual(errors, []);
  assert.deepEqual(badResponses, []);
  assert.deepEqual(outsideRequests, []);
  console.log('Production /lumacord/ smoke check passed: fonts/assets, OFF/ON/OFF, demo submission, no runtime errors or external requests.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
