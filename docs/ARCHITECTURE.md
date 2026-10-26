# Architecture and release preparation

## Preserved rendering

The original prototype used Vite and TypeScript, not React. Its lamp is an inline SVG with gradient materials, a turbulence-based linen texture, layered glows and shadows. CSS transitions switch `.light-layer` opacity, then reveal the panel and its ordered children. A requestAnimationFrame controller integrates a damped spring for the cord, updating both SVG geometry and the overlaid pointer target.

`scene.html` retains that geometry. `motion.ts` retains the spring constants, pointer thresholds, 650ms toggle guard, and reveal timing. The extraction scopes DOM queries to the mounted scene and adds cleanup for listeners, timers, observer, pointer capture, and animation frames. A ResizeObserver keeps desktop scale aligned with the host's width. Form IDs and SVG references receive an instance prefix.

`lamp-login.ts` mounts the markup, applies a few safe text/color overrides, and owns lifetime. `auth.ts` is the small public contract shared with `form.ts`; keeping it separate avoids circular runtime imports. `form.ts` owns validation and a single pending action, with an abort signal and safe public errors. `main.ts` supplies the explicitly unconnected demo handler. There are no network or storage adapters in the component.

During Phase 1, stable-state browser comparisons against the restored original matched pixel-for-pixel at desktop 1280 x 760 (OFF and ON) and mobile 390 x 1060 (ON), after masking the intentional wordmark/demo-notice changes and fixing dust animation progress. The original source spring constants and transition timings are preserved. The full motion timeline was exercised, but was not subjected to frame-by-frame visual regression testing. Original captures and difference images remain local in the ignored backup directory.

The final branding cleanup was compared against its own Phase 1 baseline: desktop OFF remained identical, while desktop and mobile ON differences were confined to the two provider-icon glyphs. Source wordmark/accessibility defaults now identify LumaCord; custom brand labels and the existing provider callback values were verified. Media was recaptured to reflect the neutral icons.

The source is reused directly rather than packaged as a library. A Vite-compatible bundler processes the raw HTML, CSS, and Fontsource imports. Styling and viewport composition remain intentionally close to the prototype.

## Local restoration

The implementation session created `.local-backup/original-prototype.zip` before source edits, plus original OFF/ON browser captures. This directory is ignored and blocked from Vite's development filesystem serving. Do not publish or commit it. To restore, first preserve current work separately, then extract the original archive to a separate review folder and copy only the files you intend to restore. Nothing in the preparation overwrites Git history.

No Git repository or remotes existed during the initial engineering phases. The owner-authorized first release initializes `main` without rewriting prior history. The repository name is `lumacord`. `private: true` prevents accidental npm publication; it does not affect the public GitHub source release.

## Validation and media

The Playwright suite covers initial OFF state, hidden focus, keyboard activation, activation/deactivation, interrupted reveal, repeated toggles, drag/click deduplication, pointer cancellation, emulated mobile touch, reduced motion, validation, password visibility, callback data, duplicate submissions, loading, successful callback completion, safe rejection, optional actions, and unmount during a pending callback. Test fixtures contain only synthetic example credentials.

`npm run typecheck` checks source, tests, and tool configuration. `npm run build` targets `/lumacord/`, while development stays at the root URL. `npm run audit` (an alias of `npm run audit:release`) checks candidate file paths, common secret patterns, personal absolute paths/email addresses, and build asset extensions/URLs. Once Git is initialized, it also inspects tracked files: ignored files already tracked still trigger the candidate audit. This is a targeted hygiene check, not a guarantee that every secret or licensing issue can be detected.

`npm run test:production` serves the build locally below `/lumacord/` and checks fonts/assets, OFF/ON/OFF, demo submission, runtime errors, and requests outside that subpath.

The CI workflow installs the lockfile, installs Chromium, runs TypeScript and browser checks, builds, audits candidate files, and checks dependency advisories. A dependent Pages job deploys only successful `main` builds, with Pages/OIDC permissions confined to that job. Pull requests validate without deploying.

To regenerate actual application media, start `npm run dev` and run:

```sh
npm run media:capture
```

This captures desktop OFF/ON and mobile ON PNGs. For the short GIF, use actual screenshot frames:

```sh
npm run media:capture -- --frames
python scripts/encode-preview.py
```

The optional encoder requires Pillow. It scales 68 actual browser frames to 960 × 570 with a shared 128-color palette. It does not synthesize application states. Raw frames stay in ignored local storage. On Windows with Chrome installed, `$env:PLAYWRIGHT_CHANNEL='chrome'` can select that browser for tests and captures; otherwise install Chromium with `npx playwright install chromium`. A full video is not included. To record one later, use the browser at 1280 × 760, wait for fonts, then record OFF → downward pull → ON/reveal → pause → downward pull → OFF with no credentials entered.

The real screenshots and GIF belong under `media/`, outside `public/`; they are repository documentation, not production payload. Only the favicon and font notices are copied from `public/`. The original fonts are bundled locally.

## First release

The owner confirmed scratch-generated AI-assisted source, inspiration-only use of references, and the copyright holder Ramzi Abu Falah. The standard 2026 MIT license covers project material; dependency and font licenses remain separate. Provider-logo artwork has been replaced by neutral project-drawn SVG icons, with descriptive provider labels and callback identifiers unchanged. Local reference video, screenshots and analysis images remain excluded. See [provenance and licensing](PROVENANCE.md).

Deployment uses the official configure/upload/deploy Pages actions, and the actual URL returned by Pages is used for public links after verification. Browser behavior has been exercised in Chrome on Windows with mobile emulation. Physical touch devices, Safari, Firefox, screen-reader behavior, and a complete contrast/WCAG audit require follow-up. These limits remain visible in release review.
