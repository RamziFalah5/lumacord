import scene from './scene.html?raw';
import './style.css';
import { connectMotion } from './motion';
import { connectForm } from './form';

export { LampLoginError } from './auth';
export type { LoginCredentials, LoginContext, SocialProvider, LampLoginOptions } from './auth';
import type { LampLoginOptions } from './auth';

export interface LampLoginInstance { destroy(): void }
let nextId = 0;
const mounted = new WeakSet<HTMLElement>();

/** Mount one complete scene into an empty host. Call destroy before removing it. */
export function mountLampLogin(host: HTMLElement, options: LampLoginOptions): LampLoginInstance {
  if (mounted.has(host) || host.childNodes.length) throw new Error('LumaCord needs an empty, unmounted host.');
  if (typeof options.onSubmit !== 'function') throw new TypeError('onSubmit is required.');
  if (options.accentColor && !CSS.supports('color', options.accentColor)) throw new TypeError('accentColor must be a CSS color.');
  const prefix = `lumacord-${++nextId}-`;
  host.innerHTML = scene.replace(/\bid="([^"]+)"/g, `id="${prefix}$1"`)
    .replace(/\bfor="([^"]+)"/g, `for="${prefix}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`);
  const root = host.firstElementChild as HTMLElement;
  const accessibleBrand = options.brandName ?? 'LumaCord';
  root.setAttribute('aria-label', `${accessibleBrand} login`);
  root.querySelector('.login-panel')!.setAttribute('aria-label', `${accessibleBrand} access`);
  const setText = (selector: string, value?: string) => {
    if (value !== undefined) root.querySelector(selector)!.textContent = value;
  };
  const wordmark = root.querySelector('.wordmark')!;
  wordmark.firstChild!.textContent = `${options.brandName ?? 'LUMACORD'} `;
  setText('.wordmark span', options.brandSuffix ?? 'STUDIO');
  wordmark.setAttribute('aria-label', `${options.brandName ?? 'LumaCord'} ${options.brandSuffix ?? 'Studio'}`);
  const text = options.text ?? {};
  setText('.eyebrow', text.eyebrow);
  if (text.heading !== undefined) root.querySelector('h1')!.firstChild!.textContent = text.heading;
  setText('h1 em', text.subheading);
  setText('label[for$="-email"]', text.emailLabel);
  setText('label[for$="-password"]', text.passwordLabel);
  setText('.submit-label', text.submitLabel);
  setText('.small-print', text.smallPrint);
  if (options.accentColor) root.style.setProperty('--luma-accent', options.accentColor);
  const disconnectMotion = connectMotion(root);
  const disconnectForm = connectForm(root, options);
  mounted.add(host);
  let destroyed = false;
  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      disconnectForm();
      disconnectMotion();
      root.remove();
      mounted.delete(host);
    },
  };
}
