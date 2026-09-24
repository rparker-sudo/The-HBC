// The HBC — Schedule Builder UI: season phases, gyms, coaches, teams, rules, generate + apply.
(() => {
  const A = window.HBCAdmin, E = window.HBCEvents, S = window.HBCScheduler;
  const { el, state } = A;
  const root = document.getElementById("sb-root");
  if (!root) return;
  const cfg = () => state.config;
  const changed = () => A.setDirty(true, "config");
  const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  let results = null; // last generated results [{phase, placements, unplaced, warnings}]

  // ---------------------------------------------------------------- small form helpers
  const field = (label, input, cls = "") => el("label", { class: "sb-field " + cls }, el("span", {}, label), input);
  function text(obj, key, attrs = {}) {
    return el("input", { value: obj[key] ?? "", ...attrs, oninput: (e) => { obj[key] = attrs.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value; changed(); } });
  }
  function choose(obj, key, opts, onAfter) {
    return el("select", { onchange: (e) => { obj[key] = e.target.value; changed(); if (onAfter) onAfter(); } },
      opts.map(([v, l]) => el("option", { value: v, selected: String(obj[key] ?? "") === String(v) ? "" : null }, l)));
  }
  function daysPicker(obj, key = "days") {
    obj[key] ||= [];
    return el("div", { class: "sb-days" }, WEEK.map((d) => el("label", {},
      el("input", { type: "checkbox", checked: obj[key].includes(d) ? "" : null, onchange: (e) => {
        obj[key] = e.target.checked ? [...new Set([...obj[key], d])] : obj[key].filter((x) => x !== d); changed(); } }),
      S.DAYS[d])));
  }
  const phaseOpts = () => [["", "All phases"], ...cfg().season.phases.map((p) => [p.id, p.name || p.id])];
  const listOpts = (list, any) => [...(any ? [["*", any]] : [["", "Choose…"]]), ...(cfg()[list] || []).map((x) => [x.id, x.name || "(unnamed)"])];
  const removeBtn = (onClick, label = "Remove") => el("button", { type: "button", class: "adm-link danger", onclick: onClick }, label);
  const addBtn = (label, onClick) => el("button", { type: "button", class: "btn btn-dark sb-add", onclick: onClick }, label);
  function section(title, hint, ...kids) {
    return el("section", { class: "card sb-section" }, el("h3", {}, title), hint ? el("p", { class: "sb-hint" }, hint) : null, ...kids);
  }
  const rerender = () => { if (document.activeElement) document.activeElement.blur(); render(); };

  // ---------------------------------------------------------------- sections
  function seasonSection() {
    const season = cfg().season;
    const rows = season.phases.map((p, i) => el("div", { class: "sb-row" },
      field(`Phase ${i + 1} name`, text(p, "name", { placeholder: "e.g. Fall Training" })),
      field("Starts", text(p, "start", { type: "date" })),
      field("Ends", text(p, "end", { type: "date" })),
      season.phases.length > 1 ? removeBtn(() => { if (confirm(`Remove ${p.name || "this phase"}?`)) { season.phases.splice(i, 1); changed(); rerender(); } }) : null));
    const black = el("textarea", { rows: 2, placeholder: "2026-11-26, 2026-11-27, 2026-12-21 …", oninput: (e) => {
      season.blackouts = e.target.value.split(/[\s,]+/).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)); changed(); } }, (season.blackouts || []).join(", "));
    return section("1. Season phases", "Each phase gets its own weekly practice pattern. Give each one a label and date range.",
      ...rows,
      addBtn("+ Add phase", () => { season.phases.push({ id: A.newId(), name: `Phase ${season.phases.length + 1}`, start: "", end: "" }); changed(); rerender(); }),
      field("Holidays / no-practice dates (YYYY-MM-DD, separated by commas)", black, "wide"));
  }

  function gymsSection() {
    const gyms = cfg().gyms;
    const cards = gyms.map((g, i) => {
      g.hours ||= [];
      return el("div", { class: "sb-item" },
        el("div", { class: "sb-row" },
          field("Gym name", text(g, "name", { placeholder: "Windfield Gym" })),
          field("Address", text(g, "address", { placeholder: "7661 Windfield Dr, Huntington Beach" }), "grow"),
          field("Courts", text(g, "courts", { type: "number", min: 1, max: 20 }), "narrow"),
          removeBtn(() => { if (confirm(`Remove ${g.name || "this gym"}?`)) { gyms.splice(i, 1); changed(); rerender(); } })),
        el("p", { class: "sb-sub" }, "Available times"),
        ...g.hours.map((w, j) => el("div", { class: "sb-row sb-hours" },
          daysPicker(w), field("From", text(w, "start", { type: "time" }), "narrow"), field("To", text(w, "end", { type: "time" }), "narrow"),
          field("Phase", choose(w, "phase", phaseOpts()), "narrow"),
          removeBtn(() => { g.hours.splice(j, 1); changed(); rerender(); }, "×"))),
        el("button", { type: "button", class: "adm-link", onclick: () => { g.hours.push({ days: [1, 2, 3, 4, 5], start: "16:00", end: "21:00", phase: "" }); changed(); rerender(); } }, "+ Add available time"));
    });
    return section("2. Gyms & courts", "Add each gym, how many courts it has, and when you can use it. Times can differ by phase.",
      ...cards, addBtn("+ Add gym", () => { gyms.push({ id: A.newId(), name: "", address: "", courts: 2, hours: [{ days: [1, 2, 3, 4, 5], start: "16:00", end: "21:00", phase: "" }] }); changed(); rerender(); }));
  }

  function coachesSection() {
    const coaches = cfg().coaches;
    return section("3. Coaches", "Coach names appear on the public calendar when someone opens a practice.",
      el("div", { class: "sb-chips" }, coaches.map((c, i) => el("div", { class: "sb-chip" },
        text(c, "name", { placeholder: "Coach name", "aria-label": "Coach name" }),
        removeBtn(() => { if (confirm(`Remove ${c.name || "this coach"}?`)) { coaches.splice(i, 1); for (const t of cfg().teams) t.coaches = (t.coaches || []).filter((x) => x !== c.id); changed(); rerender(); } }, "×")))),
      addBtn("+ Add coach", () => { coaches.push({ id: A.newId(), name: "" }); changed(); rerender(); }));
  }

  function teamsSection() {
    const teams = cfg().teams;
    const phases = cfg().season.phases;
    const cards = teams.map((t, i) => {
      t.coaches ||= [];
      const head = el("div", { class: "sb-row" },
        field("Team name", text(t, "name", { placeholder: "16s Boys" })),
        field("Program", choose(t, "program", [["boys", "HBC Boys"], ["girls", "HBC Girls"], ["all", "Whole club"]])),
        field("Schedule", choose(t, "fixed", [["", "Flexible (generate it)"], ["true", "Set schedule (not flexible)"]], () => { t.fixed = t.fixed === "true" || t.fixed === true; if (t.fixed) t.fixedSlots ||= []; rerender(); })),
        removeBtn(() => { if (confirm(`Remove ${t.name || "this team"}?`)) { teams.splice(i, 1); changed(); rerender(); } }));
      const coachBox = el("div", { class: "sb-days" }, (cfg().coaches.length ? cfg().coaches : []).map((c) => el("label", {},
        el("input", { type: "checkbox", checked: t.coaches.includes(c.id) ? "" : null, onchange: (e) => { t.coaches = e.target.checked ? [...t.coaches, c.id] : t.coaches.filter((x) => x !== c.id); changed(); } }), c.name || "(unnamed)")));
      const courtUse = el("div", { class: "sb-row" },
        field("Court use", choose(t, "courtUse", [["", "Full court(s)"], ["shared", "Shared court (half court with another team)"]], rerender)),
        t.courtUse === "shared" ? null : field("Courts needed", text(t, "courts", { type: "number", min: 1, max: 6, placeholder: "1" }), "narrow"));
      let body;
      if (t.fixed) {
        t.fixedSlots ||= [];
        body = el("div", {}, el("p", { class: "sb-sub" }, "Set practice times (placed first; the generator schedules everyone else around them)"),
          ...t.fixedSlots.map((s, j) => el("div", { class: "sb-row sb-hours" },
            daysPicker(s), field("From", text(s, "start", { type: "time" }), "narrow"), field("To", text(s, "end", { type: "time" }), "narrow"),
            field("Gym", choose(s, "gym", listOpts("gyms")), "narrow"), field("Court(s)", text(s, "courts", { placeholder: "1" }), "narrow"),
            field("Phase", choose(s, "phase", phaseOpts()), "narrow"),
            removeBtn(() => { t.fixedSlots.splice(j, 1); changed(); rerender(); }, "×"))),
          el("button", { type: "button", class: "adm-link", onclick: () => { t.fixedSlots.push({ days: [2, 4], start: "18:00", end: "20:00", gym: (cfg().gyms[0] || {}).id || "", courts: "1", phase: "" }); changed(); rerender(); } }, "+ Add set practice time"));
      } else {
        t.perPhase ||= {};
        body = el("div", { class: "sb-row" },
          field("Practices per week", text(t, "perWeek", { type: "number", min: 0, max: 7, placeholder: "2" }), "narrow"),
          ...phases.map((p) => field(`${p.name || p.id} (optional)`, text(t.perPhase, p.id, { type: "number", min: 0, max: 7, placeholder: "same" }), "narrow")),
          field("Practice length (minutes)", text(t, "minutes", { type: "number", min: 30, step: 15, placeholder: "120" }), "narrow"));
      }
      return el("div", { class: `sb-item sb-team p-${t.program || "all"}` }, head, el("p", { class: "sb-sub" }, "Coaches"), cfg().coaches.length ? coachBox : el("small", {}, "Add coaches above first."), courtUse, body);
    });
    return section("4. Teams", "Pick each team's coaches and how often they practice. Leave a phase blank to use the normal number, or enter 0 for no practices in that phase.",
      ...cards, addBtn("+ Add team", () => { teams.push({ id: A.newId(), name: "", program: "boys", coaches: [], perWeek: 2, minutes: 120, courts: 1, courtUse: "", fixed: false, perPhase: {} }); changed(); rerender(); }));
  }

  const RULES = {
    unavailable: "Unavailable (coach, team, gym or court)",
    gym: "Team uses a certain gym",
    court: "Team uses a certain court",
    days: "Team practices only on certain days",
    time: "Practice time window",
    spacing: "No practices on back-to-back days",
    maxPerDay: "Coach max practices per day",
    buffer: "Coach travel time between gyms",
    share: "Two teams share one court together",
  };

  function ruleRow(r, i) {
    const rules = cfg().rules;
    const parts = [];
    const strength = field("Strength", choose(r, "strength", [["must", "Must (never break)"], ["prefer", "Prefer (try to)"]]), "narrow");
    switch (r.kind) {
      case "unavailable":
        parts.push(field("Who / what", choose(r, "subject", [["coach", "Coach"], ["team", "Team"], ["gym", "Gym"], ["court", "Court"]], () => { r.target = ""; rerender(); }), "narrow"));
        parts.push(field(r.subject === "court" ? "Gym" : "Name", choose(r, "target", listOpts(r.subject === "court" ? "gyms" : r.subject === "team" ? "teams" : r.subject === "gym" ? "gyms" : "coaches"))));
        if (r.subject === "court") parts.push(field("Court #", text(r, "court", { type: "number", min: 1 }), "narrow"));
        parts.push(el("div", { class: "sb-field" }, el("span", {}, "Days (none = every day)"), daysPicker(r)));
        parts.push(field("From time", text(r, "start", { type: "time" }), "narrow"), field("To time", text(r, "end", { type: "time" }), "narrow"));
        parts.push(field("Only from date", text(r, "from", { type: "date" }), "narrow"), field("Until date", text(r, "to", { type: "date" }), "narrow"));
        break;
      case "gym":
        parts.push(field("Team", choose(r, "target", listOpts("teams", "All teams"))), field("Gym", choose(r, "gym", listOpts("gyms"))));
        break;
      case "court":
        parts.push(field("Team", choose(r, "target", listOpts("teams"))), field("Gym", choose(r, "gym", listOpts("gyms"))), field("Court #", text(r, "court", { type: "number", min: 1 }), "narrow"));
        break;
      case "days":
        parts.push(field("Team", choose(r, "target", listOpts("teams"))), el("div", { class: "sb-field" }, el("span", {}, "Days"), daysPicker(r)));
        break;
      case "time":
        parts.push(field("For", choose(r, "subject", [["team", "Team"], ["coach", "Coach"]], () => { r.target = ""; rerender(); }), "narrow"));
        parts.push(field("Name", choose(r, "target", listOpts(r.subject === "coach" ? "coaches" : "teams", r.subject === "coach" ? "All coaches" : "All teams"))));
        parts.push(field("Not before", text(r, "start", { type: "time" }), "narrow"), field("Done by", text(r, "end", { type: "time" }), "narrow"));
        break;
      case "spacing":
        parts.push(field("Team", choose(r, "target", listOpts("teams", "All teams"))));
        break;
      case "maxPerDay":
        parts.push(field("Coach", choose(r, "target", listOpts("coaches", "All coaches"))), field("Max practices", text(r, "value", { type: "number", min: 1 }), "narrow"));
        break;
      case "buffer":
        parts.push(field("Coach", choose(r, "target", listOpts("coaches", "All coaches"))), field("Minutes to switch gyms", text(r, "value", { type: "number", min: 0, step: 5 }), "narrow"));
        break;
      case "share":
        parts.push(field("Team", choose(r, "target", listOpts("teams"))), field("Shares with", choose(r, "partner", listOpts("teams"))));
        parts.push(el("small", { class: "sb-hint" }, "Set both teams' Court use to \"Shared court\"."));
        break;
      default: break;
    }
    return el("div", { class: "sb-item sb-rule" },
      el("div", { class: "sb-rule-head" }, el("strong", {}, RULES[r.kind] || r.kind), removeBtn(() => { rules.splice(i, 1); changed(); rerender(); })),
      el("div", { class: "sb-row" }, ...parts, strength, field("Phase", choose(r, "phase", phaseOpts()), "narrow")));
  }

  function rulesSection() {
    const pick = el("select", {}, Object.entries(RULES).map(([k, l]) => el("option", { value: k }, l)));
    return section("5. Special rules", "Rules adjust the generated schedule. \"Must\" rules are never broken; \"Prefer\" rules are followed when possible. A date range on an unavailable rule skips just those dates.",
      ...cfg().rules.map(ruleRow),
      el("div", { class: "adm-row wrap" }, pick, addBtn("+ Add rule", () => {
        const kind = pick.value;
        const r = { id: A.newId(), kind, strength: kind === "spacing" || kind === "gym" ? "prefer" : "must", phase: "", target: ["spacing"].includes(kind) ? "*" : "" };
        if (kind === "unavailable") Object.assign(r, { subject: "coach", days: [] });
        if (kind === "time") r.subject = "team";
        if (kind === "maxPerDay") Object.assign(r, { value: 2, target: "*" });
        if (kind === "buffer") Object.assign(r, { value: 30, target: "*" });
        cfg().rules.push(r); changed(); rerender();
      })));
  }

  // ---------------------------------------------------------------- generate + preview + apply
  function problems() {
    const c = cfg(), out = [];
    if (!c.gyms.length) out.push("Add at least one gym.");
    if (!c.teams.length) out.push("Add at least one team.");
    c.season.phases.forEach((p) => { if (!p.start || !p.end) out.push(`Give ${p.name || "each phase"} a start and end date.`); else if (p.end < p.start) out.push(`${p.name} ends before it starts.`); });
    c.teams.forEach((t) => { if (!t.name) out.push("Every team needs a name."); });
    return out;
  }

  function generateSection() {
    const phaseSel = el("select", {}, [el("option", { value: "" }, "All phases"), ...cfg().season.phases.map((p) => el("option", { value: p.id }, p.name || p.id))]);
    const out = el("div", { class: "sb-results" });
    const go = el("button", { type: "button", class: "btn btn-primary", onclick: () => {
      const issues = problems();
      if (issues.length) { out.replaceChildren(el("p", { class: "adm-status err" }, issues.join(" "))); return; }
      out.replaceChildren(el("p", { class: "adm-status" }, "Building the schedule…"));
      setTimeout(() => {
        const ids = phaseSel.value ? [phaseSel.value] : cfg().season.phases.map((p) => p.id);
        results = ids.map((id) => S.generate(cfg(), id, { attempts: 80 }));
        out.replaceChildren(preview(results));
      }, 30);
    } }, "Generate schedule");
    if (results) out.replaceChildren(preview(results));
    return section("6. Generate", "Set teams are placed first, then the generator tries many arrangements and keeps the one with no conflicts that follows the most rules. Nothing changes on the calendar until you click \"Add to calendar\".",
      el("div", { class: "adm-row wrap" }, phaseSel, go), out);
  }

  function preview(res) {
    const c = cfg();
    const team = (id) => c.teams.find((t) => t.id === id) || { name: id };
    const gym = (id) => c.gyms.find((g) => g.id === id) || { name: "No gym" };
    const coach = (id) => (c.coaches.find((x) => x.id === id) || {}).name;
    const blocks = res.map((r) => {
      const ph = c.season.phases.find((p) => p.id === r.phase) || {};
      const cols = WEEK.map((d) => {
        const items = r.placements.filter((p) => p.day === d);
        return el("div", { class: "sb-col" }, el("h5", {}, S.DAYS[d]),
          items.length ? items.map((p) => el("div", { class: `sb-block p-${team(p.team).program || "all"}${p.fixed ? " fixed" : ""}` },
            el("strong", {}, team(p.team).name),
            el("span", {}, `${E.formatTime(S.toHHMM(p.start))} – ${E.formatTime(S.toHHMM(p.end))}`),
            el("span", {}, `${gym(p.gym).name} · ${S.courtLabel(p)}`),
            el("small", {}, p.coaches.map(coach).filter(Boolean).join(", ") || "No coach"),
            p.fixed ? el("small", { class: "sb-fixed" }, "Set schedule") : null)) : el("small", { class: "sb-none" }, "—"));
      });
      const flexCount = r.placements.filter((p) => !p.fixed).length;
      return el("div", { class: "sb-phase" },
        el("h4", {}, `${ph.name || r.phase}`, el("small", {}, ph.start ? ` ${E.formatDate(E.parse(ph.start), { month: "short", day: "numeric" })} – ${E.formatDate(E.parse(ph.end), { month: "short", day: "numeric", year: "numeric" })}` : "")),
        el("p", { class: r.unplaced.length ? "adm-status err" : "adm-status ok" },
          r.unplaced.length ? `${flexCount} practices placed; ${r.unplaced.reduce((a, u) => a + u.missing, 0)} couldn't fit.` : `All ${flexCount} flexible practices placed with no conflicts.`),
        r.unplaced.length ? el("ul", { class: "sb-issues" }, r.unplaced.map((u) => el("li", {}, el("strong", {}, `${team(u.team).name}: `), `${u.missing} practice${u.missing === 1 ? "" : "s"} not placed. ${u.reason}`))) : null,
        r.warnings.length ? el("ul", { class: "sb-issues" }, r.warnings.map((w) => el("li", {}, w))) : null,
        el("div", { class: "sb-week" }, cols));
    });
    const phases = c.season.phases.filter((p) => res.some((r) => r.phase === p.id));
    const today = E.toKey(new Date());
    const firstStart = phases.map((p) => p.start).filter(Boolean).sort()[0] || today;
    const fromInput = el("input", { type: "date", value: firstStart > today ? firstStart : today });
    const apply = el("button", { type: "button", class: "btn btn-dark", onclick: () => {
      const from = fromInput.value;
      if (!from) return;
      const existing = state.events.filter((ev) => ev.source === "scheduler" && res.some((r) => r.phase === ev.phase) && (ev.date >= from || (ev.until || ev.date) >= from)).length;
      if (!confirm(`Add these practices to the calendar starting ${from}?${existing ? `\n\n${existing} previously generated practice series for ${phases.map((p) => p.name).join(", ")} will be replaced from that date on (including any individual changes you made to them after that date). Other events are not touched.` : ""}`)) return;
      const built = S.buildEvents(c, res, from, state.events, A.newId);
      state.events = built.events;
      A.setDirty(true);
      A.refresh();
      A.showTab("calendar");
      A.status(`Added ${built.added} weekly practice series${built.removed ? `, replaced ${built.removed}` : ""}.${built.notes.length ? ` ${built.notes.length} dates skipped for holidays or unavailability.` : ""} Review the calendar, then click Publish.`, "ok");
    } }, "Add to calendar");
    return el("div", {}, ...blocks,
      el("div", { class: "sb-apply" }, el("div", {}, el("strong", {}, "Happy with it?"), el("p", {}, "Practices repeat weekly through each phase's end date. Holidays and dated unavailability are skipped automatically.")),
        el("div", { class: "adm-row wrap" }, field("Start adding from", fromInput, "narrow"), apply)));
  }

  function render() {
    if (root.closest("[data-panel]").hidden) return;
    const c = cfg();
    c.season ||= A.emptyConfig().season;
    for (const k of ["gyms", "coaches", "teams", "rules"]) c[k] ||= [];
    const y = window.scrollY;
    root.replaceChildren(seasonSection(), gymsSection(), coachesSection(), teamsSection(), rulesSection(), generateSection());
    window.scrollTo(0, y);
  }
  // Redraw after outside changes (connect, reload) but never while someone is typing in the builder
  A.onRefresh(() => { if (!(document.activeElement && root.contains(document.activeElement))) render(); });
  window.HBCScheduleBuilder = { render: rerender, get results() { return results; } };
})();
