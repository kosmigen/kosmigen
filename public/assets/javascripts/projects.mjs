let components;
const initialisedPreviews = new WeakSet();

function initialisePreview(preview) {
  if (initialisedPreviews.has(preview)) return;
  initialisedPreviews.add(preview);
  const image = preview.querySelector("img");
  const message = preview.querySelector(".kb-project-card__preview-message");
  if (!image) return;

  function ready() {
    preview.dataset.previewState = "ready";
    preview.setAttribute("aria-busy", "false");
    message.hidden = true;
  }

  function failed() {
    preview.dataset.previewState = "error";
    preview.setAttribute("aria-busy", "false");
    image.hidden = true;
    message.textContent = "暂时无法生成预览，可直接前往网站";
  }

  image.addEventListener("load", ready, { once: true });
  image.addEventListener("error", failed, { once: true });
  if (image.complete) {
    if (image.naturalWidth > 0) ready();
    else failed();
  }
}

function initialiseProjects() {
  const gallery = document.querySelector(".kb-projects");
  if (!gallery) return;
  gallery.querySelectorAll(".kb-project-card__preview").forEach(initialisePreview);
  components ??= Promise.all([
    import("./vendor/webawesome/components/card/card.js"),
    import("./vendor/webawesome/components/badge/badge.js"),
  ]).catch((error) => {
    components = undefined;
    console.error("Unable to load project cards", error);
  });
}

if (window.document$?.subscribe) {
  window.document$.subscribe(initialiseProjects);
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseProjects, { once: true });
} else {
  initialiseProjects();
}
