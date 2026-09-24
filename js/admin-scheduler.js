// The HBC — Schedule Builder UI: season phases, gyms, coaches, teams, rules, generate + apply.
(() => {
  const A = window.HBCAdmin, E = window.HBCEvents, S = window.HBCScheduler;
  const { el, state } = A;
  const root = document.getElementById("sb-root");
  if (!root) return;
  const cfg = () => state.config;
  const changed = () => A.setDirty(true, "config");
  const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun

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
  const ordinal = (n) => n + (["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] || "th");
  const gymById = (id) => cfg().gyms.find((g) => g.id === id);
  function courtOpts(gymId) {
    const g = gymById(gymId);
    if (!g) return [["", "Pick a gym first"]];
    return [["", "Choose…"], ...S.courtOrder(g, cfg()).map((c) => [String(c), S.courtName(g, c)])];
  }
  // checkboxes for a gym's courts, stored on obj[key] as "1,3"
  function courtPicker(obj, key, gymId) {
    const g = gymById(gymId);
    if (!g) return el("small", { class: "sb-hint" }, "Pick a gym first");
    const chosen = () => String(obj[key] || "").split(/[\s,]+/).map(Number).filter(Boolean);
    return el("div", { class: "sb-days" }, S.courtOrder(g, cfg()).map((c) => el("label", {},
      el("input", { type: "checkbox", checked: chosen().includes(c) ? "" : null, onchange: (e) => {
        const cur = chosen();
        obj[key] = (e.target.checked ? [...new Set([...cur, c])] : cur.filter((x) => x !== c)).join(","); changed(); } }),
      S.courtName(g, c))));
  }
  function moveBtns(list, i, label) {
    return el("span", { class: "sb-move" },
      el("button", { type: "button", class: "sb-arrow", title: `Move ${label} up`, "aria-label": `Move ${label} up`, disabled: i === 0 ? "" : null,
        onclick: () => { [list[i - 1], list[i]] = [list[i], list[i - 1]]; changed(); rerender(); } }, "↑"),
      el("button", { type: "button", class: "sb-arrow", title: `Move ${label} down`, "aria-label": `Move ${label} down`, disabled: i === list.length - 1 ? "" : null,
        onclick: () => { [list[i + 1], list[i]] = [list[i], list[i + 1]]; changed(); rerender(); } }, "↓"));
  }
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
      g.courtNames ||= {};
      const n = Math.max(1, Number(g.courts) || 1);
      const courtRows = Array.from({ length: n }, (_, j) => j + 1).map((c) => el("div", { class: "sb-court" },
        el("span", { class: "sb-courtno" }, `#${c}`),
        el("input", { value: g.courtNames[c] || "", placeholder: `Court ${c}`, "aria-label": `Name for court ${c}`,
          oninput: (e) => { g.courtNames[c] = e.target.value; changed(); } })));
      return el("div", { class: "sb-item sb-gym" },
        el("div", { class: "sb-row" },
          field("Gym name", text(g, "name", { placeholder: "Windfield Gym" })),
          field("Address", text(g, "address", { placeholder: "7661 Windfield Dr, Huntington Beach" }), "grow"),
          field("Number of courts", el("input", { type: "number", min: 1, max: 20, value: g.courts ?? 1,
            onchange: (e) => { g.courts = Math.max(1, Number(e.target.value) || 1); changed(); rerender(); } }), "narrow"),
          removeBtn(() => { if (confirm(`Remove ${g.name || "this gym"}?`)) { gyms.splice(i, 1); changed(); rerender(); } })),
        el("p", { class: "sb-sub" }, "Court names"),
        el("div", { class: "sb-courts" }, courtRows),
        el("p", { class: "sb-sub" }, "Available times"),
        ...g.hours.map((w, j) => el("div", { class: "sb-row sb-hours" },
          daysPicker(w), field("From", text(w, "start", { type: "time" }), "narrow"), field("To", text(w, "end", { type: "time" }), "narrow"),
          field("Phase", choose(w, "phase", phaseOpts()), "narrow"),
          removeBtn(() => { g.hours.splice(j, 1); changed(); rerender(); }, "×"))),
        el("button", { type: "button", class: "adm-link", onclick: () => { g.hours.push({ days: [1, 2, 3, 4, 5], start: "16:00", end: "21:00", phase: "" }); changed(); rerender(); } }, "+ Add available time"));
    });
    return section("2. Gyms & courts", "Add each gym, name its courts, and set when you can use it. Times can differ by phase.",
      ...cards, addBtn("+ Add gym", () => { gyms.push({ id: A.newId(), name: "", address: "", courts: 2, courtNames: {}, hours: [{ days: [1, 2, 3, 4, 5], start: "16:00", end: "21:00", phase: "" }] }); changed(); rerender(); }));
  }

  // Ordered list of every court; owner[key] holds [{gym, court, off?}]. withOff adds "Don't use" boxes.
  function priorityEditor(owner, key, withOff) {
    owner[key] = S.priorityList({ gyms: cfg().gyms, courtPriority: owner[key] });
    const list = owner[key];
    const gname = (id) => (gymById(id) || {}).name || "Unnamed gym";
    let n = 0;
    return el("ol", { class: "sb-prio-list" }, list.map((x, i) => el("li", { class: "sb-court" + (x.off ? " off" : "") },
      el("span", { class: "sb-rank" }, x.off ? "—" : ordinal(++n)),
      el("span", { class: "sb-prio-name" }, el("strong", {}, S.courtName(gymById(x.gym), x.court)), el("small", {}, gname(x.gym))),
      withOff ? el("label", { class: "sb-off" }, el("input", { type: "checkbox", checked: x.off ? "" : null,
        onchange: (e) => { if (e.target.checked) x.off = true; else delete x.off; changed(); rerender(); } }), "Don't use") : null,
      moveBtns(list, i, S.courtName(gymById(x.gym), x.court)))));
  }

  function prioritySection() {
    if (!cfg().gyms.length) return section("Court priority", "Add a gym above to set which courts are used first.");
    return section("Court priority", "One list for every court at every gym. The generator fills the 1st court before the 2nd, and so on. Use the arrows to reorder. Teams can have their own list (see each team below). Rules like \"Team uses a certain gym or court\" still come first.",
      priorityEditor(cfg(), "courtPriority", false));
  }

  // Editable weekly practice rows (used for set schedules and generated schedules)
  function slotRows(t, key, emptyText) {
    t[key] ||= [];
    const rows = t[key].map((s, j) => el("div", { class: "sb-row sb-hours" },
      daysPicker(s), field("From", text(s, "start", { type: "time" }), "narrow"), field("To", text(s, "end", { type: "time" }), "narrow"),
      field("Gym", choose(s, "gym", listOpts("gyms"), rerender), "narrow"), el("div", { class: "sb-field" }, el("span", {}, "Court(s)"), courtPicker(s, "courts", s.gym)),
      field("Phase", choose(s, "phase", phaseOpts()), "narrow"),
      removeBtn(() => { t[key].splice(j, 1); changed(); rerender(); }, "×")));
    return rows.length ? rows : [el("p", { class: "sb-hint" }, emptyText)];
  }
  const addSlot = (t, key, label) => el("button", { type: "button", class: "adm-link", onclick: () => {
    t[key] ||= [];
    t[key].push({ id: A.newId(), days: [2, 4], start: "18:00", end: "20:00", gym: (cfg().gyms[0] || {}).id || "", courts: "", phase: key === "generatedSlots" ? ((cfg().season.phases[0] || {}).id || "") : "" });
    changed(); rerender(); } }, label);

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
        field("Schedule", choose(t, "fixed", [["", "Flexible (generate it)"], ["true", "Set schedule (not flexible)"]], () => {
          t.fixed = t.fixed === "true" || t.fixed === true;
          if (t.fixed) { t.fixedSlots ||= []; if (!t.fixedSlots.length && (t.generatedSlots || []).length) { t.fixedSlots = t.generatedSlots; t.generatedSlots = []; } }
          rerender(); })),
        removeBtn(() => { if (confirm(`Remove ${t.name || "this team"}?`)) { teams.splice(i, 1); changed(); rerender(); } }));
      const coachBox = el("div", { class: "sb-days" }, (cfg().coaches.length ? cfg().coaches : []).map((c) => el("label", {},
        el("input", { type: "checkbox", checked: t.coaches.includes(c.id) ? "" : null, onchange: (e) => { t.coaches = e.target.checked ? [...t.coaches, c.id] : t.coaches.filter((x) => x !== c.id); changed(); } }), c.name || "(unnamed)")));
      const courtUse = el("div", { class: "sb-row" },
        field("Court use", choose(t, "courtUse", [["", "Full court(s)"], ["shared", "Shared court (half court with another team)"]], rerender)),
        t.courtUse === "shared" ? null : field("Courts needed", text(t, "courts", { type: "number", min: 1, max: 6, placeholder: "1" }), "narrow"));
      let body;
      if (t.fixed) {
        body = el("div", {}, el("p", { class: "sb-sub" }, "Set practice times (placed first; the generator schedules everyone else around them)"),
          ...slotRows(t, "fixedSlots", "No set times yet."), addSlot(t, "fixedSlots", "+ Add set practice time"));
      } else {
        t.perPhase ||= {};
        const gen = (t.generatedSlots || []).length;
        body = el("div", {},
          el("div", { class: "sb-row" },
            field("Practices per week", text(t, "perWeek", { type: "number", min: 0, max: 7, placeholder: "2" }), "narrow"),
            ...phases.map((p) => field(`${p.name || p.id} (optional)`, text(t.perPhase, p.id, { type: "number", min: 0, max: 7, placeholder: "same" }), "narrow")),
            field("Practice length (minutes)", text(t, "minutes", { type: "number", min: 30, step: 15, placeholder: "120" }), "narrow")),
          el("div", { class: "sb-generated" },
            el("div", { class: "sb-gen-head" },
              el("span", { class: "sb-sub" }, "Generated schedule (edit any time)"),
              gen ? el("button", { type: "button", class: "adm-link", title: "Keep these times: the team becomes a set schedule and won't be moved by the generator",
                onclick: () => { if (!confirm(`Lock the times for ${t.name || "this team"}? The team becomes a set schedule, and generating again won't move it.`)) return;
                  t.fixed = true; t.fixedSlots = [...(t.fixedSlots || []), ...t.generatedSlots]; t.generatedSlots = []; changed(); rerender(); } }, "Lock as set schedule") : null),
            ...slotRows(t, "generatedSlots", "Click Generate below to fill this in. You can then change any day, time, gym or court here."),
            addSlot(t, "generatedSlots", "+ Add practice time")));
      }
      const prio = el("div", { class: "sb-team-prio" },
        field("Court priority", choose(t, "customPriority", [["", "Use the club court priority"], ["true", "Custom order for this team"]], () => {
          t.customPriority = t.customPriority === "true" || t.customPriority === true;
          if (t.customPriority && !(t.courtPriority || []).length) t.courtPriority = S.priorityList(cfg()).map((x) => ({ gym: x.gym, court: x.court }));
          rerender(); }), "narrow"),
        t.customPriority && cfg().gyms.length ? priorityEditor(t, "courtPriority", true) : null);
      return el("div", { class: `sb-item sb-team p-${t.program || "all"}` }, head, el("p", { class: "sb-sub" }, "Coaches"), cfg().coaches.length ? coachBox : el("small", {}, "Add coaches above first."), courtUse, prio, body);
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
        parts.push(field(r.subject === "court" ? "Gym" : "Name", choose(r, "target", listOpts(r.subject === "court" ? "gyms" : r.subject === "team" ? "teams" : r.subject === "gym" ? "gyms" : "coaches"), r.subject === "court" ? rerender : null)));
        if (r.subject === "court") parts.push(field("Court", choose(r, "court", courtOpts(r.target))));
        parts.push(el("div", { class: "sb-field" }, el("span", {}, "Days (none = every day)"), daysPicker(r)));
        parts.push(field("From time", text(r, "start", { type: "time" }), "narrow"), field("To time", text(r, "end", { type: "time" }), "narrow"));
        parts.push(field("Only from date", text(r, "from", { type: "date" }), "narrow"), field("Until date", text(r, "to", { type: "date" }), "narrow"));
        break;
      case "gym":
        parts.push(field("Team", choose(r, "target", listOpts("teams", "All teams"))), field("Gym", choose(r, "gym", listOpts("gyms"))));
        break;
      case "court":
        parts.push(field("Team", choose(r, "target", listOpts("teams"))), field("Gym", choose(r, "gym", listOpts("gyms"), rerender)), field("Court", choose(r, "court", courtOpts(r.gym))));
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

  let lastRun = null; // { phaseId: {unplaced, warnings} } from the most recent Generate

  function generateSection() {
    const c = cfg();
    const phaseSel = el("select", {}, [el("option", { value: "" }, "All phases"), ...c.season.phases.map((p) => el("option", { value: p.id }, p.name || p.id))]);
    const out = el("div", { class: "sb-results" });
    const go = el("button", { type: "button", class: "btn btn-primary", onclick: () => {
      const issues = problems();
      if (issues.length) { out.replaceChildren(el("p", { class: "adm-status err" }, issues.join(" "))); return; }
      const ids = phaseSel.value ? [phaseSel.value] : c.season.phases.map((p) => p.id);
      const edited = c.teams.some((t) => !t.fixed && (t.generatedSlots || []).some((s) => ids.includes(s.phase)));
      if (edited && !confirm("Generating replaces the generated times in each flexible team's listing for the selected phase(s), including edits you made there. Lock a team first to keep its times. Continue?")) return;
      out.replaceChildren(el("p", { class: "adm-status" }, "Building the schedule…"));
      setTimeout(() => {
        const res = ids.map((id) => S.generate(c, id, { attempts: 80 }));
        lastRun = Object.fromEntries(res.map((r) => [r.phase, r]));
        for (const t of c.teams) {
          if (t.fixed) continue;
          const keep = (t.generatedSlots || []).filter((s) => !ids.includes(s.phase));
          const fresh = res.flatMap((r) => (S.toSlots(r, A.newId)[t.id] || []));
          t.generatedSlots = [...keep, ...fresh];
        }
        changed();
        rerender();
        const target = document.getElementById("sb-preview");
        if (target) target.scrollIntoView({ block: "start" });
      }, 30);
    } }, "Generate schedule");
    const hasSlots = c.teams.some((t) => (t.fixed ? t.fixedSlots : t.generatedSlots || []).length);
    if (hasSlots) out.replaceChildren(preview());
    return section("6. Generate", "Set schedules are placed first, then the generator tries many arrangements and keeps the one with no conflicts that follows the most rules. Results are written into each team's listing above, where you can edit them. Nothing changes on the calendar until you click \"Add to calendar\".",
      el("div", { class: "adm-row wrap" }, phaseSel, go), out);
  }

  // Weekly board for every phase, built from the teams' current set + generated times
  function preview() {
    const c = cfg();
    const team = (id) => c.teams.find((t) => t.id === id) || { name: id };
    const gym = (id) => c.gyms.find((g) => g.id === id) || { name: "No gym" };
    const coach = (id) => (c.coaches.find((x) => x.id === id) || {}).name;
    const byPhase = c.season.phases.map((ph) => ({ ph, ...S.slotsFor(c, ph.id) }));
    const blocks = byPhase.map(({ ph, placements, warnings }) => {
      const run = lastRun && lastRun[ph.id];
      const clashes = S.slotConflicts(c, placements);
      const cols = WEEK.map((d) => {
        const items = placements.filter((p) => p.day === d).sort((a, b) => a.start - b.start);
        return el("div", { class: "sb-col" }, el("h5", {}, S.DAYS[d]),
          items.length ? items.map((p) => el("div", { class: `sb-block p-${team(p.team).program || "all"}${p.fixed ? " fixed" : ""}` },
            el("strong", {}, team(p.team).name),
            el("span", {}, `${E.formatTime(S.toHHMM(p.start))} – ${E.formatTime(S.toHHMM(p.end))}`),
            el("span", {}, `${gym(p.gym).name} · ${S.courtLabel(p, c.gyms.find((g) => g.id === p.gym))}`),
            el("small", {}, p.coaches.map(coach).filter(Boolean).join(", ") || "No coach"),
            p.fixed ? el("small", { class: "sb-fixed" }, "Set schedule") : null)) : el("small", { class: "sb-none" }, "—"));
      });
      const missing = run ? run.unplaced : [];
      const status = !placements.length ? ["", "Nothing scheduled in this phase yet."]
        : clashes.length ? ["err", `${placements.length} practices a week · ${clashes.length} clash${clashes.length === 1 ? "" : "es"} to fix`]
        : missing.length ? ["err", `${placements.length} practices a week · ${missing.reduce((a, u) => a + u.missing, 0)} couldn't fit`]
        : ["ok", `${placements.length} practices a week · no conflicts`];
      return el("div", { class: "sb-phase" },
        el("h4", {}, `${ph.name || ph.id}`, el("small", {}, ph.start ? ` ${E.formatDate(E.parse(ph.start), { month: "short", day: "numeric" })} – ${ph.end ? E.formatDate(E.parse(ph.end), { month: "short", day: "numeric", year: "numeric" }) : "?"}` : "")),
        el("p", { class: `adm-status ${status[0]}` }, status[1]),
        clashes.length ? el("ul", { class: "sb-issues" }, clashes.map((w) => el("li", {}, w))) : null,
        missing.length ? el("ul", { class: "sb-issues" }, missing.map((u) => el("li", {}, el("strong", {}, `${team(u.team).name}: `), `${u.missing} practice${u.missing === 1 ? "" : "s"} not placed. ${u.reason}`))) : null,
        [...warnings, ...(run ? run.warnings : [])].length ? el("ul", { class: "sb-issues" }, [...new Set([...warnings, ...(run ? run.warnings : [])])].map((w) => el("li", {}, w))) : null,
        placements.length ? el("div", { class: "sb-week" }, cols) : null);
    });
    const phases = byPhase.filter((x) => x.placements.length).map((x) => x.ph);
    const today = E.toKey(new Date());
    const firstStart = phases.map((p) => p.start).filter(Boolean).sort()[0] || today;
    const fromInput = el("input", { type: "date", value: firstStart > today ? firstStart : today });
    const apply = el("button", { type: "button", class: "btn btn-dark", onclick: () => {
      const from = fromInput.value;
      if (!from || !phases.length) return;
      const res = phases.map((ph) => ({ phase: ph.id, placements: S.slotsFor(c, ph.id).placements }));
      const clashCount = res.reduce((a, r) => a + S.slotConflicts(c, r.placements).length, 0);
      if (clashCount && !confirm(`There ${clashCount === 1 ? "is 1 clash" : `are ${clashCount} clashes`} in these times (shown in red above). Add to the calendar anyway?`)) return;
      const existing = state.events.filter((ev) => ev.source === "scheduler" && res.some((r) => r.phase === ev.phase) && (ev.date >= from || (ev.until || ev.date) >= from)).length;
      if (!confirm(`Add these practices to the calendar starting ${from}?${existing ? `\n\n${existing} previously generated practice series for ${phases.map((p) => p.name).join(", ")} will be replaced from that date on (including any individual changes you made to them after that date). Other events are not touched.` : ""}`)) return;
      const built = S.buildEvents(c, res, from, state.events, A.newId);
      state.events = built.events;
      A.setDirty(true);
      A.refresh();
      A.showTab("calendar");
      A.status(`Added ${built.added} weekly practice series${built.removed ? `, replaced ${built.removed}` : ""}.${built.notes.length ? ` ${built.notes.length} dates skipped for holidays or unavailability.` : ""} Review the calendar, then click Publish.`, "ok");
    } }, "Add to calendar");
    return el("div", { id: "sb-preview" }, ...blocks,
      el("div", { class: "sb-apply" }, el("div", {}, el("strong", {}, "Happy with it?"), el("p", {}, "This uses the times shown above, including your edits. Practices repeat weekly through each phase's end date; holidays and dated unavailability are skipped.")),
        el("div", { class: "adm-row wrap" }, field("Start adding from", fromInput, "narrow"), apply)));
  }

  function render() {
    if (root.closest("[data-panel]").hidden) return;
    const c = cfg();
    c.season ||= A.emptyConfig().season;
    for (const k of ["gyms", "coaches", "teams", "rules"]) c[k] ||= [];
    const y = window.scrollY;
    root.replaceChildren(seasonSection(), gymsSection(), prioritySection(), coachesSection(), teamsSection(), rulesSection(), generateSection());
    window.scrollTo(0, y);
  }
  // Redraw after outside changes (connect, reload) but never while someone is typing in the builder
  A.onRefresh(() => { if (!(document.activeElement && root.contains(document.activeElement))) render(); });
  window.HBCScheduleBuilder = { render: rerender };
})();
