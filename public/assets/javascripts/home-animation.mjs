const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let homeAnimations = [];
let disposeCharacter = () => {};

function initialiseCharacter(character) {
  const image = character.querySelector("img");
  if (!image) return () => {};
  const events = new AbortController();
  const { signal } = events;
  let greeting;

  function reset() {
    image.style.removeProperty("rotate");
    image.style.removeProperty("translate");
  }

  function follow(event) {
    if (event.pointerType === "touch") return;
    const bounds = character.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    image.style.rotate = `${x * 3}deg`;
    image.style.translate = `${x * 6}px ${y * 3 - 2}px`;
  }

  character.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    follow(event);
    greeting?.cancel();
    greeting = image.animate([
      { transform: "translateY(0) scale(1) rotate(0deg)", offset: 0 },
      { transform: "translateY(3px) scale(1.035, 0.97) rotate(-1deg)", offset: 0.16 },
      { transform: "translateY(-9px) scale(0.98, 1.02) rotate(1.5deg)", offset: 0.4 },
      { transform: "translateY(1px) scale(1.025, 0.98) rotate(-0.8deg)", offset: 0.66 },
      { transform: "translateY(-2px) scale(1) rotate(0.3deg)", offset: 0.84 },
      { transform: "translateY(0) scale(1) rotate(0deg)", offset: 1 },
    ], { duration: 820, easing: "ease-in-out" });
  }, { signal, passive: true });
  character.addEventListener("pointermove", follow, { signal, passive: true });
  character.addEventListener("pointerleave", reset, { signal });
  character.addEventListener("pointercancel", reset, { signal });

  const visibility = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) {
      greeting?.cancel();
      reset();
    }
  });
  visibility.observe(character);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      greeting?.cancel();
      reset();
    }
  }, { signal });

  return () => {
    events.abort();
    visibility.disconnect();
    greeting?.cancel();
    reset();
  };
}

function initialiseHomeMotion(body = document) {
  homeAnimations.forEach((animation) => animation.cancel());
  homeAnimations = [];
  disposeCharacter();
  disposeCharacter = () => {};
  const root = body.querySelector?.(".kb-home");
  if (!root || reducedMotion.matches) return;

  root.querySelectorAll(".kb-home-hero-copy").forEach((element) => {
    homeAnimations.push(element.animate(
      [{ opacity: 0.7 }, { opacity: 1 }],
      { duration: 200, easing: "ease-out" },
    ));
  });
  const character = root.querySelector(".kb-home-character");
  if (character) disposeCharacter = initialiseCharacter(character);
}

reducedMotion.addEventListener("change", () => initialiseHomeMotion());
if (window.document$?.subscribe) {
  window.document$.subscribe(({ body }) => initialiseHomeMotion(body));
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initialiseHomeMotion(), { once: true });
} else {
  initialiseHomeMotion();
}
