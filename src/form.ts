import { LampLoginError, type LampLoginOptions, type SocialProvider } from './auth';

export function connectForm(root: HTMLElement, options: LampLoginOptions): () => void {
  const lifetime = new AbortController();
  const form = root.querySelector('form')!;
  const email = form.elements.namedItem('email') as HTMLInputElement;
  const password = form.elements.namedItem('password') as HTMLInputElement;
  const remember = form.elements.namedItem('remember') as HTMLInputElement;
  const submit = form.querySelector<HTMLButtonElement>('.sign-in')!;
  const label = submit.querySelector('.submit-label')!;
  const feedback = form.querySelector<HTMLElement>('.form-feedback')!;
  const showPassword = form.querySelector<HTMLButtonElement>('.show-password')!;
  const idleLabel = label.textContent;
  let busy = false;
  let destroyed = false;
  function message(value: string) {
    feedback.textContent = value;
    feedback.hidden = !value;
  }
  const actionButtons = [...root.querySelectorAll<HTMLButtonElement>('form button, .panel-footer button')];
  async function run(action: () => void | Promise<void>) {
    if (busy || destroyed) return;
    busy = true;
    form.setAttribute('aria-busy', 'true');
    actionButtons.forEach(button => { button.disabled = true; });
    email.readOnly = password.readOnly = true;
    remember.disabled = true;
    label.textContent = options.text?.loadingLabel ?? 'Please wait…';
    message('');
    try {
      await action();
    } catch (error) {
      if (!destroyed) message(error instanceof LampLoginError ? error.message : 'Unable to continue. Please try again.');
    } finally {
      if (!destroyed) {
        busy = false;
        form.setAttribute('aria-busy', 'false');
        actionButtons.forEach(button => { button.disabled = false; });
        email.readOnly = password.readOnly = false;
        remember.disabled = false;
        label.textContent = idleLabel;
      }
    }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (busy || root.querySelector<HTMLElement>('.login-panel')!.inert) return;
    email.value = email.value.trim();
    const invalid = [email, password].filter(input => !input.validity.valid);
    for (const input of [email, password]) {
      input.setAttribute('aria-invalid', String(invalid.includes(input)));
      if (invalid.includes(input)) input.setAttribute('aria-describedby', feedback.id);
      else input.removeAttribute('aria-describedby');
    }
    if (invalid.length) {
      message(!email.validity.valid ? 'Enter a valid email address.' : 'Enter your password.');
      invalid[0].focus();
      return;
    }
    void run(async () => {
      await options.onSubmit({ email: email.value, password: password.value, remember: remember.checked }, { signal: lifetime.signal });
      if (!destroyed) password.value = '';
    });
  }, { signal: lifetime.signal });
  feedback.id = `${email.id}-feedback`;
  form.addEventListener('input', event => {
    if (event.target instanceof HTMLInputElement) {
      event.target.removeAttribute('aria-invalid');
      event.target.removeAttribute('aria-describedby');
    }
    message('');
  }, { signal: lifetime.signal });
  showPassword.addEventListener('click', () => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    showPassword.textContent = show ? 'HIDE' : 'SHOW';
    showPassword.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    showPassword.setAttribute('aria-pressed', String(show));
  }, { signal: lifetime.signal });
  function external(button: HTMLButtonElement, action: (() => void | Promise<void>) | undefined) {
    if (!action) {
      button.title = 'Demo only — no authentication service configured';
      button.setAttribute('aria-label', `${button.textContent?.trim()} (demo only)`);
    }
    button.addEventListener('click', () => {
      void run(action ?? (() => { throw new LampLoginError('Demo only. This action is not connected to an authentication service.'); }));
    }, { signal: lifetime.signal });
  }
  const context = { signal: lifetime.signal };
  external(form.querySelector('.form-options button')!, options.onForgotPassword ? () => options.onForgotPassword!(context) : undefined);
  external(root.querySelector('.panel-footer button')!, options.onRequestAccount ? () => options.onRequestAccount!(context) : undefined);
  form.querySelectorAll<HTMLButtonElement>('.socials button').forEach((button, index) => {
    const provider: SocialProvider = index === 0 ? 'apple' : 'google';
    external(button, options.onSocialLogin ? () => options.onSocialLogin!(provider, context) : undefined);
  });
  return () => {
    destroyed = true;
    lifetime.abort();
    password.value = '';
  };
}
