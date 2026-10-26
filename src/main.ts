import { LampLoginError, mountLampLogin } from './lamp-login';
import './demo.css';

const login = mountLampLogin(document.querySelector<HTMLElement>('#app')!, {
  text: { smallPrint: 'Demo only. No real authentication is configured.' },
  async onSubmit(_credentials, { signal }) {
    await new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('Unmounted', 'AbortError'));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, 800);
      signal.addEventListener('abort', onAbort, { once: true });
    });
    throw new LampLoginError('Demo only. Connect your own onSubmit handler to authenticate.');
  },
});

if (import.meta.hot) import.meta.hot.dispose(() => login.destroy());
