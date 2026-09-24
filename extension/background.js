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
  // `:modal` also matches fullscreen elements, so target dialogs explicitly. Separate rules: one unsupported
  // selector would otherwise drop the whole list.
  return `dialog:modal { filter: ${f} !important; }\n[popover]:popover-open { filter: ${f} !important; }`;
}

// Messages for a frame are handled one at a time, in order, so a slow insert can't be overtaken by a later removal.
const queues = new Map();

async function applyTopLayer(msg, tabId, frameId) {
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
}

browser.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== "top-layer" || !sender.tab) return;
  const tabId = sender.tab.id;
  const frameId = sender.frameId || 0;
  const key = `${tabId}:${frameId}`;
  const next = (queues.get(key) || Promise.resolve()).then(() => applyTopLayer(msg, tabId, frameId)).catch(() => {});
  queues.set(key, next);
});

browser.tabs.onRemoved.addListener((tabId) => {
  for (const k of [...injected.keys()]) if (k.startsWith(`${tabId}:`)) injected.delete(k);
});

// Hand each new page the current settings synchronously at document_start, so it starts in the right state
// (no red flash when the filter is off, no unfiltered flash when it is on). Registrations only last as long as
// this background page, so this runs on every start.
let bootScript = null;
let bootQueue = Promise.resolve();
let bootTimer = null;

async function registerBootNow() {
  if (!browser.contentScripts || !browser.contentScripts.register) return;
  const settings = await browser.storage.local.get(RF.DEFAULTS);
  const code = `(() => { const s = ${JSON.stringify(settings)}; if (window.RF_BOOT_HOOK) window.RF_BOOT_HOOK(s); else window.RF_BOOT = s; })();`;
  const old = bootScript;
  bootScript = await browser.contentScripts.register({
    matches: ["<all_urls>"],
    js: [{ code }],
    runAt: "document_start",
    allFrames: false,
  });
  if (old) await old.unregister();
}

// Registrations run one at a time so they can't overlap and leak, and setting changes are debounced (dragging the
// dim slider fires many).
function registerBoot(delay = 0) {
  clearTimeout(bootTimer);
  bootTimer = setTimeout(() => {
    bootQueue = bootQueue.then(registerBootNow).catch(() => {});
  }, delay);
}

registerBoot();
browser.storage.onChanged.addListener(() => registerBoot(250));

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
