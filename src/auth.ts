export interface LoginCredentials {
  email: string;
  password: string;
  /** A host preference; this UI does not persist credentials or sessions. */
  remember: boolean;
}
export interface LoginContext { signal: AbortSignal }
export type SocialProvider = 'apple' | 'google';
/** Only deliberately public messages should be displayed to the user. */
export class LampLoginError extends Error {}
export interface LampLoginOptions {
  onSubmit: (credentials: LoginCredentials, context: LoginContext) => Promise<void>;
  brandName?: string;
  brandSuffix?: string;
  accentColor?: string;
  text?: Partial<{
    eyebrow: string;
    heading: string;
    subheading: string;
    emailLabel: string;
    passwordLabel: string;
    submitLabel: string;
    loadingLabel: string;
    smallPrint: string;
  }>;
  onSocialLogin?: (provider: SocialProvider, context: LoginContext) => void | Promise<void>;
  onForgotPassword?: (context: LoginContext) => void | Promise<void>;
  onRequestAccount?: (context: LoginContext) => void | Promise<void>;
}
