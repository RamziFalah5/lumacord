# Provenance and licensing checklist

The project is released under the [MIT License](../LICENSE), copyright (c) 2026 Ramzi Abu Falah. The owner explicitly confirmed this attribution identity and authorized publication. The owner also confirmed that the initial application was generated from scratch using AI coding assistance, with the external video and screenshots used only as visual inspiration. No external source code or original reference assets were intentionally copied. This records the owner's confirmation, not an independently reconstructed authorship history or a guarantee against similarity.

## Distributable material

| Material | Available evidence | Release treatment |
| --- | --- | --- |
| Preexisting lamp SVG, favicon, styling, cord physics and scene composition | Owner confirmed scratch-generated AI-assisted implementation and inspiration-only use of external references | Preserved implementation included in the owner-authorized MIT release |
| Integration API, form behavior, tests, scripts and documentation | AI-assisted engineering additions made during Phase 1 and cleanup | Included in the owner-authorized MIT release |
| Neutral identity and shield icons in `scene.html` | Simple SVG geometry drawn in code during cleanup; no external icon library or provider-logo paths used | AI-assisted project artwork included in the release |
| DM Sans 5.3.0 and Instrument Serif 5.3.0 | Installed Fontsource packages declare OFL-1.1; both full notices in `public/licenses/` match their installed originals byte-for-byte | Keep copyright and OFL notices with distributed fonts, including production assets |
| Third-party build/test dependencies | Versions and integrity records in `package-lock.json`; installed package license metadata reviewed | Retain the lockfile; dependencies keep their own licenses and are not relicensed as project MIT code |
| Screenshots and preview GIF in `media/` | Real captures of the running application with empty credential fields, regenerated after logo removal | No browser chrome, personal account information or external reference frames included |

Direct tooling licenses: Vite is MIT; TypeScript and Playwright are Apache-2.0; `@types/node` is MIT. Installed transitive tooling declares MIT, ISC, BSD-3-Clause or Apache-2.0. Tool dependencies are installed through npm, rather than copied into the source repository. The production runtime remains native DOM/SVG/CSS with locally bundled fonts.

## Provider names and excluded references

Apple and Google logo artwork has been removed from the distributable scene and recaptured media. The remaining provider names are descriptive text identifying the optional `'apple'` and `'google'` host callbacks. The icons are neutral symbols, not official sign-in buttons. LumaCord does not claim endorsement, partnership, certification or an official integration, and implements no OAuth flow. A host supplying a real provider flow must review that provider's current branding and integration requirements for its own application.

The third-party video, its screenshots, analysis images, earlier captures and restoration archives stay in ignored local folders. No redistribution permission is assumed or granted for those references. They are excluded from release candidates and production assets. Neither the reference creator nor the authentication providers have endorsed LumaCord. The file review found no remaining provider-logo paths, redistributed reference media or specifically identified unresolved third-party source in release candidates.

## First-release confirmations

- [x] Owner confirmed the copyright holder as Ramzi Abu Falah and authorized the 2026 MIT release.
- [x] Owner confirmed scratch-generated AI-assisted source and inspiration-only references, with no intentionally copied external source or original reference assets.
- [x] Source/media candidates reviewed; no specific unresolved third-party item identified. Reference media remains excluded.
- [x] AI-assisted engineering additions and neutral artwork included in the owner-authorized release; AI assistance is documented without a guarantee against similarity.
- [x] Provider names remain descriptive; the project claims no official integration or endorsement. A real host integration must independently meet provider requirements.
- [x] Both complete font notices retained byte-for-byte; third-party dependency licenses remain separate.
- [x] Standard MIT `LICENSE` added with the explicitly confirmed holder and 2026 year.

The MIT notice must accompany copies or substantial portions of MIT-licensed software; see the [MIT license text](https://choosealicense.com/licenses/mit/). Font redistribution retains its separate terms: see the [official SIL OFL text](https://openfontlicense.org/open-font-license-official-text/). These references explain notice requirements; the owner's confirmation supplies the provenance record for this release. Future contributions and assets require their own review.
