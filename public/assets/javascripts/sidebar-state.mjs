// Remember folder choices and scroll position throughout the documentation.
// Material still owns rendering, active paths, and the mobile drawer.
const desktop = window.matchMedia("(min-width: 76.25em)");
const docsLink = document.querySelector('[data-site-section="docs"]');
const docsRoot = docsLink?.dataset.sitePaths?.split(/\s+/).find(Boolean);
const siteRoot = docsLink?.closest('[data-site-root]')?.dataset.siteRoot || document.baseURI;
const docsPath = docsLink ? new URL(docsRoot || docsLink.href, siteRoot).pathname : null;
const storageKey = `kb-sidebar-state:${docsPath}`;
const scrollStorageKey = `${storageKey}:scroll`;
let choices = new Map();
let scrollTop = null;
let cleanup = () => {};

try {
  const saved = JSON.parse(sessionStorage.getItem(storageKey) || "[]");
  if (Array.isArray(saved)) {
    choices = new Map(saved.filter((entry) => (
      Array.isArray(entry) && typeof entry[0] === "string" && typeof entry[1] === "boolean"
    )));
  }
  const savedScroll = sessionStorage.getItem(scrollStorageKey);
  if (savedScroll !== null && Number.isFinite(Number(savedScroll)) && Number(savedScroll) >= 0) {
    scrollTop = Number(savedScroll);
  }
} catch {
  // Keep in-memory state when browser storage is unavailable.
}

function mountSidebarState() {
  cleanup();
  cleanup = () => {};
  if (!docsPath || !window.location.pathname.startsWith(docsPath)) return;

  const sidebar = document.querySelector(".md-sidebar--primary");
  const section = sidebar?.querySelector(
    ".md-nav--primary > .md-nav__list > .md-nav__item--active.md-nav__item--nested"
  );
  if (!section) return;

  const folders = new Map();
  const paths = new Map();
  for (const toggle of section.querySelectorAll('input.md-nav__toggle[id^="__nav_"]')) {
    const item = toggle.closest("li");
    const label = item.querySelector(
      ":scope > label .md-ellipsis, :scope > .md-nav__container > a .md-ellipsis"
    );
    if (!label) continue;
    const parent = item.parentElement.closest("li.md-nav__item--nested");
    // Heading paths survive navigation reordering, unlike positional __nav IDs.
    const title = encodeURIComponent((item.dataset.navKey || label.textContent).trim().replace(/\s+/g, " "));
    const key = `${paths.get(parent) || ""}/${title}`;
    paths.set(item, key);
    folders.set(toggle, {
      key,
      active: item.classList.contains("md-nav__item--active"),
      nav: item.querySelector(":scope > nav"),
    });
  }

  if (!desktop.matches) {
    // A resize into the drawer must not inherit desktop-only folder choices.
    for (const [toggle, { active, nav }] of folders) {
      toggle.checked = active;
      nav?.setAttribute("aria-expanded", String(active));
    }
    return;
  }

  const controller = new AbortController();
  const { signal } = controller;
  const scrollwrap = sidebar.querySelector(".md-sidebar__scrollwrap");
  let restoring = true;
  sidebar.classList.add("kb-sidebar-restoring");

  // Batch DOM writes without per-folder layout reads or document-wide lookups.
  for (const [toggle, { key, active, nav }] of folders) {
    const checked = active || (choices.get(key) ?? toggle.checked);
    if (toggle.checked !== checked) toggle.checked = checked;
    nav?.setAttribute("aria-expanded", String(checked));
  }

  // Restore synchronously: waiting for the next frame exposes the new sidebar
  // at scrollTop 0, especially when navigating near the bottom of a long tree.
  if (scrollTop !== null) scrollwrap.scrollTop = scrollTop;

  function rememberSidebar() {
    // The visible state wins over older choices, including a saved false for
    // an ancestor Material has since opened for the active article. Otherwise
    // leaving that article collapses the branch and can clamp scrollTop to 0.
    for (const [toggle, { key }] of folders) {
      choices.set(key, toggle.checked);
    }
    if (scrollwrap.isConnected && !restoring) scrollTop = scrollwrap.scrollTop;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify([...choices]));
      if (scrollTop !== null) sessionStorage.setItem(scrollStorageKey, String(scrollTop));
    } catch {
      // In-memory restoration still works when browser storage is unavailable.
    }
  }

  section.addEventListener("change", (event) => {
    const folder = folders.get(event.target);
    if (!folder) return;
    choices.set(folder.key, event.target.checked);
    folder.nav?.setAttribute("aria-expanded", String(event.target.checked));
    try {
      sessionStorage.setItem(storageKey, JSON.stringify([...choices]));
    } catch {
      // The current tab still remembers choices if storage is blocked or full.
    }
  }, { signal });

  scrollwrap.addEventListener("scroll", () => {
    if (!restoring) scrollTop = scrollwrap.scrollTop;
  }, { passive: true, signal });

  // Capture before Material handles a link, even if the last scroll event is
  // still queued. pagehide also covers refresh and full-page navigation.
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");
    if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey
        && event.button === 0 && !link.target && !link.hasAttribute("download")
        && new URL(link.href).origin === window.location.origin) rememberSidebar();
  }, { capture: true, signal });
  window.addEventListener("pagehide", rememberSidebar, { signal });
  window.addEventListener("popstate", rememberSidebar, { capture: true, signal });

  // Material centers the active link in its first animation frame. Restore our
  // position in that same frame, before paint, and reveal new links only as needed.
  const frame = requestAnimationFrame(() => {
    if (scrollTop !== null) scrollwrap.scrollTop = scrollTop;
    const active = [...section.querySelectorAll("a.md-nav__link--active[href]")]
      .find((link) => !link.closest(".kb-sidebar-title--desktop-hidden"));
    if (active) {
      const bounds = scrollwrap.getBoundingClientRect();
      const link = active.getBoundingClientRect();
      if (link.top < bounds.top) scrollwrap.scrollTop += link.top - bounds.top;
      else if (link.bottom > bounds.bottom) scrollwrap.scrollTop += link.bottom - bounds.bottom;
    }
    scrollTop = scrollwrap.scrollTop;
    restoring = false;
    sidebar.classList.remove("kb-sidebar-restoring");
  });

  cleanup = () => {
    rememberSidebar();
    controller.abort();
    cancelAnimationFrame(frame);
    sidebar.classList.remove("kb-sidebar-restoring");
  };
}

desktop.addEventListener("change", mountSidebarState);
if (window.document$?.subscribe) {
  window.document$.subscribe(mountSidebarState);
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountSidebarState, { once: true });
} else {
  mountSidebarState();
}
