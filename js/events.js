// The HBC — shared calendar helpers (used by the public calendar and the admin tool)
window.HBCEvents = (() => {
  const TYPES = {
    practice: "Practice", tournament: "Tournament", tryout: "Tryout", clinic: "Clinic",
    camp: "Camp", meeting: "Meeting", event: "Club Event", off: "No Practice / Closed",
  };
  const PROGRAMS = { all: "Whole Club", boys: "HBC Boys", girls: "HBC Girls" };

  const pad = (n) => String(n).padStart(2, "0");
  const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => {
    const [y, m, d] = String(s).split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

  function formatTime(t) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const hr = ((h + 11) % 12) + 1;
    return `${hr}${m ? ":" + pad(m) : ""} ${h < 12 ? "AM" : "PM"}`;
  }
  function timeRange(ev) {
    if (!ev.start) return "All day";
    return ev.end ? `${formatTime(ev.start)} – ${formatTime(ev.end)}` : formatTime(ev.start);
  }
  function formatDate(d, opts) {
    return d.toLocaleDateString("en-US", opts || { weekday: "short", month: "short", day: "numeric" });
  }

  // Expand events (including weekly repeats and multi-day spans) into
  // occurrences that fall between `from` and `to` (inclusive Date objects).
  function occurrences(events, from, to) {
    const out = [];
    for (const ev of events) {
      if (!ev.date) continue;
      const first = parse(ev.date);
      const spanDays = ev.endDate ? Math.max(0, Math.round((parse(ev.endDate) - first) / 864e5)) : 0;
      const skip = new Set(ev.skip || []);
      const starts = [];
      if (ev.repeat === "weekly" && ev.until) {
        const until = parse(ev.until);
        for (let d = first; d <= until && d <= to; d = addDays(d, 7)) starts.push(d);
      } else {
        starts.push(first);
      }
      for (const s of starts) {
        if (skip.has(toKey(s))) continue;
        const e = addDays(s, spanDays);
        if (e < from || s > to) continue;
        out.push({ ...ev, occStart: s, occEnd: e, key: toKey(s) });
      }
    }
    return out.sort((a, b) => a.occStart - b.occStart || (a.start || "").localeCompare(b.start || ""));
  }

  return { TYPES, PROGRAMS, pad, toKey, parse, addDays, formatTime, timeRange, formatDate, occurrences };
})();
