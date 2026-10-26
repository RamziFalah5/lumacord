import { test, expect, type Page } from '@playwright/test';

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
});
test.afterEach(async ({ page }) => { expect(runtimeErrors.get(page)).toEqual([]); });

async function illuminate(page: Page) {
  await page.locator('.cord-hit').click();
  await expect(page.locator('.login-panel')).toHaveJSProperty('inert', false);
}

test('starts OFF, keeps hidden form out of Tab order, and reveals/hides with keyboard', async ({ page }) => {
  await page.goto('/');
  const cord = page.locator('.cord-hit');
  await expect(cord).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.login-panel')).toHaveJSProperty('inert', true);
  await page.keyboard.press('Tab');
  await expect(cord).toBeFocused();
  await cord.press('Enter');
  await expect(page.locator('.login-panel')).toHaveJSProperty('inert', false);
  await expect(page.locator('.light-layer').first()).toHaveCSS('opacity', '1');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('EMAIL', { exact: true })).toBeFocused();
  // Programmatic AT activation while the field has focus must restore focus.
  await cord.evaluate(button => (button as HTMLButtonElement).click());
  await expect(cord).toHaveAttribute('aria-pressed', 'false');
  await expect(cord).toBeFocused();
  await expect(page.locator('.login-panel')).toHaveJSProperty('inert', true);
  await page.waitForTimeout(680);
  await cord.press('Space');
  await expect(cord).toHaveAttribute('aria-pressed', 'true');
});

test('rapid toggles cannot unlock an OFF form; repeated cycles keep working', async ({ page }) => {
  await page.goto('/');
  const cord = page.locator('.cord-hit');
  await cord.click();
  // Original 650ms switch guard is intentional.
  await cord.evaluate(button => { for (let i = 0; i < 8; i++) (button as HTMLButtonElement).click(); });
  await expect(cord).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(680);
  await cord.click();
  await page.waitForTimeout(1000);
  await expect(page.locator('.login-panel')).toHaveJSProperty('inert', true);
  await expect(cord).toHaveAttribute('aria-pressed', 'false');
  for (let i = 0; i < 4; i++) {
    await cord.click();
    await expect(cord).toHaveAttribute('aria-pressed', String(i % 2 === 0));
    await page.waitForTimeout(680);
  }
});

test('a physical drag toggles exactly once and cancellation never toggles', async ({ page }) => {
  await page.goto('/');
  const cord = page.locator('.cord-hit');
  const box = (await cord.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 15, box.y + box.height / 2 + 80, { steps: 12 });
  await page.mouse.up();
  await expect(cord).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(900);
  await expect(cord).toHaveAttribute('aria-pressed', 'true');
  await cord.evaluate(button => button.addEventListener('pointerdown', event => { (button as HTMLElement).dataset.pointer = String((event as PointerEvent).pointerId); }, { once: true }));
  const resting = (await cord.boundingBox())!;
  await page.mouse.move(resting.x + 24, resting.y + 25);
  await page.mouse.down();
  await page.mouse.move(resting.x + 24, resting.y + 80);
  await expect(page.locator('.room')).toHaveClass(/is-pulling/);
  await cord.dispatchEvent('pointercancel', { pointerId: Number(await cord.getAttribute('data-pointer')), pointerType: 'mouse' });
  await page.mouse.up();
  await expect(page.locator('.room')).not.toHaveClass(/is-pulling/);
  await expect(cord).toHaveAttribute('aria-pressed', 'true');
});

test('mobile touch, reduced motion and narrow layout work', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('.cord-hit').tap();
  await expect(page.locator('.login-panel')).toHaveJSProperty('inert', false);
  await expect(page.locator('.dust')).toBeHidden();
  await page.getByLabel('EMAIL', { exact: true }).fill('tester@example.com');
  await page.getByLabel('PASSWORD', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).tap();
  await expect(page.locator('.form-feedback')).toContainText('Demo only');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await context.close();
});

