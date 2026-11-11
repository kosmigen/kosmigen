const platform = navigator.userAgentData?.platform || navigator.platform;
document.documentElement.classList.toggle("kb-platform-mac", /Mac|iPhone|iPad/i.test(platform));

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.isComposing || event.altKey
    || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;

  const input = document.querySelector('[data-md-component="search-query"]');
  const toggle = document.getElementById("__search");
  if (!input || !toggle) return;
  event.preventDefault();
  toggle.checked = true;
  toggle.dispatchEvent(new Event("change", { bubbles: true }));
  input.focus();
});
