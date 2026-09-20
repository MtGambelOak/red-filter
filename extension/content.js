(() => {
  const DEFAULTS = { enabled: true, mode: "luma", dim: 1 };
  const IDS = ["red-filter-ext-gray", "red-filter-ext-red"];

  // Root-level url() SVG filters don't render in Firefox, and a body filter breaks
  // position:fixed descendants, so use blend-mode overlays instead. Multiplying by
  // (r,0,0) zeroes G/B exactly; a "color" blend with gray first gives luma red.
  function layer(id, blend, color) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      document.documentElement.appendChild(el);
    }
    const set = (k, v) => el.style.setProperty(k, v, "important");
    set("position", "fixed");
    set("top", "0");
    set("left", "0");
    set("width", "100vw");
    set("height", "100vh");
    set("z-index", "2147483647");
    set("pointer-events", "none");
    set("margin", "0");
    set("padding", "0");
    set("border", "0");
    set("mix-blend-mode", blend);
    set("background", color);
    return el;
  }

  function apply(s) {
    if (!document.documentElement) return;
    // Top-layer elements (modal dialogs, popovers) render above the overlay; background injects a filter for them.
    browser.runtime.sendMessage({ type: "top-layer", enabled: s.enabled, mode: s.mode, dim: s.dim }).catch(() => {});
    for (const id of IDS) if (!s.enabled) document.getElementById(id)?.remove();
    if (!s.enabled) return;

    if (s.mode === "luma") layer(IDS[0], "color", "#ffffff");
    else document.getElementById(IDS[0])?.remove();

    const red = layer(IDS[1], "multiply", `rgb(${Math.round(255 * s.dim)},0,0)`);
    // Keep the red layer last so it multiplies over the gray layer.
    document.documentElement.appendChild(red);
  }

  let state = { ...DEFAULTS };
  apply(state);

  browser.storage.local.get(DEFAULTS).then((s) => {
    state = s;
    apply(state);
  });

  browser.storage.onChanged.addListener((changes) => {
    for (const [k, v] of Object.entries(changes)) state[k] = v.newValue;
    apply(state);
  });

  document.addEventListener("DOMContentLoaded", () => apply(state));
})();
