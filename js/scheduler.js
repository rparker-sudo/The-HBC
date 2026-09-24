// The HBC — practice schedule generator (pure logic, no page code).
// Builds a weekly practice pattern per season phase from gyms, courts, coaches, teams and rules,
// then turns it into weekly-repeating calendar events. Also finds conflicts between events.
(function (root) {
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const STEP = 15; // minutes between candidate start times
  const toMin = (t) => { if (!t) return null; const [h, m] = String(t).split(":").map(Number); return h * 60 + (m || 0); };
  const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const overlap = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;
  const cyclicGap = (a, b) => { const d = Math.abs(a - b) % 7; return Math.min(d, 7 - d); };

  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  const inPhase = (item, phaseId) => !item.phase || item.phase === phaseId;
  const isDated = (r) => !!(r.from || r.to);
  const dayOk = (r, d) => !r.days || !r.days.length || r.days.includes(d);
  const timeHits = (r, s, e) => { const rs = toMin(r.start), re = toMin(r.end); if (rs == null && re == null) return true; return overlap(s, e, rs ?? 0, re ?? 1440); };
  const targets = (r, id) => !r.target || r.target === "*" || r.target === id;

  function teamPerWeek(team, phaseId) {
    if (team.fixed) return 0;
    const v = team.perPhase && team.perPhase[phaseId];
    return v === undefined || v === "" || v === null ? Number(team.perWeek || 0) : Number(v);
  }

  // ---------------------------------------------------------------------------
  // Generate one phase's weekly pattern
  // ---------------------------------------------------------------------------
  function generate(config, phaseId, opts = {}) {
    const attempts = opts.attempts || 80;
    const gyms = (config.gyms || []).map((g) => ({ ...g, courts: Math.max(1, Number(g.courts) || 1), hours: (g.hours || []).filter((w) => inPhase(w, phaseId)) }));
    const gymById = Object.fromEntries(gyms.map((g) => [g.id, g]));
    const coachById = Object.fromEntries((config.coaches || []).map((c) => [c.id, c]));
    const rules = (config.rules || []).filter((r) => inPhase(r, phaseId) && !isDated(r));
    const teams = (config.teams || []);
    const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
    const warnings = [];

    // ---- fixed (not flexible) schedules go in first
    const fixed = [];
    for (const t of teams) {
      if (!t.fixed) continue;
      for (const slot of (t.fixedSlots || []).filter((s) => inPhase(s, phaseId))) {
        const g = gymById[slot.gym];
        const s = toMin(slot.start), e = toMin(slot.end);
        if (s == null || e == null || e <= s) { warnings.push(`${t.name}: a set practice has an invalid time and was skipped.`); continue; }
        const courts = String(slot.courts || "1").split(/[\s,]+/).map(Number).filter((n) => n > 0);
        for (const d of slot.days || []) {
          fixed.push({ team: t.id, day: d, start: s, end: e, gym: slot.gym || "", courts, share: t.courtUse === "shared", coaches: [...(t.coaches || [])], fixed: true, score: 0, gymMissing: !g });
        }
      }
    }

    // ---- flexible requests
    const requests = teams.filter((t) => teamPerWeek(t, phaseId) > 0).map((t) => ({ team: t, n: teamPerWeek(t, phaseId) }));

    // share partners: team -> [{partner, strength}]
    const shareRules = rules.filter((r) => r.kind === "share" && r.target && r.partner);
    const partnersOf = (tid) => shareRules.filter((r) => r.target === tid || r.partner === tid).map((r) => ({ partner: r.target === tid ? r.partner : r.target, strength: r.strength }));

    function units(p) { return p.share ? 1 : 2; }

    function evaluate(team, d, g, s, e, courts, placed, ctx) {
      // returns {ok, reason, score}
      const dur = e - s;
      let score = 0;
      const coaches = team.coaches || [];
      const mine = placed.filter((p) => p.team === team.id);
      if (mine.some((p) => p.day === d)) return { ok: false, reason: "one practice per day" };

      for (const r of rules) {
        let hit = false;
        switch (r.kind) {
          case "unavailable":
            if (!dayOk(r, d) || !timeHits(r, s, e)) break;
            if (r.subject === "team") hit = targets(r, team.id);
            else if (r.subject === "coach") hit = coaches.some((c) => targets(r, c));
            else if (r.subject === "gym") hit = targets(r, g.id);
            else if (r.subject === "court") hit = r.target === g.id && courts.includes(Number(r.court));
            break;
          case "gym": hit = targets(r, team.id) && r.gym && g.id !== r.gym; break;
          case "court": hit = targets(r, team.id) && (g.id !== r.gym || !courts.includes(Number(r.court))); break;
          case "days": hit = targets(r, team.id) && r.days && r.days.length && !r.days.includes(d); break;
          case "time": {
            const applies = r.subject === "coach" ? coaches.some((c) => targets(r, c)) : targets(r, team.id);
            const rs = toMin(r.start), re = toMin(r.end);
            hit = applies && ((rs != null && s < rs) || (re != null && e > re));
            break;
          }
          case "spacing": hit = targets(r, team.id) && mine.some((p) => cyclicGap(p.day, d) === 1); break;
          case "maxPerDay": {
            const max = Number(r.value) || 1;
            hit = coaches.some((c) => targets(r, c) && placed.filter((p) => p.day === d && p.coaches.includes(c)).length + 1 > max);
            break;
          }
          case "buffer": {
            const buf = Number(r.value) || 0;
            hit = coaches.some((c) => targets(r, c) && placed.some((p) => p.day === d && p.coaches.includes(c) && p.gym !== g.id &&
              (overlap(s - buf, e + buf, p.start, p.end))));
            break;
          }
          default: break;
        }
        if (hit) {
          if (r.strength === "must") return { ok: false, reason: ruleReason(r) };
          score -= r.kind === "unavailable" ? 15 : 10;
        } else if (r.strength === "prefer" && ["gym", "court", "days", "time"].includes(r.kind) && targets(r, team.id)) {
          score += 4;
        }
      }

      // coaches can't be in two places at once
      for (const c of coaches) {
        const clash = placed.find((p) => p.day === d && p.coaches.includes(c) && overlap(s, e, p.start, p.end));
        if (clash) return { ok: false, reason: `coach ${coachById[c] ? coachById[c].name : c} is busy` };
      }
      // court capacity (2 halves per court)
      const need = team.courtUse === "shared" ? 1 : 2;
      for (const c of courts) {
        const load = placed.filter((p) => p.gym === g.id && p.day === d && p.courts.includes(c) && overlap(s, e, p.start, p.end)).reduce((a, p) => a + units(p), 0);
        if (load + need > 2) return { ok: false, reason: "courts are full" };
      }

      // share partners
      for (const { partner, strength } of partnersOf(team.id)) {
        const pp = placed.filter((p) => p.team === partner);
        if (!pp.length) continue;
        const together = pp.some((p) => p.day === d && p.gym === g.id && p.start === s && p.courts.some((c) => courts.includes(c)));
        const partnerFree = pp.some((p) => !placed.some((q) => q.team === team.id && q.day === p.day));
        if (strength === "must" && !together && partnerFree) return { ok: false, reason: `must share a court with ${teamById[partner] ? teamById[partner].name : "partner"}` };
        score += together ? 12 : (strength === "prefer" ? -4 : 0);
      }

      // soft scoring: spread practices through the week
      for (const p of mine) { const gap = cyclicGap(p.day, d); score += gap === 1 ? -6 : gap === 2 ? 2 : 3; }
      // coaches: reward back-to-back at the same gym, penalize gym changes on one day
      for (const c of coaches) {
        for (const p of placed.filter((q) => q.day === d && q.coaches.includes(c))) {
          if (p.gym === g.id && (p.end === s || p.start === e)) score += 4;
          else if (p.gym !== g.id) score -= 3;
        }
      }
      // keep courts compact: reward touching another booking on the same court
      if (placed.some((p) => p.gym === g.id && p.day === d && p.courts.some((c) => courts.includes(c)) && (p.end === s || p.start === e))) score += 1;
      score -= dur > 0 ? 0 : 100;
      if (ctx && ctx.noise) score += ctx.noise();
      return { ok: true, score };
    }

    function ruleReason(r) {
      const L = { unavailable: "an unavailability rule", gym: "its gym rule", court: "its court rule", days: "its practice-day rule", time: "a time-window rule", spacing: "the no back-to-back days rule", maxPerDay: "a coach's max-per-day rule", buffer: "a coach's travel-time rule" };
      return L[r.kind] || "a rule";
    }

    function pickCourts(team, g, d, s, e, placed) {
      const need = team.courtUse === "shared" ? 1 : Math.max(1, Number(team.courts) || 1);
      const unit = team.courtUse === "shared" ? 1 : 2;
      const pref = rules.filter((r) => r.kind === "court" && targets(r, team.id) && r.gym === g.id).map((r) => Number(r.court));
      const blocked = new Set(rules.filter((r) => r.kind === "unavailable" && r.subject === "court" && r.strength === "must" && r.target === g.id && dayOk(r, d) && timeHits(r, s, e)).map((r) => Number(r.court)));
      const free = [];
      for (let c = 1; c <= g.courts; c++) {
        if (blocked.has(c)) continue;
        const load = placed.filter((p) => p.gym === g.id && p.day === d && p.courts.includes(c) && overlap(s, e, p.start, p.end)).reduce((a, p) => a + units(p), 0);
        if (load + unit <= 2) free.push({ c, load });
      }
      // shared teams prefer a court that already has a shared team (pairs up halves)
      free.sort((a, b) => (pref.includes(b.c) - pref.includes(a.c)) || (unit === 1 ? b.load - a.load : 0) || a.c - b.c);
      if (free.length < need) return null;
      return free.slice(0, need).map((x) => x.c).sort((a, b) => a - b);
    }

    function candidates(team, placed, ctx, tally) {
      const dur = Math.max(15, Number(team.minutes) || 90);
      const out = [];
      for (let d = 0; d < 7; d++) {
        for (const g of gyms) {
          for (const w of g.hours) {
            if (!(w.days || []).includes(d)) continue;
            const ws = toMin(w.start), we = toMin(w.end);
            if (ws == null || we == null) continue;
            for (let s = ws; s + dur <= we; s += STEP) {
              const e = s + dur;
              const courts = pickCourts(team, g, d, s, e, placed);
              if (!courts) { tally["courts are full"] = (tally["courts are full"] || 0) + 1; continue; }
              const r = evaluate(team, d, g, s, e, courts, placed, ctx);
              if (!r.ok) { tally[r.reason] = (tally[r.reason] || 0) + 1; continue; }
              out.push({ team: team.id, day: d, start: s, end: e, gym: g.id, courts, share: team.courtUse === "shared", coaches: [...(team.coaches || [])], score: r.score });
            }
          }
        }
      }
      return out;
    }

    function explain(team, tally) {
      const dur = Math.max(15, Number(team.minutes) || 90);
      if (!gyms.length) return "No gyms have been added yet.";
      if (!gyms.some((g) => g.hours.some((w) => toMin(w.end) - toMin(w.start) >= dur))) return `No gym has an open window of ${dur} minutes in this phase.`;
      const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
      return top.length ? `No open slot left: most times failed because ${top.join(", then ")}.` : "No open slot found.";
    }

    // difficulty ordering: teams with fewer options go first
    const baseCounts = new Map(requests.map((rq) => [rq.team.id, candidates(rq.team, fixed, null, {}).length]));

    let best = null;
    for (let a = 0; a < attempts; a++) {
      const rand = rng(1234 + a * 7919);
      const ctx = a === 0 ? null : { noise: () => rand() * 3 };
      const order = [...requests].sort((x, y) => {
        const dx = baseCounts.get(x.team.id) / Math.max(1, x.n), dy = baseCounts.get(y.team.id) / Math.max(1, y.n);
        return (dx - dy) + (a === 0 ? 0 : (rand() - 0.5) * 40);
      });
      // partners of a "share" rule go right after the first of the pair
      for (let i = 0; i < order.length; i++) {
        for (const { partner } of partnersOf(order[i].team.id)) {
          const j = order.findIndex((o) => o.team.id === partner);
          if (j > i + 1) order.splice(i + 1, 0, order.splice(j, 1)[0]);
        }
      }
      const placed = [...fixed];
      const unplaced = [];
      let total = 0;
      for (const rq of order) {
        let got = 0;
        const tally = {};
        for (let k = 0; k < rq.n; k++) {
          const cand = candidates(rq.team, placed, ctx, tally);
          if (!cand.length) break;
          cand.sort((p, q) => q.score - p.score || p.day - q.day || p.start - q.start);
          placed.push(cand[0]);
          total += cand[0].score;
          got++;
        }
        if (got < rq.n) unplaced.push({ team: rq.team.id, missing: rq.n - got, reason: explain(rq.team, tally) });
      }
      const placedCount = placed.length - fixed.length;
      const value = placedCount * 1000 + total;
      if (!best || value > best.value) best = { value, placements: placed, unplaced, attempt: a };
      if (!unplaced.length && a >= 20 && !shareRules.length) break;
    }

    // warn about clashes inside the fixed schedules
    for (let i = 0; i < fixed.length; i++) for (let j = i + 1; j < fixed.length; j++) {
      const a = fixed[i], b = fixed[j];
      if (a.day !== b.day || !overlap(a.start, a.end, b.start, b.end)) continue;
      const tn = (id) => (teamById[id] ? teamById[id].name : id);
      const sharedCoach = a.coaches.find((c) => b.coaches.includes(c));
      if (sharedCoach) warnings.push(`Set schedules clash: ${tn(a.team)} and ${tn(b.team)} share coach ${coachById[sharedCoach] ? coachById[sharedCoach].name : ""} on ${DAYS[a.day]}.`);
      if (a.gym === b.gym && a.courts.some((c) => b.courts.includes(c)) && units(a) + units(b) > 2) warnings.push(`Set schedules clash: ${tn(a.team)} and ${tn(b.team)} are on the same court on ${DAYS[a.day]}.`);
    }
    for (const f of fixed) if (f.gymMissing) warnings.push(`${teamById[f.team].name}: a set practice has no gym chosen.`);

    const placements = best ? best.placements.sort((a, b) => a.day - b.day || a.start - b.start || String(a.gym).localeCompare(String(b.gym))) : fixed;
    return { phase: phaseId, placements, unplaced: best ? best.unplaced : [], warnings };
  }

  // ---------------------------------------------------------------------------
  // Turn weekly patterns into calendar events
  // ---------------------------------------------------------------------------
  const pad = (n) => String(n).padStart(2, "0");
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

  function courtLabel(p) {
    if (!p.courts || !p.courts.length) return "";
    const base = p.courts.length > 1 ? `Courts ${p.courts.join(" & ")}` : `Court ${p.courts[0]}`;
    return p.share ? `${base} (shared)` : base;
  }

  // results: [{phase, placements}] ; applyFrom: "YYYY-MM-DD"
  function buildEvents(config, results, applyFrom, existing, idMaker) {
    const gymById = Object.fromEntries((config.gyms || []).map((g) => [g.id, g]));
    const coachById = Object.fromEntries((config.coaches || []).map((c) => [c.id, c]));
    const teamById = Object.fromEntries((config.teams || []).map((t) => [t.id, t]));
    const phaseById = Object.fromEntries(((config.season && config.season.phases) || []).map((p) => [p.id, p]));
    const blackouts = new Set((config.season && config.season.blackouts) || []);
    const datedRules = (config.rules || []).filter((r) => isDated(r) && r.kind === "unavailable" && r.strength === "must");
    const notes = [];
    let removed = 0;
    const newId = idMaker || (() => Math.random().toString(36).slice(2));

    const phaseIds = new Set(results.map((r) => r.phase));
    // remove / trim earlier generated practices for the phases being replaced
    const kept = [];
    for (const ev of existing) {
      if (ev.source !== "scheduler" || !phaseIds.has(ev.phase)) { kept.push(ev); continue; }
      if (ev.date >= applyFrom) { removed++; continue; }
      if (ev.repeat === "weekly" && ev.until >= applyFrom) {
        const trimmed = key(addDays(parse(applyFrom), -1));
        kept.push({ ...ev, until: trimmed, skip: (ev.skip || []).filter((s) => s <= trimmed) });
        continue;
      }
      kept.push(ev);
    }

    const added = [];
    for (const res of results) {
      const ph = phaseById[res.phase];
      if (!ph || !ph.start || !ph.end) { notes.push(`Phase ${ph ? ph.name : res.phase} has no dates, so it was skipped.`); continue; }
      const from = ph.start > applyFrom ? ph.start : applyFrom;
      if (from > ph.end) continue;
      for (const p of res.placements) {
        const team = teamById[p.team];
        if (!team) continue;
        const gym = gymById[p.gym];
        let first = parse(from);
        while (first.getDay() !== p.day) first = addDays(first, 1);
        if (key(first) > ph.end) continue;
        const skip = [];
        for (let d = first; key(d) <= ph.end; d = addDays(d, 7)) {
          const k = key(d);
          if (blackouts.has(k)) { skip.push(k); continue; }
          const hit = datedRules.find((r) => (!r.from || k >= r.from) && (!r.to || k <= r.to) && dayOk(r, p.day) && timeHits(r, p.start, p.end) && (
            (r.subject === "team" && targets(r, p.team)) ||
            (r.subject === "coach" && p.coaches.some((c) => targets(r, c))) ||
            (r.subject === "gym" && targets(r, p.gym)) ||
            (r.subject === "court" && r.target === p.gym && p.courts.includes(Number(r.court)))));
          if (hit) { skip.push(k); notes.push(`${team.name} on ${k} skipped (${r2text(hit, config)}).`); }
        }
        const names = p.coaches.map((c) => coachById[c] && coachById[c].name).filter(Boolean);
        added.push({
          id: newId(),
          title: `${team.name} Practice`,
          program: team.program || "all",
          type: "practice",
          date: key(first),
          start: toHHMM(p.start),
          end: toHHMM(p.end),
          repeat: "weekly",
          until: ph.end,
          skip,
          location: gym ? (gym.address || gym.name) : "",
          venue: gym ? gym.name : "",
          court: courtLabel(p),
          gym: p.gym,
          courts: p.courts,
          share: !!p.share,
          team: p.team,
          coachIds: p.coaches,
          coaches: names,
          phase: res.phase,
          phaseName: ph.name,
          source: "scheduler",
          series: `${p.team}-${res.phase}-${p.day}`,
          notes: "",
        });
      }
    }
    return { events: [...kept, ...added], added: added.length, removed, notes };
  }

  function r2text(r, config) {
    const find = (list, id) => ((config[list] || []).find((x) => x.id === id) || {}).name || "";
    const who = r.subject === "coach" ? find("coaches", r.target) : r.subject === "team" ? find("teams", r.target) : find("gyms", r.target);
    return `${who || r.subject} unavailable ${r.from || ""}${r.to && r.to !== r.from ? "–" + r.to : ""}`.trim();
  }

  // ---------------------------------------------------------------------------
  // Conflicts between calendar occurrences (coach, court or team double-booked)
  // occs: [{title, key, start, end, coachIds, coaches, gym, courts, share, team}]
  // ---------------------------------------------------------------------------
  function findConflicts(occs, coachNames = {}) {
    const byDay = {};
    for (const o of occs) if (o.start && o.end) (byDay[o.key] ||= []).push(o);
    const out = [];
    for (const [day, list] of Object.entries(byDay)) {
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (!overlap(toMin(a.start), toMin(a.end), toMin(b.start), toMin(b.end))) continue;
        const coach = (a.coachIds || []).find((c) => (b.coachIds || []).includes(c));
        if (coach) out.push({ day, a, b, kind: "coach", text: `${coachNames[coach] || "A coach"} is scheduled for both ${a.title} and ${b.title}` });
        if (a.gym && a.gym === b.gym && (a.courts || []).some((c) => (b.courts || []).includes(c)) && ((a.share ? 1 : 2) + (b.share ? 1 : 2) > 2))
          out.push({ day, a, b, kind: "court", text: `${a.title} and ${b.title} are on the same court` });
        if (a.team && a.team === b.team) out.push({ day, a, b, kind: "team", text: `${a.title} is scheduled twice at the same time` });
      }
    }
    return out;
  }

  const api = { DAYS, toMin, toHHMM, generate, buildEvents, findConflicts, courtLabel, teamPerWeek };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.HBCScheduler = api;
})(typeof window !== "undefined" ? window : globalThis);
