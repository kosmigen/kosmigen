const desktopToc = window.matchMedia("(min-width: 60em)");
let cleanup = () => {};

function initialiseToc() {
  cleanup();
  cleanup = () => {};
  const sidebar = document.querySelector('.md-sidebar--secondary:not([hidden])');
  const toggle = sidebar?.querySelector("#__toc");
  const button = sidebar?.querySelector(".md-sidebar-button");
  if (!toggle || !button) return;

  const controller = new AbortController();
  const { signal } = controller;
  function setOpen(open) {
    toggle.checked = open;
    button.setAttribute("aria-expanded", String(open));
    sidebar.querySelector(".md-sidebar__inner").inert = !open && !desktopToc.matches;
  }
  setOpen(false);

  button.addEventListener("click", () => setOpen(!toggle.checked), { signal });
  toggle.addEventListener("change", () => setOpen(toggle.checked), { signal });
  sidebar.addEventListener("click", (event) => {
    if (event.target.closest("a[href]")) setOpen(false);
  }, { signal });
  document.addEventListener("click", (event) => {
    if (!sidebar.contains(event.target)) setOpen(false);
  }, { signal });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.checked) {
      setOpen(false);
      button.focus();
    }
  }, { signal });
  desktopToc.addEventListener("change", () => setOpen(false), { signal });
  cleanup = () => controller.abort();
}

if (window.document$?.subscribe) {
  window.document$.subscribe(initialiseToc);
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseToc, { once: true });
} else {
  initialiseToc();
}
