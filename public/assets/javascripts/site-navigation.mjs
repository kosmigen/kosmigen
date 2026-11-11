function updateSiteNavigation() {
  const navigation = document.querySelector(".kb-site-navigation");
  if (!navigation) return;

  const currentPath = window.location.pathname;
  const siteRoot = navigation.dataset.siteRoot || document.baseURI;
  const links = [...navigation.querySelectorAll("[data-site-section]")];
  const matches = links
    .flatMap((link) => {
      const paths = link.dataset.sitePaths?.split(/\s+/).filter(Boolean) || [link.href];
      return paths.map((path) => ({ link, path: new URL(path, siteRoot).pathname }));
    })
    .filter(({ path }) => currentPath.startsWith(path))
    .sort((a, b) => b.path.length - a.path.length);
  const activeLink = matches[0]?.link;

  links.forEach((link) => {
    const active = link === activeLink;
    link.classList.toggle("is-active", active);
    if (active) {
      link.setAttribute("aria-current", currentPath === new URL(link.href).pathname ? "page" : "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

if (window.document$?.subscribe) {
  window.document$.subscribe(updateSiteNavigation);
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", updateSiteNavigation, { once: true });
} else {
  updateSiteNavigation();
}
window.addEventListener("popstate", updateSiteNavigation);
