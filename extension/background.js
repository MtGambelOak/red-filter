const RED_THEME = {
  colors: {
    frame: "#1a0000",
    frame_inactive: "#120000",
    toolbar: "#260000",
    toolbar_text: "#ff2a2a",
    tab_background_text: "#ff2a2a",
    tab_text: "#ff2a2a",
    tab_line: "#ff0000",
    toolbar_field: "#1a0000",
    toolbar_field_text: "#ff2a2a",
    toolbar_field_border: "#400000",
    toolbar_field_focus: "#1a0000",
    toolbar_field_text_focus: "#ff2a2a",
    toolbar_top_separator: "#400000",
    toolbar_bottom_separator: "#400000",
    toolbar_vertical_separator: "#400000",
    popup: "#1a0000",
    popup_text: "#ff2a2a",
    popup_border: "#400000",
    popup_highlight: "#400000",
    popup_highlight_text: "#ff5a5a",
    sidebar: "#1a0000",
    sidebar_text: "#ff2a2a",
    sidebar_border: "#400000",
    button_background_hover: "#400000",
    button_background_active: "#600000",
    icons: "#ff2a2a",
    ntp_background: "#000000",
    ntp_text: "#ff2a2a",
  },
};

async function syncTheme() {
  // browser.theme.update is desktop-only; Firefox for Android has no theme support.
  if (!browser.theme || !browser.theme.update) return;
  const s = await browser.storage.local.get(RF.DEFAULTS);
  if (RF.isActive(s) && s.themeBrowser) await browser.theme.update(RED_THEME);
  else await browser.theme.reset();
}

const injected = new Map();

function topLayerCss(mode, dim) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg"><filter id="f" color-interpolation-filters="sRGB">` +
    `<feColorMatrix type="matrix" values="${RF.matrixValues(mode, dim)}"/></filter></svg>`;
  const f = `url("data:image/svg+xml,${encodeURIComponent(svg)}#f")`;
  // Separate rules: one unsupported pseudo-class would otherwise drop the whole list.
  return `:modal { filter: ${f} !important; }\n:popover-open { filter: ${f} !important; }`;
}

browser.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.type !== "top-layer" || !sender.tab) return;
  const { id: tabId } = sender.tab;
  const frameId = sender.frameId || 0;
  const key = `${tabId}:${frameId}`;
  const prev = injected.get(key);
  if (prev) {
    await browser.tabs.removeCSS(tabId, { code: prev, cssOrigin: "user", frameId }).catch(() => {});
    injected.delete(key);
  }
  if (!msg.enabled) return;
  const code = topLayerCss(msg.mode, msg.dim);
  await browser.tabs.insertCSS(tabId, { code, cssOrigin: "user", frameId }).catch(() => {});
  injected.set(key, code);
});

browser.tabs.onRemoved.addListener((tabId) => {
  for (const k of [...injected.keys()]) if (k.startsWith(`${tabId}:`)) injected.delete(k);
});

browser.runtime.onInstalled.addListener(async () => {
  const cur = await browser.storage.local.get(null);
  await browser.storage.local.set({ ...RF.DEFAULTS, ...cur });
  syncTheme();
});

browser.runtime.onStartup.addListener(syncTheme);
browser.storage.onChanged.addListener(syncTheme);

// Scheduled modes flip on and off without any storage change, so re-check every minute.
browser.alarms.create("theme-sync", { periodInMinutes: 1 });
browser.alarms.onAlarm.addListener((a) => {
  if (a.name === "theme-sync") syncTheme();
});
