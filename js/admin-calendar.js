// The HBC — admin month calendar: edit single practices or "this and all future", with conflict checks.
(() => {
  const A = window.HBCAdmin, E = window.HBCEvents, S = window.HBCScheduler;
  const { el, state } = A;
  const $ = (s, r = document) => r.querySelector(s);
  const root = $("#ac-root");
  if (!root) return;

  const view = { month: new Date(new Date().getFullYear(), new Date().getMonth(), 1), program: "any", team: "", coach: "", gym: "" };
  const dayBefore = (k) => E.toKey(E.addDays(E.parse(k), -1));
  const coachNames = () => Object.fromEntries((state.config.coaches || []).map((c) => [c.id, c.name]));

  function matches(ev) {
    if (view.program !== "any" && ev.program !== view.program) return false;
    if (view.team && ev.team !== view.team) return false;
    if (view.coach && !(ev.coachIds || []).includes(view.coach)) return false;
    if (view.gym && ev.gym !== view.gym) return false;
    return true;
  }

  function options(list, value, first) {
    return [el("option", { value: "" }, first), ...list.map((x) => el("option", { value: x.id, selected: x.id === value ? "" : null }, x.name))];
  }

  function render() {
    if (root.closest("[data-panel]").hidden) return;
    const cfg = state.config;
    const m = view.month;
    const monthEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0);
    const from = E.addDays(m, -m.getDay()), to = E.addDays(monthEnd, 6 - monthEnd.getDay());
    const all = E.occurrences(state.events, from, to);
    const conflicts = S.findConflicts(all, coachNames());
    const bad = new Set(conflicts.flatMap((c) => [c.a.id + c.a.key, c.b.id + c.b.key]));
    const occ = all.filter(matches);

    const bar = el("div", { class: "cal-toolbar" },
      el("div", { class: "cal-nav" },
        el("button", { class: "cal-btn", type: "button", "aria-label": "Previous month", onclick: () => { view.month = new Date(m.getFullYear(), m.getMonth() - 1, 1); render(); } }, "‹"),
        el("h2", { class: "cal-title" }, m.toLocaleDateString("en-US", { month: "long", year: "numeric" })),
        el("button", { class: "cal-btn", type: "button", "aria-label": "Next month", onclick: () => { view.month = new Date(m.getFullYear(), m.getMonth() + 1, 1); render(); } }, "›"),
        el("button", { class: "cal-btn cal-today", type: "button", onclick: () => { const t = new Date(); view.month = new Date(t.getFullYear(), t.getMonth(), 1); render(); } }, "Today")),
      el("div", { class: "adm-row wrap" },
        sel([["any", "All programs"], ["all", "Whole club"], ["boys", "HBC Boys"], ["girls", "HBC Girls"]].map(([v, l]) => el("option", { value: v, selected: v === view.program ? "" : null }, l)), (v) => { view.program = v; }),
        sel(options(cfg.teams || [], view.team, "All teams"), (v) => { view.team = v; }),
        sel(options(cfg.coaches || [], view.coach, "All coaches"), (v) => { view.coach = v; }),
        sel(options(cfg.gyms || [], view.gym, "All gyms"), (v) => { view.gym = v; })));

    const monthConf = conflicts.filter((c) => { const d = E.parse(c.day); return d >= m && d <= monthEnd; });
    const banner = monthConf.length
      ? el("div", { class: "notice adm-conflicts" }, el("strong", {}, `${monthConf.length} conflict${monthConf.length === 1 ? "" : "s"} this month`),
          el("ul", {}, monthConf.slice(0, 8).map((c) => el("li", {}, el("button", { type: "button", class: "adm-link", onclick: () => openOcc(c.a) }, E.formatDate(E.parse(c.day))), " ", c.text))))
      : el("p", { class: "cal-note" }, "No coach, court or team conflicts this month. Click a practice to change it, or a date number to add an event.");

    const byDay = {};
    for (const o of occ) for (let d = o.occStart; d <= o.occEnd; d = E.addDays(d, 1)) (byDay[E.toKey(d)] ||= []).push(o);
    const grid = el("div", { class: "cal-grid adm-cal" }, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => el("div", { class: "cal-dow" }, d)));
    const todayKey = E.toKey(new Date());
    for (let i = 0; i < 42; i++) {
      const d = E.addDays(from, i);
      if (i >= 35 && d.getMonth() !== m.getMonth()) break;
      const k = E.toKey(d);
      const cell = el("div", { class: "cal-day" + (d.getMonth() !== m.getMonth() ? " out" : "") + (k === todayKey ? " today" : "") },
        el("button", { type: "button", class: "cal-num adm-addday", title: "Add an event on this date", onclick: () => A.openEditor(null, k) }, d.getDate()));
      for (const o of byDay[k] || []) {
        cell.append(el("button", { type: "button", class: `cal-chip p-${o.program || "all"} t-${o.type || "event"}${bad.has(o.id + o.key) ? " conflict" : ""}`, onclick: () => openOcc(o), title: [o.title, E.timeRange(o), o.venue, o.court].filter(Boolean).join(" · ") },
          o.start ? el("span", { class: "cal-chip-time" }, E.formatTime(o.start)) : null, o.title.replace(/ Practice$/, ""), (o.courts || []).length ? el("span", { class: "cal-chip-time" }, ` · ${chipCourt(o)}`) : null));
      }
      grid.append(cell);
    }
    root.replaceChildren(bar, banner, grid);
  }

  // short court label for chips: custom names if set, otherwise C1, C2…
  function chipCourt(o) {
    const g = (state.config.gyms || []).find((x) => x.id === o.gym);
    const named = g && g.courtNames && o.courts.some((c) => String(g.courtNames[c] || "").trim());
    return (named ? o.courts.map((c) => S.courtName(g, c)).join(" & ") : "C" + o.courts.join("&")) + (o.share ? " ½" : "");
  }

  function sel(opts, onChange) {
    return el("select", { onchange: (e) => { onChange(e.target.value); render(); } }, opts);
  }

  // ---------------------------------------------------------------- occurrence editor
  const dlg = $("#occ-dialog");
  const f = $("#occ-form");
  let current = null; // { master, occKey }

  function openOcc(o) {
    const master = state.events.find((x) => x.id === o.id);
    if (!master) return;
    current = { master, occKey: o.key };
    const cfg = state.config;
    const series = master.repeat === "weekly";
    $("#occ-title").textContent = series ? "Edit practice" : "Edit event";
    $("#occ-series").textContent = series
      ? `Repeats every ${E.formatDate(E.parse(master.date), { weekday: "long" })} until ${E.formatDate(E.parse(master.until), { month: "short", day: "numeric", year: "numeric" })}${master.phaseName ? ` · ${master.phaseName}` : ""}. You're editing ${E.formatDate(E.parse(o.key), { weekday: "short", month: "short", day: "numeric" })}.`
      : master.overrideOf ? "This practice was changed individually from its weekly series." : "";
    f.title.value = master.title || "";
    f.date.value = o.key;
    f.start.value = master.start || "";
    f.end.value = master.end || "";
    f.gym.replaceChildren(el("option", { value: "" }, "Other / not a club gym"), ...(cfg.gyms || []).map((g) => el("option", { value: g.id }, g.name)));
    f.gym.value = master.gym || "";
    renderCourts(master.courts || []);
    f.location.value = master.location || "";
    f.notes.value = master.notes || "";
    const box = $("#occ-coaches");
    const ids = new Set(master.coachIds || []);
    box.replaceChildren(...(cfg.coaches || []).map((c) => el("label", { class: "adm-check" }, el("input", { type: "checkbox", value: c.id, checked: ids.has(c.id) ? "" : null }), c.name)));
    if (!(cfg.coaches || []).length) box.append(el("small", {}, master.coaches && master.coaches.length ? `Coaches: ${master.coaches.join(", ")}` : "Add coaches in the Schedule Builder to assign them here."));
    $("#occ-one").textContent = series ? "Save this practice only" : "Save";
    $("#occ-future").hidden = !series;
    $("#occ-cancel-one").textContent = series ? "Cancel this practice" : "Delete";
    $("#occ-cancel-future").hidden = !series;
    $("#occ-error").textContent = "";
    dlg.showModal();
  }

  // court checkboxes for the chosen gym, named and in priority order
  function renderCourts(selected) {
    const box = $("#occ-courts");
    const g = (state.config.gyms || []).find((x) => x.id === f.gym.value);
    if (!g) { box.replaceChildren(el("small", {}, "Choose a club gym to pick courts.")); return; }
    box.replaceChildren(...S.courtOrder(g, state.config).map((c) => el("label", { class: "adm-check" },
      el("input", { type: "checkbox", value: String(c), checked: selected.includes(c) ? "" : null }), S.courtName(g, c))));
  }
  f.gym.addEventListener("change", () => {
    const g = (state.config.gyms || []).find((x) => x.id === f.gym.value);
    if (g) f.location.value = g.address || g.name;
    renderCourts([]);
  });

  function readForm() {
    const err = (m) => { $("#occ-error").textContent = m; return null; };
    if (!f.title.value.trim()) return err("Please give it a title.");
    if (!f.date.value) return err("Please choose a date.");
    if (f.start.value && f.end.value && f.end.value <= f.start.value) return err("The end time must be after the start time.");
    const courts = [...document.querySelectorAll("#occ-courts input:checked")].map((i) => Number(i.value));
    const gym = (state.config.gyms || []).find((g) => g.id === f.gym.value);
    const coachIds = [...document.querySelectorAll("#occ-coaches input:checked")].map((i) => i.value);
    const names = Object.fromEntries((state.config.coaches || []).map((c) => [c.id, c.name]));
    const share = !!current.master.share;
    return {
      title: f.title.value.trim(), date: f.date.value, start: f.start.value || undefined, end: f.end.value || undefined,
      gym: f.gym.value || undefined, venue: gym ? gym.name : undefined, courts,
      court: courts.length ? S.courtLabel({ courts, share }, gym) : undefined,
      location: f.location.value.trim(), notes: f.notes.value.trim(),
      ...((state.config.coaches || []).length ? { coachIds, coaches: coachIds.map((c) => names[c]).filter(Boolean) } : {}),
    };
  }

  const clean = (o) => { for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k]; return o; };
  const single = (ev) => { const c = { ...ev }; delete c.repeat; delete c.until; delete c.skip; return c; };

  // Returns the ids of events that changed so conflicts can be checked for them.
  function applyChange(scope, changes) {
    const { master, occKey } = current;
    const series = master.repeat === "weekly";
    const replace = (ev) => { state.events = state.events.map((x) => (x.id === ev.id ? ev : x)); };
    if (!series) { replace(clean({ ...master, ...changes })); return [master.id]; }
    if (scope === "one") {
      replace({ ...master, skip: [...new Set([...(master.skip || []), occKey])].sort() });
      const one = clean({ ...single(master), ...changes, id: A.newId(), overrideOf: master.id, overrideDate: occKey });
      state.events.push(one);
      return [one.id];
    }
    // this and all future practices
    const weekdayChanged = E.parse(changes.date).getDay() !== E.parse(occKey).getDay();
    if (occKey === master.date) {
      replace(clean({ ...master, ...changes, skip: weekdayChanged ? [] : master.skip }));
      return [master.id];
    }
    const cut = dayBefore(occKey);
    replace({ ...master, until: cut, skip: (master.skip || []).filter((d) => d <= cut) });
    const next = clean({ ...master, ...changes, id: A.newId(), skip: weekdayChanged ? [] : (master.skip || []).filter((d) => d >= occKey) });
    if (next.until < next.date) next.until = next.date;
    state.events.push(next);
    return [next.id];
  }

  function conflictsFor(ids) {
    const evs = state.events.filter((x) => ids.includes(x.id));
    if (!evs.length) return [];
    const from = E.parse(evs.map((x) => x.date).sort()[0]);
    const to = E.addDays(from, 400);
    const mine = E.occurrences(evs, from, to);
    const days = new Set(mine.map((o) => o.key));
    const occ = E.occurrences(state.events, from, to).filter((o) => days.has(o.key));
    return S.findConflicts(occ, coachNames()).filter((c) => ids.includes(c.a.id) || ids.includes(c.b.id));
  }

  function save(scope) {
    const changes = readForm();
    if (!changes) return;
    const before = JSON.stringify(state.events);
    const ids = applyChange(scope, changes);
    const found = conflictsFor(ids);
    if (found.length) {
      const list = found.slice(0, 5).map((c) => `• ${E.formatDate(E.parse(c.day))}: ${c.text}`).join("\n");
      if (!confirm(`This creates ${found.length} conflict${found.length === 1 ? "" : "s"}:\n${list}${found.length > 5 ? "\n…" : ""}\n\nSave anyway?`)) {
        state.events = JSON.parse(before);
        return;
      }
    }
    dlg.close();
    A.setDirty(true);
    A.refresh();
    A.status(scope === "future" ? "Updated this and all future practices. Publish when you're done." : "Saved. Publish when you're done.", "ok");
  }

  function cancel(scope) {
    const { master, occKey } = current;
    const series = master.repeat === "weekly";
    const label = E.formatDate(E.parse(occKey), { weekday: "short", month: "short", day: "numeric" });
    if (!series) {
      if (!confirm(`Delete "${master.title}" on ${label}?`)) return;
      state.events = state.events.filter((x) => x.id !== master.id);
    } else if (scope === "one") {
      if (!confirm(`Cancel "${master.title}" on ${label} only?`)) return;
      state.events = state.events.map((x) => (x.id === master.id ? { ...x, skip: [...new Set([...(x.skip || []), occKey])].sort() } : x));
    } else {
      if (!confirm(`Cancel "${master.title}" on ${label} and every practice after it?`)) return;
      state.events = occKey === master.date
        ? state.events.filter((x) => x.id !== master.id)
        : state.events.map((x) => (x.id === master.id ? { ...x, until: dayBefore(occKey), skip: (x.skip || []).filter((d) => d < occKey) } : x));
    }
    dlg.close();
    A.setDirty(true);
    A.refresh();
  }

  $("#occ-one").addEventListener("click", () => save("one"));
  $("#occ-future").addEventListener("click", () => save("future"));
  $("#occ-cancel-one").addEventListener("click", () => cancel("one"));
  $("#occ-cancel-future").addEventListener("click", () => cancel("future"));
  $("#occ-close").addEventListener("click", () => dlg.close());

  A.onRefresh(render);
  window.HBCAdminCalendar = { render, openOcc, applyChange: (c, scope, changes) => { current = c; return applyChange(scope, changes); } };
})();
