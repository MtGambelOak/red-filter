const $ = (id) => document.getElementById(id);
const FIELDS = ["mode", "activation", "startTime", "endTime", "sunStartOffset", "sunEndOffset", "lat", "lon"];
const CHECKS = ["enabled", "filterDialogs", "themeBrowser"];
let state = { ...RF.DEFAULTS };
let cities = [];

function fmt(d) {
  return d && !isNaN(d) ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "none today";
}

function render() {
  for (const el of document.querySelectorAll("[data-show]")) el.hidden = el.dataset.show !== state.activation;
  $("status").textContent = RF.isActive(state) ? "Filter is on now" : "Filter is off now";
  $("dim").value = state.dim;
  $("city").value = state.place || "";
  for (const k of FIELDS) if (document.activeElement !== $(k)) $(k).value = state[k] ?? "";
  for (const k of CHECKS) $(k).checked = !!state[k];
  if (typeof state.lat === "number" && typeof state.lon === "number") {
    const t = SunCalc.getTimes(new Date(), state.lat, state.lon);
    $("sunInfo").textContent = `Today (your local time): sunset ${fmt(t.sunset)}, sunrise ${fmt(t.sunrise)}`;
  } else {
    $("sunInfo").textContent = "Pick a city or enter coordinates. Without a location the schedule stays off.";
  }
}

function save(patch) {
  Object.assign(state, patch);
  browser.storage.local.set(patch);
  render();
}

async function loadCities() {
  const res = await fetch(browser.runtime.getURL("data/cities.json"));
  cities = await res.json();
  const list = $("cities");
  for (const [label] of cities) {
    const o = document.createElement("option");
    o.value = label;
    list.appendChild(o);
  }
}

async function init() {
  state = await browser.storage.local.get(RF.DEFAULTS);
  if (!(browser.theme && browser.theme.update)) $("themeRow").hidden = true;
  render();
  loadCities();
}

for (const k of ["mode", "activation", "startTime", "endTime"]) {
  $(k).addEventListener("change", (e) => save({ [k]: e.target.value }));
}
for (const k of ["sunStartOffset", "sunEndOffset"]) {
  $(k).addEventListener("change", (e) => save({ [k]: Number(e.target.value) || 0 }));
}
for (const k of ["lat", "lon"]) {
  $(k).addEventListener("change", (e) => {
    const v = e.target.value === "" ? null : Number(e.target.value);
    save({ [k]: Number.isFinite(v) ? v : null, place: "" });
  });
}
for (const k of CHECKS) $(k).addEventListener("change", (e) => save({ [k]: e.target.checked }));
$("dim").addEventListener("input", (e) => save({ dim: parseFloat(e.target.value) }));
$("city").addEventListener("change", (e) => {
  const hit = cities.find(([label]) => label.toLowerCase() === e.target.value.trim().toLowerCase());
  if (hit) save({ place: hit[0], lat: hit[1], lon: hit[2] });
});

browser.storage.onChanged.addListener((changes) => {
  for (const [k, v] of Object.entries(changes)) state[k] = v.newValue;
  render();
});

init();
