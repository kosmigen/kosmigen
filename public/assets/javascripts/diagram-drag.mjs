let disposePreviousPage;

function initialiseDiagramDrag(body = document) {
  disposePreviousPage?.();

  const lifetime = new AbortController();
  const { signal } = lifetime;
  const diagrams = [...body.querySelectorAll(".kb-diagram")];
  let gesture;
  let suppressClick;
  let clickTimer;

  function finishGesture() {
    if (!gesture) return;
    const { element, pointerId } = gesture;
    element.classList.remove("is-dragging");
    gesture = undefined;
    if (element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
    clickTimer = setTimeout(() => { suppressClick = undefined; }, 0);
  }

  const updateOverflow = () => {
    for (const element of diagrams) {
      element.toggleAttribute("data-drag-scroll", element.scrollWidth > element.clientWidth + 1);
    }
  };
  const resizeObserver = new ResizeObserver(updateOverflow);
  const renderObserver = new MutationObserver(updateOverflow);

  for (const element of diagrams) {
    resizeObserver.observe(element);
    renderObserver.observe(element, { childList: true });

    element.addEventListener("pointerdown", (event) => {
      // Touch and trackpads keep native scrolling, including vertical page swipes.
      if (event.pointerType !== "mouse" || event.button !== 0 ||
          event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
          element.scrollWidth <= element.clientWidth + 1 ||
          event.target.closest("a, button, input, select, textarea")) return;

      const bounds = element.getBoundingClientRect();
      // Leave the scrollbar's own drag behaviour intact.
      if (event.clientY >= bounds.top + element.clientTop + element.clientHeight) return;

      clearTimeout(clickTimer);
      suppressClick = undefined;
      gesture = {
        element,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startScroll: element.scrollLeft,
        dragging: false,
      };
    }, { signal });

    element.addEventListener("click", (event) => {
      if (suppressClick !== element) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = undefined;
    }, { capture: true, signal });

    element.addEventListener("dragstart", (event) => {
      if (gesture?.element === element) event.preventDefault();
    }, { signal });
  }

  window.addEventListener("pointermove", (event) => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const delta = event.clientX - gesture.startX;
    if (!gesture.dragging) {
      if (Math.abs(delta) < 5 || Math.abs(delta) < Math.abs(event.clientY - gesture.startY)) return;
      gesture.dragging = true;
      gesture.element.setPointerCapture(event.pointerId);
      gesture.element.classList.add("is-dragging");
      gesture.element.focus({ preventScroll: true });
    }
    event.preventDefault();
    suppressClick = gesture.element;
    gesture.element.scrollLeft = gesture.startScroll - delta;
  }, { passive: false, signal });

  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    window.addEventListener(type, (event) => {
      if (event.pointerId === gesture?.pointerId) finishGesture();
    }, { signal });
  }
  window.addEventListener("blur", finishGesture, { signal });

  updateOverflow();
  disposePreviousPage = () => {
    finishGesture();
    clearTimeout(clickTimer);
    lifetime.abort();
    resizeObserver.disconnect();
    renderObserver.disconnect();
    diagrams.forEach(element => element.removeAttribute("data-drag-scroll"));
  };
}

if (window.document$?.subscribe) {
  window.document$.subscribe(({ body }) => initialiseDiagramDrag(body));
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initialiseDiagramDrag(), { once: true });
} else {
  initialiseDiagramDrag();
}