test('validates controls, toggles password and rejects the demo without network authentication', async ({ page }) => {
  const remoteRequests: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5173')) remoteRequests.push(request.url()); });
  await page.goto('/');
  await illuminate(page);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.form-feedback')).toHaveText('Enter a valid email address.');
  await expect(page.getByLabel('EMAIL', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('EMAIL', { exact: true }).fill('tester@example.com');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.form-feedback')).toHaveText('Enter your password.');
  await page.getByLabel('PASSWORD', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(page.getByLabel('PASSWORD', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.sign-in')).toBeDisabled();
  await expect(page.locator('.form-feedback')).toContainText('Demo only');
  await expect(page.locator('.sign-in')).toBeEnabled();
  await page.getByRole('button', { name: 'Google (demo only)', exact: true }).click();
  await expect(page.locator('.form-feedback')).toContainText('not connected');
  expect(remoteRequests).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
});

test('host callback gets credentials once, controls success and cleans up during pending submission', async ({ page }) => {
  await page.goto('/tests/harness.html');
  await page.evaluate(async () => {
    const moduleUrl = '/src/lamp-login.ts';
    const { mountLampLogin } = await import(moduleUrl);
    const state = window as unknown as { calls: unknown[]; finish: () => void; destroy: () => void; aborted: boolean };
    state.calls = [];
    const instance = mountLampLogin(document.querySelector('#test-host'), {
      async onSubmit(credentials: unknown, { signal }: { signal: AbortSignal }) {
        state.calls.push(credentials);
        signal.addEventListener('abort', () => { state.aborted = true; });
        await new Promise<void>(resolve => { state.finish = resolve; });
      },
    });
    state.destroy = instance.destroy;
  });
  await illuminate(page);
  await page.getByLabel('EMAIL', { exact: true }).fill('tester@example.com');
  await page.getByLabel('PASSWORD', { exact: true }).fill('test-password');
  await page.locator('.sign-in').click();
  await page.locator('form').evaluate(form => { form.dispatchEvent(new Event('submit', { cancelable: true })); });
  expect(await page.evaluate(() => (window as unknown as { calls: unknown[] }).calls)).toEqual([{ email: 'tester@example.com', password: 'test-password', remember: true }]);
  await page.evaluate(() => (window as unknown as { finish: () => void }).finish());
  await expect(page.locator('.sign-in')).toBeEnabled();
  await expect(page.getByLabel('PASSWORD', { exact: true })).toHaveValue('');
  await expect(page.locator('.form-feedback')).toBeHidden();
  await page.getByLabel('PASSWORD', { exact: true }).fill('test-password');
  await page.locator('.sign-in').click();
  await page.evaluate(() => {
    const state = window as unknown as { destroy: () => void; finish: () => void };
    state.destroy(); state.destroy(); state.finish();
  });
  expect(await page.evaluate(() => (window as unknown as { aborted: boolean }).aborted)).toBe(true);
  await expect(page.locator('#test-host')).toBeEmpty();
});

test('safe errors and optional host actions are supported', async ({ page }) => {
  await page.goto('/tests/harness.html');
  await page.evaluate(async () => {
    const moduleUrl = '/src/lamp-login.ts';
    const { mountLampLogin, LampLoginError } = await import(moduleUrl);
    mountLampLogin(document.querySelector('#test-host'), {
      text: { submitLabel: 'Continue', heading: '<b>Custom heading</b>' },
      async onSubmit() { throw new Error('private server detail'); },
      async onSocialLogin(provider: string) { throw new LampLoginError(`Host ${provider} unavailable`); },
    });
  });
  await illuminate(page);
  await expect(page.locator('h1')).toContainText('<b>Custom heading</b>');
  await page.getByLabel('EMAIL', { exact: true }).fill('tester@example.com');
  await page.getByLabel('PASSWORD', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.form-feedback')).toHaveText('Unable to continue. Please try again.');
  await page.getByRole('button', { name: 'Google', exact: true }).click();
  await expect(page.locator('.form-feedback')).toHaveText('Host google unavailable');
});

test('LumaCord defaults and accessible branding remain customizable without changing provider callbacks', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('main', { name: 'LumaCord login', exact: true })).toBeVisible();
  await expect(page.locator('.wordmark')).toHaveAttribute('aria-label', 'LumaCord Studio');
  await expect(page.locator('.wordmark')).toHaveText('LUMACORD STUDIO');
  await page.goto('/tests/harness.html');
  await page.evaluate(async () => {
    const moduleUrl = '/src/lamp-login.ts';
    const { mountLampLogin, LampLoginError } = await import(moduleUrl);
    mountLampLogin(document.querySelector('#test-host'), {
      brandName: 'NORTH LIGHT',
      brandSuffix: 'MEMBERS',
      async onSubmit() {},
      async onSocialLogin(provider: string) { throw new LampLoginError(`Host received ${provider}`); },
    });
  });
  await expect(page.getByRole('main', { name: 'NORTH LIGHT login', exact: true })).toBeVisible();
  await expect(page.locator('.wordmark')).toHaveText('NORTH LIGHT MEMBERS');
  await expect(page.locator('.wordmark')).toHaveAttribute('aria-label', 'NORTH LIGHT MEMBERS');
  await illuminate(page);
  await expect(page.getByRole('region', { name: 'NORTH LIGHT access', exact: true })).toBeVisible();
  await expect(page.locator('[id$="-lamp-status"]')).toContainText('NORTH LIGHT access');
  for (const provider of ['Apple', 'Google']) {
    const button = page.getByRole('button', { name: provider, exact: true });
    await expect(button.locator('svg.provider-icon')).toHaveCount(1);
    await button.click();
    await expect(page.locator('.form-feedback')).toHaveText(`Host received ${provider.toLowerCase()}`);
  }
});
