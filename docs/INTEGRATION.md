# Integrating LumaCord

LumaCord provides presentation and form state. Your application and server provide authentication. Copy `src/lamp-login.ts`, `auth.ts`, `form.ts`, `motion.ts`, `scene.html`, `style.css`, and `vite-env.d.ts` together, preserving relative imports. Install `@fontsource/dm-sans` and `@fontsource/instrument-serif`. The `?raw` scene import and CSS/font imports require Vite or equivalent bundler support.

## Mount and lifecycle

```ts
import { mountLampLogin } from './lumacord/lamp-login';
import type { LoginCredentials, LoginContext } from './lumacord/lamp-login';

async function handleLogin(credentials: LoginCredentials, context: LoginContext): Promise<void> {
  // Call your own service. See the REST example below.
}

const instance = mountLampLogin(document.querySelector<HTMLElement>('#login')!, {
  onSubmit: handleLogin,
});

// Call this before removing the host or changing application routes.
instance.destroy();
```

The host must be empty and dedicated to this view. Importing the module does not mount a scene. `destroy()` is idempotent: it aborts callback signals, disconnects observers and listeners, cancels the cord frame and reveal timer, clears the password field, and removes the scene. A host can be mounted again after destruction. Callbacks should pass the supplied signal to cancellable work and avoid updating host state after it aborts.

The default layout fills the viewport. Use it on a dedicated login route with the host page's body margin reset. SVG and form IDs are namespaced, but CSS is presentation CSS rather than Shadow DOM; host styles can affect it. Multiple instances have independent interaction state; composing several viewport scenes within one page is not a supported layout.

## Contract

```ts
interface LoginCredentials {
  email: string;
  password: string;
  remember: boolean;
}
interface LoginContext { signal: AbortSignal }
type Submit = (credentials: LoginCredentials, context: LoginContext) => Promise<void>;
```

- Email is trimmed and checked with native email validity. Password must be nonempty; the UI imposes no registration password policy and does not trim passwords.
- The checkbox is only a preference passed to the host. LumaCord never remembers credentials or creates a session.
- While a callback is pending, action buttons are disabled, fields become read-only, and the form exposes `aria-busy`. Duplicate submissions are ignored. The lamp remains interactive.
- On resolution, the password input is cleared. The host decides whether to navigate, replace the scene, or show authenticated content. There is no built-in success claim.
- On rejection, `LampLoginError.message` is displayed as text. Throw this class only for messages intentionally suitable for the user. Other exceptions receive a generic error; internal server details are not rendered.
- A callback that never settles keeps the form busy. The host owns request timeouts/retries. Destroying the view aborts its signal and suppresses late UI updates; it cannot cancel work that ignores the signal.
- Hiding the lamp does not cancel an in-flight submission. Showing it again reflects the current form state.

Passwords exist transiently in the input and callback arguments. They are never logged, stored in browser storage, or sent by the component itself. The host must also avoid logging or persisting credentials. JavaScript cannot promise secure memory erasure.

## REST example with cookie sessions

The following is illustrative host code; `/api/login` and `/api/csrf` must be implemented by your own server. Adapt response formats and CSRF behavior to that server's contract. Do not add these requests to the showcase.

```ts
import { LampLoginError, mountLampLogin } from './lumacord/lamp-login';

const login = mountLampLogin(document.querySelector<HTMLElement>('#login')!, {
  async onSubmit({ email, password, remember }, { signal }) {
    // Example synchronizer-token contract supplied by the host server.
    const csrfResponse = await fetch('/api/csrf', {
      credentials: 'same-origin', signal,
    });
    if (!csrfResponse.ok) throw new LampLoginError('Unable to start sign-in. Please try again.');
    const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
    if (typeof csrfToken !== 'string' || !csrfToken) throw new Error('Invalid CSRF response');

    const response = await fetch('/api/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ email, password, remember }),
      signal,
    });

    if (response.status === 401) throw new LampLoginError('Email or password was not accepted.');
    if (response.status === 429) throw new LampLoginError('Too many attempts. Please try again later.');
    if (!response.ok) throw new LampLoginError('Sign-in is unavailable. Please try again.');
    if (signal.aborted) return;

    // The server sets its session cookie. Your host can refresh session state,
    // replace this view, or navigate to a route that actually exists.
    // For token-based services, token policy also belongs to the host.
  },
});
```

Use HTTPS for production. The backend must validate credentials, authorize requests, enforce rate limits, and manage session expiry. For cookie sessions, configure appropriate `HttpOnly`, `Secure`, and `SameSite` settings on the server. The frontend alone does not provide secure authentication.

For a cross-origin API, use a host-configured URL and `credentials: 'include'` only when required by your server. Credentialed CORS requires the server to allow the exact application origin and credentials; a wildcard origin is unsuitable. JSON and custom CSRF headers can require preflight handling. Browser third-party-cookie policies may prevent cross-site sessions even when CORS is configured. See [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) and [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).

CORS is not a replacement for CSRF defenses. Use the server/framework's established protection, including login and recovery endpoints; validate its CSRF tokens and origin policy. `SameSite` supplies an additional layer, not a complete design by itself. See [MDN CSRF guidance](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF).

## Optional actions

```ts
mountLampLogin(host, {
  onSubmit: handleLogin,
  onSocialLogin: async (provider, { signal }) => { /* host OAuth flow */ },
  onForgotPassword: async ({ signal }) => { /* host recovery flow */ },
  onRequestAccount: async ({ signal }) => { /* host registration flow */ },
});
```

Social providers remain `'apple' | 'google'`, matching the Apple and Google text labels; the callback contract is unchanged. The buttons use neutral identity/shield icons drawn for this project, rather than provider logos. Names describe optional host-provided actions and do not indicate endorsement, partnership, certification or an official integration. A real host integration must satisfy its provider's current requirements independently.

Missing callbacks remain marked “demo only” through their accessible names and tooltips; clicking them gives explicit demo feedback. Configured actions share loading and safe-error handling with submission. No OAuth SDK, popup, reset request, or redirect is provided by LumaCord.

## React host example

The project itself does not depend on React. In an existing React application, mount the scene through an effect and supply a stable callback:

```tsx
import { useEffect, useRef } from 'react';
import { mountLampLogin, type LampLoginOptions } from './lumacord/lamp-login';

export function LoginView({ onSubmit }: Pick<LampLoginOptions, 'onSubmit'>) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const login = mountLampLogin(host.current!, { onSubmit });
    return () => login.destroy();
  }, [onSubmit]);
  return <div ref={host} />;
}
```

This is an integration example, not a shipped React wrapper. Changing callback identity remounts the scene, so use a stable host callback if the parent rerenders frequently. Client-side mounting belongs in an effect when using server rendering.
