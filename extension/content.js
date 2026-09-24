(() => {
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
    set("inset", "0");
    set("z-index", "2147483647");
    set("pointer-events", "none");
    set("margin", "0");
    set("padding", "0");
    set("border", "0");
    set("mix-blend-mode", blend);
    set("background", color);
    return el;
  }

  let lastSig = null;

  function apply(s) {
    if (!document.documentElement) return;
    const active = RF.isActive(s);
    const sig = JSON.stringify([active, s.mode, s.dim, s.filterDialogs, !!document.getElementById(IDS[1])]);
    if (sig === lastSig) return;
    lastSig = sig;

    // Top-layer elements (modal dialogs, popovers) render above the overlay; background injects a filter for them.
    browser.runtime
      .sendMessage({ type: "top-layer", enabled: active && s.filterDialogs, mode: s.mode, dim: s.dim })
      .catch(() => {});

    if (!active) {
      for (const id of IDS) document.getElementById(id)?.remove();
      return;
    }
    if (s.mode === "luma") layer(IDS[0], "color", "#ffffff");
    else document.getElementById(IDS[0])?.remove();

    const red = layer(IDS[1], "multiply", `rgb(${Math.round(255 * s.dim)},0,0)`);
    // Keep the red layer last so it multiplies over the gray layer.
    document.documentElement.appendChild(red);
  }

  // Nothing is drawn until the real settings are known, so a page that should be unfiltered never flashes red.
  // The background script registers a tiny script that hands us the settings synchronously at document_start;
  // if that hasn't happened (or isn't supported) we fall back to reading storage.
  let state = null;
  let timer = null;

  function refresh() {
    if (!state) return;
    apply(state);
    // Scheduled modes re-check periodically; manual mode needs no timer.
    if (state.activation !== "manual" && !timer) timer = setInterval(() => apply(state), 30000);
    if (state.activation === "manual" && timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function boot(settings) {
    if (state) return;
    state = { ...RF.DEFAULTS, ...settings };
    refresh();
  }

  // Either script may run first, so support both orders.
  window.RF_BOOT_HOOK = boot;
  if (window.RF_BOOT) boot(window.RF_BOOT);

  browser.storage.local.get(RF.DEFAULTS).then((s) => {
    state = s;
    refresh();
  });

  browser.storage.onChanged.addListener((changes) => {
    if (!state) return; // the initial storage read will pick up the latest values
    for (const [k, v] of Object.entries(changes)) state[k] = v.newValue;
    refresh();
  });

  document.addEventListener("DOMContentLoaded", () => {
    lastSig = null;
    refresh();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && state) apply(state);
  });
})();
