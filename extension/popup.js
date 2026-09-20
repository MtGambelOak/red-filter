const DEFAULTS = { enabled: true, mode: "luma", dim: 1 };
const $ = (id) => document.getElementById(id);

browser.storage.local.get(DEFAULTS).then((s) => {
  $("enabled").checked = s.enabled;
  $("mode").value = s.mode;
  $("dim").value = s.dim;
});

$("enabled").addEventListener("change", (e) => browser.storage.local.set({ enabled: e.target.checked }));
$("mode").addEventListener("change", (e) => browser.storage.local.set({ mode: e.target.value }));
$("dim").addEventListener("input", (e) => browser.storage.local.set({ dim: parseFloat(e.target.value) }));
