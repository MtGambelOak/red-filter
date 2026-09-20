var RF = (() => {
  const DEFAULTS = {
    activation: "manual", // "manual" | "times" | "sun"
    enabled: true, // used when activation is "manual"
    mode: "luma",
    dim: 1,
    filterDialogs: true,
    themeBrowser: true,
    startTime: "21:00",
    endTime: "07:00",
    lat: null,
    lon: null,
    place: "",
    sunStartOffset: 0, // minutes after sunset
    sunEndOffset: 0, // minutes after sunrise
  };

  function parseHM(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(t || "");
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }

  function inTimes(s, now) {
    const a = parseHM(s.startTime);
    const b = parseHM(s.endTime);
    if (a === null || b === null || a === b) return false;
    const n = now.getHours() * 60 + now.getMinutes();
    return a < b ? n >= a && n < b : n >= a || n < b;
  }

  // A "night" runs from sunset(day d) to sunrise(day d+1). Check last night and tonight.
  function inSun(s, now) {
    if (typeof s.lat !== "number" || typeof s.lon !== "number") return false;
    const DAY = 864e5;
    const start = (s.sunStartOffset || 0) * 60000;
    const end = (s.sunEndOffset || 0) * 60000;
    let sawValid = false;
    for (const d of [new Date(now.getTime() - DAY), now]) {
      const set = SunCalc.getTimes(d, s.lat, s.lon).sunset;
      const rise = SunCalc.getTimes(new Date(d.getTime() + DAY), s.lat, s.lon).sunrise;
      if (isNaN(set) || isNaN(rise)) continue;
      sawValid = true;
      if (now.getTime() >= set.getTime() + start && now.getTime() < rise.getTime() + end) return true;
    }
    // Polar day/night: no sunrise or sunset, fall back to the sun's altitude.
    if (!sawValid) return SunCalc.getPosition(now, s.lat, s.lon).altitude < 0;
    return false;
  }

  function isActive(s, now = new Date()) {
    if (s.activation === "times") return inTimes(s, now);
    if (s.activation === "sun") return inSun(s, now);
    return !!s.enabled;
  }

  function matrixValues(mode, dim) {
    const row = mode === "strict" ? [1, 0, 0] : [0.299, 0.587, 0.114];
    return `${row.map((v) => (v * dim).toFixed(4)).join(" ")} 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0`;
  }

  return { DEFAULTS, isActive, matrixValues, parseHM };
})();
