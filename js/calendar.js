// The HBC — public calendar (month + list views), reads data/events.json
(() => {
  const root = document.getElementById("hbc-calendar");
  if (!root) return;
  const E = window.HBCEvents;
  const base = root.dataset.base || "";
  const fixedProgram = root.dataset.program || ""; // "boys" | "girls" | "" (club: everything)

  const state = {
    events: [],
    month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    view: window.matchMedia("(max-width: 700px)").matches ? "list" : "month",
    filter: "everything",
  };

  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v);
    }
    for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(k));
    return n;
  };

  const title = root.querySelector(".cal-title");
  const body = root.querySelector(".cal-body");
  const dialog = document.getElementById("cal-dialog");

  function visible(ev) {
    if (fixedProgram) return ev.program === fixedProgram || ev.program === "all";
    if (state.filter === "everything") return true;
    return ev.program === state.filter || ev.program === "all";
  }

  function chip(o) {
    return el("button", { class: `cal-chip p-${o.program || "all"} t-${o.type || "event"}`, type: "button", onclick: () => openDetails(o) },
      o.start ? el("span", { class: "cal-chip-time" }, E.formatTime(o.start)) : null, o.title);
  }

  function renderMonth(occ) {
    const first = state.month;
    const gridStart = E.addDays(first, -first.getDay());
    const todayKey = E.toKey(new Date());
    const byDay = {};
    for (const o of occ) for (let d = o.occStart; d <= o.occEnd; d = E.addDays(d, 1)) (byDay[E.toKey(d)] ||= []).push(o);

    const grid = el("div", { class: "cal-grid", role: "grid" },
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => el("div", { class: "cal-dow", role: "columnheader" }, d)));
    for (let i = 0; i < 42; i++) {
      const d = E.addDays(gridStart, i);
      if (i >= 35 && d.getMonth() !== first.getMonth()) break;
      const key = E.toKey(d);
      const items = byDay[key] || [];
      const cell = el("div", { class: "cal-day" + (d.getMonth() !== first.getMonth() ? " out" : "") + (key === todayKey ? " today" : ""), role: "gridcell" },
        el("span", { class: "cal-num" }, d.getDate()));
      items.slice(0, 3).forEach((o) => cell.append(chip(o)));
      if (items.length > 3) cell.append(el("button", { class: "cal-more", type: "button", onclick: () => openDay(d, items) }, `+${items.length - 3} more`));
      grid.append(cell);
    }
    return grid;
  }

  function renderList(occ) {
    if (!occ.length) return el("p", { class: "cal-empty" }, "No events scheduled this month yet. Check back soon.");
    const list = el("ol", { class: "cal-list" });
    for (const o of occ) {
      const multi = o.occEnd > o.occStart;
      list.append(el("li", {},
        el("button", { class: `cal-row p-${o.program || "all"}`, type: "button", onclick: () => openDetails(o) },
          el("span", { class: "cal-date" },
            el("strong", {}, o.occStart.getDate()),
            el("small", {}, E.formatDate(o.occStart, { weekday: "short" }))),
          el("span", { class: "cal-info" },
            el("strong", {}, o.title),
            el("small", {}, [
              multi ? `${E.formatDate(o.occStart)} – ${E.formatDate(o.occEnd)}` : E.timeRange(o),
              o.location ? ` · ${o.location}` : "",
            ].join(""))),
          el("span", { class: "cal-tags" },
            el("span", { class: "cal-tag" }, E.TYPES[o.type] || "Event"),
            fixedProgram ? null : el("span", { class: `cal-tag prog p-${o.program || "all"}` }, E.PROGRAMS[o.program] || "Whole Club")))));
    }
    return list;
  }

  function render() {
    const m = state.month;
    title.textContent = m.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const monthEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0);
    const from = state.view === "month" ? E.addDays(m, -m.getDay()) : m;
    const to = state.view === "month" ? E.addDays(monthEnd, 6 - monthEnd.getDay()) : monthEnd;
    const occ = E.occurrences(state.events.filter(visible), from, to);
    body.replaceChildren(state.view === "month" ? renderMonth(occ) : renderList(occ));
    root.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === state.view)));
    root.querySelectorAll("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === state.filter)));
  }

  function detailRows(o) {
    const multi = o.occEnd > o.occStart;
    const when = multi
      ? `${E.formatDate(o.occStart, { weekday: "long", month: "long", day: "numeric" })} – ${E.formatDate(o.occEnd, { weekday: "long", month: "long", day: "numeric" })}`
      : E.formatDate(o.occStart, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    return [
      el("p", { class: "cal-d-tags" },
        el("span", { class: "cal-tag" }, E.TYPES[o.type] || "Event"),
        el("span", { class: `cal-tag prog p-${o.program || "all"}` }, E.PROGRAMS[o.program] || "Whole Club")),
      el("h3", {}, o.title),
      el("p", {}, el("strong", {}, "When: "), when, multi ? "" : ` · ${E.timeRange(o)}`),
      o.location ? el("p", {}, el("strong", {}, "Where: "),
        el("a", { href: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(o.location), target: "_blank", rel: "noopener" }, o.location)) : null,
      o.notes ? el("p", { class: "cal-d-notes" }, o.notes) : null,
    ];
  }

  function show(content) {
    dialog.querySelector(".cal-d-body").replaceChildren(...content);
    dialog.showModal ? dialog.showModal() : dialog.setAttribute("open", "");
  }
  const openDetails = (o) => show(detailRows(o));
  const openDay = (d, items) => show([
    el("h3", {}, E.formatDate(d, { weekday: "long", month: "long", day: "numeric" })),
    ...items.map((o) => el("div", { class: "cal-d-item" }, ...detailRows(o).slice(1))),
  ]);

  dialog.querySelector(".cal-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  root.querySelector("[data-nav=prev]").addEventListener("click", () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); render(); });
  root.querySelector("[data-nav=next]").addEventListener("click", () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); render(); });
  root.querySelector("[data-nav=today]").addEventListener("click", () => { const t = new Date(); state.month = new Date(t.getFullYear(), t.getMonth(), 1); render(); });
  root.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => { state.view = b.dataset.view; render(); }));
  root.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => { state.filter = b.dataset.filter; render(); }));

  fetch(`${base}data/events.json?v=${Date.now()}`)
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => { state.events = data.events || []; render(); })
    .catch(() => { body.replaceChildren(el("p", { class: "cal-empty" }, "The calendar couldn't load right now. Please refresh, or contact Kim at (714) 305-9309.")); });
})();
