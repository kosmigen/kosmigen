const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let currentFooter;
let dispose = () => {};

function createJelly(footer) {
  const canvas = footer.querySelector(".kb-footer__jelly");
  const context = canvas?.getContext("2d");
  if (!context) return () => {};

  const events = new AbortController();
  const { signal } = events;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let shapeColor;
  let visible = false;
  let frame = 0;
  let previousTime = 0;
  let time = 0;
  let pointer;
  let pressing = false;
  let pressure = 0;
  let velocity = 0;
  const contour = Array.from({ length: 80 }, () => ({ offset: 0, velocity: 0 }));

  function palette() {
    shapeColor = getComputedStyle(footer, "::before").backgroundColor;
  }

  function shape() {
    return {
      x: Math.min(width * 0.25, 260) + 60 * Math.sin(time * 0.6),
      y: 12 + 32 * Math.cos(time * 0.7),
      rx: (Math.min(560, width * 0.75 + 200) + 50 * Math.cos(time * 0.65)) * (1 + pressure * 0.07),
      ry: (315 + 45 * Math.sin(time * 0.8)) * (1 - pressure * 0.09),
    };
  }

  function draw(delta = 0) {
    context.clearRect(0, 0, width, height);
    const { x, y, rx, ry } = shape();
    const pointerAngle = pointer ? Math.atan2((pointer.y - y) / ry, (pointer.x - x) / rx) : 0;
    const points = contour.map((point, index) => {
      const angle = index * Math.PI * 2 / contour.length;
      const px = x + Math.cos(angle) * rx;
      const py = y + Math.sin(angle) * ry;
      const difference = Math.atan2(Math.sin(angle - pointerAngle), Math.cos(angle - pointerAngle));
      const target = 36 * Math.sin(angle * 3 + time * 1.1)
        + 24 * Math.sin(angle * 2 - time * 0.8)
        + 10 * Math.sin(angle * 5 + time * 0.65)
        - 82 * pressure * Math.exp(-difference * difference / 0.3);
      // Each contour point has its own spring, giving the silhouette a soft rebound.
      point.velocity += ((target - point.offset) * 65 - point.velocity * 7) * delta;
      point.offset += point.velocity * delta;
      return [px + Math.cos(angle) * point.offset, py + Math.sin(angle) * point.offset];
    });
    const path = new Path2D();
    const last = points.at(-1);
    path.moveTo((last[0] + points[0][0]) / 2, (last[1] + points[0][1]) / 2);
    points.forEach((point, index) => {
      const next = points[(index + 1) % points.length];
      path.quadraticCurveTo(...point, (point[0] + next[0]) / 2, (point[1] + next[1]) / 2);
    });
    path.closePath();
    context.fillStyle = shapeColor;
    context.fill(path);
  }

  function animate(now) {
    frame = requestAnimationFrame(animate);
    // Match the display refresh rate; cap the spring step to avoid jumps after a slow frame.
    const delta = previousTime ? Math.min((now - previousTime) / 1000, 1 / 30) : 0;
    previousTime = now;
    time += delta;
    velocity += (((pressing ? 1 : 0) - pressure) * 65 - velocity * 7) * delta;
    pressure += velocity * delta;
    draw(delta);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    pressing = false;
    pressure = 0;
    velocity = 0;
  }

  function update() {
    const enabled = !reducedMotion.matches;
    footer.toggleAttribute("data-jelly-ready", enabled);
    if (enabled && visible && !document.hidden) {
      if (!frame) frame = requestAnimationFrame(animate);
    } else {
      stop();
    }
  }

  function resize() {
    const bounds = footer.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    draw();
  }

  function disturb(event) {
    if (!frame || event.pointerType === "touch") return;
    const bounds = footer.getBoundingClientRect();
    const px = event.clientX - bounds.left;
    const py = event.clientY - bounds.top;
    const { x, y, rx, ry } = shape();
    pressing = ((px - x) / rx) ** 2 + ((py - y) / ry) ** 2 <= 1;
    if (pressing) pointer = { x: px, y: py };
  }

  palette();
  resize();
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(footer);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  });
  visibilityObserver.observe(footer);
  const themeObserver = new MutationObserver(() => {
    palette();
    if (!reducedMotion.matches) draw();
  });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ["data-md-color-scheme"] });
  footer.addEventListener("pointerenter", disturb, { signal, passive: true });
  footer.addEventListener("pointermove", disturb, { signal, passive: true });
  footer.addEventListener("pointerleave", () => { pressing = false; }, { signal });
  document.addEventListener("visibilitychange", update, { signal });
  reducedMotion.addEventListener("change", update, { signal });
  window.addEventListener("pagehide", stop, { signal });
  window.addEventListener("pageshow", update, { signal });

  return () => {
    stop();
    events.abort();
    sizeObserver.disconnect();
    visibilityObserver.disconnect();
    themeObserver.disconnect();
    footer.removeAttribute("data-jelly-ready");
  };
}

function initialiseFooterJelly() {
  const footer = document.querySelector(".kb-footer");
  if (footer === currentFooter) return;
  dispose();
  currentFooter = footer;
  dispose = footer ? createJelly(footer) : () => {};
}

if (window.document$?.subscribe) {
  window.document$.subscribe(initialiseFooterJelly);
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseFooterJelly, { once: true });
} else {
  initialiseFooterJelly();
}
