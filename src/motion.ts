/** Original SVG spring and CSS choreography, scoped to a mounted scene. */
export function connectMotion(root: HTMLElement): () => void {
  const room = root;
  const stage = root.querySelector<HTMLElement>('.stage')!;
  const lampArea = root.querySelector<HTMLElement>('.lamp-area')!;
  const cordButton = root.querySelector<HTMLButtonElement>('.cord-hit')!;
  const cordPath = root.querySelector<SVGPathElement>('.cord-path')!;
  const cordShadow = root.querySelector<SVGPathElement>('.cord-shadow')!;
  const cordTip = root.querySelector<SVGGElement>('.cord-tip')!;
  const panel = root.querySelector<HTMLElement>('.login-panel')!;
  const status = root.querySelector<HTMLElement>('[id$="-lamp-status"]')!;
  const hint = root.querySelector<HTMLElement>('.hint-text')!;
  const events = new AbortController();
  function listen<K extends keyof HTMLElementEventMap>(target: HTMLElement | Window, type: K, listener: (event: HTMLElementEventMap[K]) => void) {
    target.addEventListener(type, listener as EventListener, { signal: events.signal });
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  let isOn = false;
  let lastToggle = -Infinity;
  let activePointer: number | null = null;
  let startX = 0;
  let startY = 0;
  let maxTravel = 0;
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let animationFrame = 0;
  let previousTime = 0;
  let unlockTimer: ReturnType<typeof setTimeout>;

  function resize() {
    const bounds = root.getBoundingClientRect();
    stage.style.setProperty('--stage-scale', String(Math.min(bounds.width / 1280, innerHeight / 760, 1.5)));
  }
  resize();
  listen(window, 'resize', resize);

  function paintCord() {
    const endX = 184 + x;
    const endY = 317 + y;
    const bend = activePointer === null ? -vx * 0.065 : x * 0.1;
    const path = `M184 190 C184 ${238 + y * .25} ${endX + bend} ${280 + y * .8} ${endX} ${endY}`;
    cordPath.setAttribute('d', path);
    cordShadow.setAttribute('d', path);
    cordTip.setAttribute('transform', `translate(${endX} ${endY}) rotate(${-x * .4 + bend * .6})`);
    // CSS positioning follows the local SVG scale; the stage itself may also be scaled.
    const localScale = lampArea.offsetWidth / 300;
    cordButton.style.transform = `translate(${x * localScale}px, ${y * localScale}px)`;
  }

  function settle(time: number) {
    const dt = Math.min((time - previousTime) / 1000 || 1 / 60, 1 / 30);
    previousTime = time;
    vx += (-135 * x - 10 * vx) * dt;
    vy += (-190 * y - 13 * vy) * dt;
    x += vx * dt;
    y += vy * dt;
    paintCord();
    if (Math.abs(x) + Math.abs(y) + Math.abs(vx) + Math.abs(vy) > .15) {
      animationFrame = requestAnimationFrame(settle);
    } else {
      x = y = vx = vy = 0;
      paintCord();
      animationFrame = 0;
    }
  }

  function releaseSpring() {
    cancelAnimationFrame(animationFrame);
    if (reducedMotion.matches) {
      x = y = vx = vy = 0;
      paintCord();
      return;
    }
    vx += 30 + x * 2;
    previousTime = performance.now();
    animationFrame = requestAnimationFrame(settle);
  }

  function toggleLamp() {
    const now = performance.now();
    if (now - lastToggle < 650) return;
    lastToggle = now;
    isOn = !isOn;
    room.classList.toggle('is-on', isOn);
    cordButton.setAttribute('aria-pressed', String(isOn));
    cordButton.setAttribute('aria-label', `Pull cord to turn the lamp ${isOn ? 'off' : 'on'}`);
    panel.setAttribute('aria-hidden', String(!isOn));
    clearTimeout(unlockTimer);
    // Do not expose invisible inputs to keyboard navigation during the reveal.
    if (!isOn && panel.contains(document.activeElement)) cordButton.focus({ preventScroll: true });
    panel.inert = true;
    if (isOn) unlockTimer = setTimeout(() => { panel.inert = false; }, reducedMotion.matches ? 0 : 950);
    status.textContent = isOn ? `Lamp on. ${panel.getAttribute('aria-label')} is illuminated.` : 'Lamp off. Pull the cord to illuminate the room.';
    hint.textContent = isOn ? 'PULL TO DIM' : 'PULL TO ILLUMINATE';
    root.querySelector('.light-status span')!.textContent = isOn ? 'A WARM WELCOME' : 'LIGHTS OUT';
  }

  listen(cordButton, 'pointerdown', (event) => {
    if (activePointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    cancelAnimationFrame(animationFrame);
    activePointer = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    maxTravel = 0;
    vx = vy = 0;
    cordButton.setPointerCapture(event.pointerId);
    room.classList.add('is-pulling');
  });

  listen(cordButton, 'pointermove', (event) => {
    if (event.pointerId !== activePointer) return;
    const scale = lampArea.getBoundingClientRect().width / 300;
    const dx = (event.clientX - startX) / scale;
    const dy = (event.clientY - startY) / scale;
    maxTravel = Math.max(maxTravel, Math.hypot(dx, dy));
    x = Math.max(-65, Math.min(65, dx * .65));
    y = dy >= 0 ? 82 * (1 - Math.exp(-dy / 95)) : Math.max(-8, dy * .12);
    paintCord();
  });

  function finishPull(event: PointerEvent, cancelled: boolean) {
    if (event.pointerId !== activePointer) return;
    const shouldToggle = !cancelled && (y > 16 || maxTravel < 9);
    activePointer = null;
    room.classList.remove('is-pulling');
    if (cordButton.hasPointerCapture(event.pointerId)) cordButton.releasePointerCapture(event.pointerId);
    if (shouldToggle) {
      if (y < 16) y = 31;
      toggleLamp();
    }
    releaseSpring();
  }
  listen(cordButton, 'pointerup', event => finishPull(event, false));
  listen(cordButton, 'pointercancel', event => finishPull(event, true));
  listen(cordButton, 'lostpointercapture', event => {
    if (activePointer === event.pointerId) finishPull(event as PointerEvent, true);
  });
  // Pointer events handle physical pulling; detail=0 preserves native keyboard/AT activation.
  listen(cordButton, 'click', event => {
    if (event.detail !== 0) return;
    y = 31;
    toggleLamp();
    releaseSpring();
  });
  listen(window, 'blur', () => {
    if (activePointer === null) return;
    const pointer = activePointer;
    activePointer = null;
    if (cordButton.hasPointerCapture(pointer)) cordButton.releasePointerCapture(pointer);
    room.classList.remove('is-pulling');
    releaseSpring();
  });

  const dust = root.querySelector('.dust')!;
  for (let i = 0; i < 16; i++) {
    const mote = document.createElement('i');
    mote.style.cssText = `left:${(i * 47 + 13) % 100}%;top:${(i * 29 + 17) % 100}%;--duration:${7 + i % 6}s;--delay:-${i * 1.7}s;--opacity:${.12 + (i % 4) * .07}`;
    dust.append(mote);
  }


  const observer = new ResizeObserver(resize);
  observer.observe(root);
  return () => {
    events.abort();
    observer.disconnect();
    clearTimeout(unlockTimer);
    cancelAnimationFrame(animationFrame);
    if (activePointer !== null && cordButton.hasPointerCapture(activePointer)) cordButton.releasePointerCapture(activePointer);
  };
}
