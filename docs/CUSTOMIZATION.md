# Customization

Pass a small options object to `mountLampLogin`:

```ts
mountLampLogin(host, {
  onSubmit: handleLogin,
  brandName: 'YOUR BRAND',
  brandSuffix: 'STUDIO',
  accentColor: '#edb772',
  text: {
    eyebrow: 'MEMBER ACCESS',
    heading: 'Welcome back.',
    subheading: 'Pull up a chair.',
    emailLabel: 'EMAIL',
    passwordLabel: 'PASSWORD',
    submitLabel: 'Sign in',
    loadingLabel: 'Please wait…',
    smallPrint: 'Your host-provided access message.',
  },
});
```

The defaults retain the original form copy and warm palette, with LumaCord replacing the prototype's wordmark. The standalone demo overrides `smallPrint` to disclose that no authentication is configured. Keep that disclosure in any unconnected showcase.

`accentColor` changes the middle stop of the primary button gradient through `--luma-accent`; it deliberately leaves the lamp's brass, linen, and lighting materials intact. It must be a valid CSS color. Text is inserted using text nodes, never interpreted as HTML. Keep headings and labels short enough for the original composition, and check mobile and desktop layouts after changing copy.

For deeper visual work, `scene.html` contains the SVG and form markup and `style.css` contains the lighting, desktop/mobile layout, and reveal transitions. Preserve the SVG `viewBox`, cord coordinates, gradients, filters, and `.light-layer` classes when retaining the original appearance. The cord spring values and the 650ms toggle guard live in `motion.ts`. The panel's normal keyboard unlock is delayed 950ms; reduced motion unlocks immediately. These are retained choreography choices.

`style.css` is intentionally kept close to the prototype for fidelity. It uses scene classes and local fonts, with a few general descendant rules under `.room`. It is not a fully isolated theme system. Mount the scene on a dedicated full-page view, avoid host selectors that restyle its buttons/inputs/headings, and reset body margin in the host (the showcase does so in `demo.css`).

Options are read at mount time. To replace options, destroy the instance and mount a new one. Validate custom contrast, focus outlines, long error messages, reduced motion, and touch targets before shipping a theme.
