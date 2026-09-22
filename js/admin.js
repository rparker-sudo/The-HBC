// The HBC — calendar admin. Edits data/events.json in the GitHub repo through the GitHub API.
// The access key is only ever sent to api.github.com and (optionally) remembered in this browser.
(() => {
  const E = window.HBCEvents;
  const $ = (s, r = document) => r.querySelector(s);
  const SETTINGS_KEY = "hbc-admin-settings";
  const TOKEN_KEY = "hbc-admin-token";
  const DEFAULTS = { owner: "rparker-sudo", repo: "The-HBC", branch: "claude/gallant-knuth-wakdzl", path: "data/events.json" };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* storage blocked */ } },
  };

  let settings = { ...DEFAULTS };
  try { Object.assign(settings, JSON.parse(store.get(SETTINGS_KEY) || "{}")); } catch { /* ignore */ }

  const state = { events: [], sha: null, token: "", connected: false, dirty: false, editingId: null };

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

  // ---------- status + dirty tracking ----------
  function status(msg, kind = "") {
    const s = $("#adm-status");
    s.textContent = msg;
    s.className = "adm-status " + kind;
  }
  function setDirty(v) {
    state.dirty = v;
    $("#adm-publish").disabled = !v || !state.connected;
    $("#adm-unsaved").hidden = !v;
  }
  window.addEventListener("beforeunload", (e) => { if (state.dirty) { e.preventDefault(); e.returnValue = ""; } });

  // ---------- base64 (UTF-8 safe) ----------
  function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  const b64decode = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));

  // ---------- GitHub ----------
  const apiUrl = () => `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${settings.path}`;
  async function gh(url, opts = {}) {
    const res = await fetch(url, {
      ...opts,
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${state.token}`, "X-GitHub-Api-Version": "2022-11-28", ...(opts.headers || {}) },
    });
    return res;
  }

  async function connect() {
    const token = $("#adm-token").value.trim();
    if (!token) { status("Paste your access key first.", "err"); return; }
    state.token = token;
    status("Connecting to GitHub…");
    try {
      const res = await gh(`${apiUrl()}?ref=${encodeURIComponent(settings.branch)}`);
      if (res.status === 401) throw new Error("GitHub didn't accept that key. Check that you copied the whole key and that it hasn't expired.");
      if (res.status === 404) {
        // File (or access) missing. Confirm the repo is reachable before treating the calendar as new.
        const repo = await gh(`https://api.github.com/repos/${settings.owner}/${settings.repo}`);
        if (!repo.ok) throw new Error(`Couldn't reach ${settings.owner}/${settings.repo}. Make sure the key was given access to that repository.`);
        state.sha = null;
        if (!state.dirty) state.events = [];
      } else if (!res.ok) {
        throw new Error(`GitHub returned an error (${res.status}). Try again in a minute.`);
      } else {
        const file = await res.json();
        state.sha = file.sha;
        if (!state.dirty) state.events = (JSON.parse(b64decode(file.content)).events || []);
      }
      state.connected = true;
      if ($("#adm-remember").checked) store.set(TOKEN_KEY, token); else store.del(TOKEN_KEY);
      $("#adm-connect-card").classList.add("connected");
      $("#adm-editor").hidden = false;
      status(`Connected. Editing the live calendar (${state.events.length} event${state.events.length === 1 ? "" : "s"}).`, "ok");
      setDirty(state.dirty);
      renderTable();
    } catch (err) {
      state.connected = false;
      status(err.message || "Couldn't connect. Check your internet connection and try again.", "err");
    }
  }

  function disconnect() {
    if (state.dirty && !confirm("You have unpublished changes. Sign out anyway? They will be lost.")) return;
    store.del(TOKEN_KEY);
    Object.assign(state, { token: "", connected: false, sha: null, dirty: false });
    $("#adm-token").value = "";
    $("#adm-connect-card").classList.remove("connected");
    $("#adm-editor").hidden = true;
    status("Signed out. Your key was removed from this browser.");
  }

  async function publish() {
    if (!state.connected) return;
    const btn = $("#adm-publish");
    btn.disabled = true;
    status("Publishing to the website…");
    const data = { updated: E.toKey(new Date()), events: sortEvents(state.events) };
    const body = {
      message: `Update calendar (${state.events.length} events)`,
      content: b64encode(JSON.stringify(data, null, 2) + "\n"),
      branch: settings.branch,
    };
    if (state.sha) body.sha = state.sha;
    try {
      const res = await gh(apiUrl(), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.status === 409 || res.status === 422) throw new Error("The calendar was changed somewhere else since you opened it. Click Reload to get the latest version, then make your changes again.");
      if (res.status === 403 || res.status === 404) throw new Error("This key can't save changes. When creating it, set Contents to \"Read and write\".");
      if (!res.ok) throw new Error(`GitHub returned an error (${res.status}). Your changes are still here, so try Publish again.`);
      const out = await res.json();
      state.sha = out.content.sha;
      setDirty(false);
      status("Published! The public calendar updates within 1–2 minutes (refresh the page to see it).", "ok");
    } catch (err) {
      status(err.message, "err");
      btn.disabled = false;
    }
  }

  async function reload() {
    if (state.dirty && !confirm("Discard your unpublished changes and reload the live calendar?")) return;
    setDirty(false);
    await connect();
  }

  // ---------- events table ----------
  const sortEvents = (list) => [...list].sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.start || "").localeCompare(b.start || ""));
  const lastDate = (ev) => (ev.repeat === "weekly" && ev.until) ? ev.until : (ev.endDate || ev.date);

  function renderTable() {
    const q = $("#adm-search").value.trim().toLowerCase();
    const prog = $("#adm-filter").value;
    const showPast = $("#adm-past").checked;
    const today = E.toKey(new Date());
    const rows = sortEvents(state.events).filter((ev) =>
      (!q || [ev.title, ev.location, ev.notes].join(" ").toLowerCase().includes(q)) &&
      (prog === "any" || ev.program === prog) &&
      (showPast || lastDate(ev) >= today));
    const tbody = $("#adm-rows");
    tbody.replaceChildren();
    $("#adm-count").textContent = `${rows.length} shown · ${state.events.length} total`;
    if (!rows.length) {
      tbody.append(el("tr", {}, el("td", { colspan: "6", class: "adm-empty" }, state.events.length ? "No events match these filters." : "No events yet. Click \"Add event\" to create the first one.")));
      return;
    }
    for (const ev of rows) {
      const d = E.parse(ev.date);
      let when = E.formatDate(d, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
      if (ev.endDate) when += ` – ${E.formatDate(E.parse(ev.endDate), { month: "short", day: "numeric" })}`;
      const repeat = ev.repeat === "weekly" ? `Weekly (${E.formatDate(d, { weekday: "short" })}) until ${E.formatDate(E.parse(ev.until), { month: "short", day: "numeric", year: "numeric" })}` : "";
      tbody.append(el("tr", {},
        el("td", {}, el("strong", {}, when), repeat ? el("small", {}, repeat) : null),
        el("td", {}, el("strong", {}, ev.title), ev.location ? el("small", {}, ev.location) : null),
        el("td", {}, E.timeRange(ev)),
        el("td", {}, el("span", { class: `cal-tag prog p-${ev.program}` }, E.PROGRAMS[ev.program] || ev.program)),
        el("td", {}, E.TYPES[ev.type] || ev.type),
        el("td", { class: "adm-actions" },
          el("button", { type: "button", class: "adm-link", onclick: () => openEditor(ev) }, "Edit"),
          el("button", { type: "button", class: "adm-link", onclick: () => openEditor({ ...ev, id: null }) }, "Copy"),
          el("button", { type: "button", class: "adm-link danger", onclick: () => removeEvent(ev) }, "Delete"))));
    }
  }

  function removeEvent(ev) {
    if (!confirm(`Delete "${ev.title}" on ${ev.date}${ev.repeat === "weekly" ? " (and all its repeats)" : ""}?`)) return;
    state.events = state.events.filter((x) => x.id !== ev.id);
    setDirty(true);
    renderTable();
  }

  // ---------- editor ----------
  const form = $("#adm-form");
  const dlg = $("#adm-dialog");
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function syncFormVisibility() {
    $("#f-times").hidden = form.allDay.checked;
    $("#f-repeat-opts").hidden = !form.repeat.checked;
  }

  function openEditor(ev) {
    state.editingId = ev && ev.id ? ev.id : null;
    const v = ev || { program: "all", type: "practice" };
    $("#adm-dialog-title").textContent = state.editingId ? "Edit event" : "Add event";
    form.reset();
    form.title.value = v.title || "";
    form.program.value = v.program || "all";
    form.type.value = v.type || "practice";
    form.date.value = v.date || "";
    form.endDate.value = v.endDate || "";
    form.allDay.checked = !!(ev && ev.date && !v.start);
    form.start.value = v.start || "";
    form.end.value = v.end || "";
    form.location.value = v.location || "7661 Windfield Dr, Huntington Beach";
    form.notes.value = v.notes || "";
    form.repeat.checked = v.repeat === "weekly";
    form.until.value = v.until || "";
    form.skip.value = (v.skip || []).join(", ");
    $("#f-error").textContent = "";
    fillLocations();
    syncFormVisibility();
    dlg.showModal();
    form.title.focus();
  }

  // Suggest every location already used on the calendar
  function fillLocations() {
    const used = [...new Set(state.events.map((x) => x.location).filter(Boolean))].sort();
    $("#f-locations").replaceChildren(...used.map((l) => el("option", { value: l })));
  }

  function saveForm(e) {
    e.preventDefault();
    const err = (m) => { $("#f-error").textContent = m; };
    const f = form;
    const ev = {
      id: state.editingId || newId(),
      title: f.title.value.trim(),
      program: f.program.value,
      type: f.type.value,
      date: f.date.value,
      location: f.location.value.trim(),
      notes: f.notes.value.trim(),
    };
    if (!ev.title) return err("Please give the event a title.");
    if (!ev.date) return err("Please choose a date.");
    if (f.endDate.value) {
      if (f.endDate.value < ev.date) return err("The end date can't be before the start date.");
      if (f.endDate.value > ev.date) ev.endDate = f.endDate.value;
    }
    if (!f.allDay.checked) {
      if (!f.start.value) return err("Add a start time, or tick \"All day\".");
      ev.start = f.start.value;
      if (f.end.value) {
        if (f.end.value <= f.start.value) return err("The end time must be after the start time.");
        ev.end = f.end.value;
      }
    }
    if (f.repeat.checked) {
      if (!f.until.value) return err("Choose the last date this repeats until.");
      if (f.until.value < ev.date) return err("\"Repeat until\" must be after the first date.");
      ev.repeat = "weekly";
      ev.until = f.until.value;
      const skip = f.skip.value.split(/[\s,]+/).filter(Boolean).map(toISODate);
      if (skip.some((s) => !s)) return err("Dates to skip should look like 2026-11-26 or 11/26/2026, separated by commas.");
      ev.skip = skip;
    }
    if (state.editingId) state.events = state.events.map((x) => (x.id === state.editingId ? ev : x));
    else state.events.push(ev);
    dlg.close();
    setDirty(true);
    renderTable();
    status(`Saved "${ev.title}". Click "Publish to website" when you're done editing.`, "ok");
  }

  // ---------- CSV import ----------
  function parseCSV(text) {
    const rows = [];
    let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === "," || c === "\t") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((x) => x.trim()));
  }
  function toISODate(s) {
    s = (s || "").trim();
    if (!s) return "";
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return `${m[1]}-${E.pad(+m[2])}-${E.pad(+m[3])}`;
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (m) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${E.pad(+m[1])}-${E.pad(+m[2])}`;
    return null;
  }
  function toTime(s) {
    s = (s || "").trim().toLowerCase();
    if (!s) return "";
    const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?$/);
    if (!m) return null;
    let h = +m[1];
    const min = +(m[2] || 0);
    if (m[3]) { const pm = m[3].startsWith("p"); if (h === 12) h = pm ? 12 : 0; else if (pm) h += 12; }
    if (h > 23 || min > 59) return null;
    return `${E.pad(h)}:${E.pad(min)}`;
  }
  function toProgram(s) {
    s = (s || "").trim().toLowerCase();
    if (!s || /all|club|both|every/.test(s)) return "all";
    if (/boy/.test(s)) return "boys";
    if (/girl/.test(s)) return "girls";
    return null;
  }
  function toType(s) {
    s = (s || "").trim().toLowerCase();
    if (!s) return "event";
    for (const [k, label] of Object.entries(E.TYPES)) if (s === k || s === label.toLowerCase() || label.toLowerCase().startsWith(s)) return k;
    if (/tourn/.test(s)) return "tournament";
    if (/closed|no practice|holiday|off/.test(s)) return "off";
    return "event";
  }

  function importCSV() {
    const text = $("#adm-csv").value;
    const out = $("#adm-csv-result");
    const rows = parseCSV(text);
    if (rows.length < 2) { out.textContent = "Paste a header row plus at least one event row."; out.className = "adm-status err"; return; }
    const head = rows[0].map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"));
    const col = (name) => head.indexOf(name);
    if (col("date") < 0 || col("title") < 0) { out.textContent = "The first row must be the column names and include at least \"date\" and \"title\"."; out.className = "adm-status err"; return; }
    const added = [], problems = [];
    rows.slice(1).forEach((r, i) => {
      const get = (n) => (col(n) >= 0 ? (r[col(n)] || "").trim() : "");
      const line = i + 2;
      const ev = { id: newId(), title: get("title"), date: toISODate(get("date")), program: toProgram(get("program")), type: toType(get("type")), location: get("location"), notes: get("notes") };
      const endDate = toISODate(get("end_date")), start = toTime(get("start")), end = toTime(get("end")), until = toISODate(get("repeat_until"));
      if (!ev.title) return problems.push(`Row ${line}: missing title`);
      if (!ev.date) return problems.push(`Row ${line}: date "${get("date")}" not understood (use 2026-10-03 or 10/3/2026)`);
      if (ev.program === null) return problems.push(`Row ${line}: program "${get("program")}" should be boys, girls or all`);
      if (endDate === null || until === null) return problems.push(`Row ${line}: end_date or repeat_until not understood`);
      if (start === null || end === null) return problems.push(`Row ${line}: time not understood (use 16:00 or 4:00 PM)`);
      if (endDate && endDate > ev.date) ev.endDate = endDate;
      if (start) ev.start = start;
      if (end && start && end > start) ev.end = end;
      if (until && until > ev.date) { ev.repeat = "weekly"; ev.until = until; ev.skip = []; }
      added.push(ev);
    });
    state.events.push(...added);
    if (added.length) setDirty(true);
    renderTable();
    out.className = "adm-status " + (problems.length ? "err" : "ok");
    out.textContent = `Added ${added.length} event${added.length === 1 ? "" : "s"}.` + (problems.length ? ` Skipped ${problems.length}: ${problems.join("; ")}.` : " Review them below, then Publish.");
    if (added.length && !problems.length) $("#adm-csv").value = "";
  }

  function download(name, text, type) {
    const a = el("a", { href: URL.createObjectURL(new Blob([text], { type })), download: name });
    document.body.append(a); a.click(); a.remove();
  }
  const TEMPLATE = [
    "date,end_date,start,end,title,program,type,location,notes,repeat_until",
    "2026-10-06,,6:00 PM,8:00 PM,16s Practice,boys,practice,7661 Windfield Dr,,2027-05-25",
    "2026-11-14,2026-11-15,,,Fall Classic Tournament,girls,tournament,Long Beach Convention Center,Check-in 7:30 AM,",
    "2026-11-26,,,,Thanksgiving - No Practice,all,off,,,",
  ].join("\n") + "\n";

  // ---------- wire up ----------
  function init() {
    // settings
    for (const k of Object.keys(DEFAULTS)) $(`#s-${k}`).value = settings[k];
    $("#adm-settings-save").addEventListener("click", () => {
      for (const k of Object.keys(DEFAULTS)) settings[k] = $(`#s-${k}`).value.trim() || DEFAULTS[k];
      store.set(SETTINGS_KEY, JSON.stringify(settings));
      status("Settings saved. Click Connect.", "ok");
    });
    $("#adm-connect").addEventListener("click", connect);
    $("#adm-token").addEventListener("keydown", (e) => { if (e.key === "Enter") connect(); });
    $("#adm-signout").addEventListener("click", disconnect);
    $("#adm-reload").addEventListener("click", reload);
    $("#adm-publish").addEventListener("click", publish);
    $("#adm-add").addEventListener("click", () => openEditor(null));
    ["#adm-search", "#adm-filter", "#adm-past"].forEach((s) => $(s).addEventListener("input", renderTable));
    form.addEventListener("submit", saveForm);
    form.allDay.addEventListener("change", syncFormVisibility);
    form.repeat.addEventListener("change", syncFormVisibility);
    $("#f-cancel").addEventListener("click", () => dlg.close());
    $("#adm-csv-import").addEventListener("click", importCSV);
    $("#adm-csv-template").addEventListener("click", () => download("hbc-calendar-template.csv", TEMPLATE, "text/csv"));
    $("#adm-backup").addEventListener("click", () => download(`hbc-calendar-backup-${E.toKey(new Date())}.json`, JSON.stringify({ events: sortEvents(state.events) }, null, 2), "application/json"));

    // type + program options
    for (const [k, v] of Object.entries(E.TYPES)) form.type.append(el("option", { value: k }, v));
    for (const [k, v] of Object.entries(E.PROGRAMS)) form.program.append(el("option", { value: k }, v));

    const saved = store.get(TOKEN_KEY);
    if (saved) { $("#adm-token").value = saved; $("#adm-remember").checked = true; connect(); }
  }
  init();
})();
