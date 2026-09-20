const $ = (id) => document.getElementById(id);
const FIELDS = ["mode", "activation", "startTime", "endTime", "sunStartOffset", "sunEndOffset", "lat", "lon"];
const CHECKS = ["enabled", "filterDialogs", "themeBrowser"];
let state = { ...RF.DEFAULTS };
let cities = [];
const isAndroid = /Android/i.test(navigator.userAgent);

function norm(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.'\u2019]/g, "")
    .replace(/-/g, " ")
    .replace(/\bsaint\b/g, "st")
    .replace(/\bsainte\b/g, "ste");
}

function normTime(v) {
  const m = /^\s*(\d{1,2})[:.]?(\d{2})\s*$/.exec(v);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function fmt(d) {
  return d && !isNaN(d) ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "none today";
}

function render() {
  for (const el of document.querySelectorAll("[data-show]")) el.hidden = el.dataset.show !== state.activation;
  $("status").textContent = RF.isActive(state) ? "Filter is on now" : "Filter is off now";
  $("dim").value = state.dim;
  if (document.activeElement !== $("city")) $("city").value = state.place || "";
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
  const res = await fetch(browser.runtime.getURL("data/cities.tsv"));
  const text = await res.text();
  cities = [];
  for (const line of text.split("\n")) {
    if (!line) continue;
    const [label, lat, lon, ascii] = line.split("\t");
    cities.push({ label, lat: Number(lat), lon: Number(lon), key: norm(ascii ? `${label} ${ascii}` : label) });
  }
}

// Cities are sorted by population, so the first matches found are the biggest places.
function search(query, limit = 8) {
  const q = norm(query.trim());
  if (q.length < 2) return [];
  const starts = [];
  const contains = [];
  for (const c of cities) {
    if (c.key.startsWith(q)) starts.push(c);
    else if (starts.length < limit && contains.length < limit && c.key.includes(q)) contains.push(c);
    if (starts.length >= limit) break;
  }
  return starts.concat(contains).slice(0, limit);
}

function showResults(list) {
  const ul = $("results");
  ul.replaceChildren();
  for (const c of list) {
    const li = document.createElement("li");
    li.textContent = c.label;
    li.addEventListener("click", () => {
      $("city").value = c.label;
      ul.hidden = true;
      save({ place: c.label, lat: c.lat, lon: c.lon });
    });
    ul.appendChild(li);
  }
  ul.hidden = list.length === 0;
}

async function init() {
  state = await browser.storage.local.get(RF.DEFAULTS);
  if (!(browser.theme && browser.theme.update)) $("themeRow").hidden = true;
  // Desktop's native time picker opens off-screen inside the popup, so use plain text there.
  if (!isAndroid) {
    for (const k of ["startTime", "endTime"]) {
      $(k).type = "text";
      $(k).placeholder = "HH:MM";
      $(k).maxLength = 5;
    }
  }
  render();
  await loadCities();
}

for (const k of ["mode", "activation"]) {
  $(k).addEventListener("change", (e) => save({ [k]: e.target.value }));
}
for (const k of ["startTime", "endTime"]) {
  $(k).addEventListener("change", (e) => {
    const t = isAndroid ? e.target.value : normTime(e.target.value);
    if (t) save({ [k]: t });
    else e.target.value = state[k] ?? "";
  });
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
$("city").addEventListener("input", (e) => showResults(search(e.target.value)));
$("city").addEventListener("focus", (e) => showResults(search(e.target.value)));
$("city").addEventListener("change", (e) => {
  const q = norm(e.target.value.trim());
  const hit = cities.find((c) => norm(c.label) === q);
  if (hit) save({ place: hit.label, lat: hit.lat, lon: hit.lon });
});

browser.storage.onChanged.addListener((changes) => {
  for (const [k, v] of Object.entries(changes)) state[k] = v.newValue;
  render();
});

init();
