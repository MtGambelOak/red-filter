const vm = require("node:vm");
const fs = require("node:fs");
const assert = require("node:assert");
const path = require("node:path");

const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ["lib/suncalc.js", "common.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "extension", f), "utf8"), ctx);
}
const RF = vm.runInContext("RF", ctx);
const on = (s, when) => RF.isActive({ ...RF.DEFAULTS, ...s }, when);

// Manual
assert.equal(on({ activation: "manual", enabled: true }, new Date()), true);
assert.equal(on({ activation: "manual", enabled: false }, new Date()), false);

// Manual times: overnight window 21:00 -> 07:00 (local time)
const t = { activation: "times", startTime: "21:00", endTime: "07:00" };
const at = (h, m) => new Date(2026, 5, 21, h, m);
assert.equal(on(t, at(23, 0)), true);
assert.equal(on(t, at(3, 0)), true);
assert.equal(on(t, at(6, 59)), true);
assert.equal(on(t, at(7, 0)), false);
assert.equal(on(t, at(12, 0)), false);
assert.equal(on(t, at(21, 0)), true);
// Same-day window
const d = { activation: "times", startTime: "09:00", endTime: "17:00" };
assert.equal(on(d, at(12, 0)), true);
assert.equal(on(d, at(18, 0)), false);
// Zero-length or invalid window is never on
assert.equal(on({ activation: "times", startTime: "08:00", endTime: "08:00" }, at(8, 0)), false);
assert.equal(on({ activation: "times", startTime: "bogus", endTime: "07:00" }, at(8, 0)), false);

// Sun: London, 2026-06-21. Sunrise ~03:43Z, sunset ~20:21Z.
const london = { activation: "sun", lat: 51.51, lon: -0.13 };
assert.equal(on(london, new Date("2026-06-21T12:00:00Z")), false);
assert.equal(on(london, new Date("2026-06-21T21:00:00Z")), true);
assert.equal(on(london, new Date("2026-06-21T03:00:00Z")), true);
assert.equal(on(london, new Date("2026-06-21T04:30:00Z")), false);
assert.equal(on(london, new Date("2026-06-21T20:00:00Z")), false);
assert.equal(on(london, new Date("2026-06-21T20:40:00Z")), true);
// Offsets: 60 min after sunset delays the start
assert.equal(on({ ...london, sunStartOffset: 60 }, new Date("2026-06-21T20:40:00Z")), false);
assert.equal(on({ ...london, sunStartOffset: 60 }, new Date("2026-06-21T21:40:00Z")), true);
// Sunrise offset: 60 min after sunrise keeps it on later
assert.equal(on({ ...london, sunEndOffset: 60 }, new Date("2026-06-21T04:30:00Z")), true);

// Sun: New York, 2026-12-21. Sunrise ~12:17Z, sunset ~21:32Z.
const ny = { activation: "sun", lat: 40.71, lon: -74.01 };
assert.equal(on(ny, new Date("2026-12-21T17:00:00Z")), false);
assert.equal(on(ny, new Date("2026-12-21T22:30:00Z")), true);
assert.equal(on(ny, new Date("2026-12-21T11:00:00Z")), true);

// Sun: Sydney (southern hemisphere), 2026-06-21. Sunrise ~21:00Z prev day (07:00 AEST), sunset ~06:54Z (16:54 AEST).
const syd = { activation: "sun", lat: -33.87, lon: 151.21 };
assert.equal(on(syd, new Date("2026-06-21T02:00:00Z")), false);
assert.equal(on(syd, new Date("2026-06-21T09:00:00Z")), true);

// Polar: Tromso midnight sun (Jun) is never on, polar night (Dec) is on at midday
const tromso = { activation: "sun", lat: 69.65, lon: 18.96 };
assert.equal(on(tromso, new Date("2026-06-21T12:00:00Z")), false);
assert.equal(on(tromso, new Date("2026-06-21T22:00:00Z")), false);
assert.equal(on(tromso, new Date("2026-12-21T11:00:00Z")), true);

// No location means off
assert.equal(on({ activation: "sun", lat: null, lon: null }, new Date()), false);

console.log("all schedule tests passed");
