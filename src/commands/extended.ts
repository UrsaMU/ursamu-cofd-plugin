// +extended command: manage CoFD 2e Extended Actions (core p.70).
//
// Switches:
//   /start    open a new action (owner = u.me)
//   /roll     roll the owner's single active action, append attemptsLog
//   /status   view a specific action (default: owner's active)
//   /list     list mine|here|all (all is admin-only)
//   /abandon  owner or admin
//   /finish   admin-only force-success
//   /contest  admin-only pair-link two actions
//
// Reads u.me.state.cofd; writes "data.cofd" for Willpower spend.

import { divider, type IDBObj, type IUrsamuSDK } from "@ursamu/ursamu";
import { defaultSheet, type CofdSheet } from "../stats/index.ts";
import { parseRollExpression, executeRoll, type AgainThreshold } from "../roller/index.ts";
import {
  abandonExtendedAction,
  createExtendedAction,
  type ExtendedAction,
  type ExtendedInterval,
  finishExtendedAction,
  getActiveForOwner,
  getExtendedAction,
  linkContest,
  listAll,
  listForOwner,
  listForRoom,
  nextAttemptPenalty,
  recordAttempt,
} from "../subsystems/extended.ts";

/** Staff gate: admin / builder / wizard flag on the actor. */
function isStaff(actor: IDBObj): boolean {
  const f = actor.flags as Set<string> | undefined;
  if (!f) return false;
  return f.has?.("admin") || f.has?.("builder") || f.has?.("wizard");
}

const VALID_INTERVALS: ReadonlySet<string> = new Set([
  "turn",
  "hour",
  "day",
  "scene",
]);

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

async function panel(u: IUrsamuSDK, lines: string[]): Promise<void> {
  const head = await divider("E X T E N D E D");
  u.send([head, ...lines].join("\n"));
}

function statusGlyph(s: ExtendedAction["status"]): string {
  switch (s) {
    case "active":     return "%ch%cyactive%cn";
    case "succeeded":  return "%ch%cgsucceeded%cn";
    case "failed":     return "%ch%crfailed%cn";
    case "abandoned":  return "%ch%cxabandoned%cn";
  }
}

function summarize(a: ExtendedAction): string {
  const pct = `${a.accumulated}/${a.target}`;
  const att = `${a.attempts}/${a.maxRolls}`;
  return `  [${a.id}] ${statusGlyph(a.status)}  ${a.ownerName}  ${a.pool} ` +
    `accum ${pct} attempts ${att} - ${a.description}`;
}

function detail(a: ExtendedAction): string[] {
  const lines: string[] = [];
  lines.push(`  Id:           ${a.id}`);
  lines.push(`  Owner:        ${a.ownerName} (${a.ownerId})`);
  lines.push(`  Description:  ${a.description}`);
  lines.push(`  Pool:         ${a.pool}`);
  lines.push(`  Target:       ${a.target}`);
  lines.push(`  Max rolls:    ${a.maxRolls}`);
  lines.push(`  Interval:     ${a.interval}`);
  lines.push(`  Cumulative:   ${a.cumulativePenalty ? "yes" : "no"}`);
  lines.push(`  Accumulated:  ${a.accumulated}`);
  lines.push(`  Attempts:     ${a.attempts}`);
  lines.push(`  Status:       ${statusGlyph(a.status)}`);
  if (a.contestId) lines.push(`  Contest:      ${a.contestId}`);
  if (a.lastRollPenalty) lines.push(`  Next penalty: ${a.lastRollPenalty}`);
  if (a.attemptsLog.length > 0) {
    lines.push(`  Log:`);
    for (const log of a.attemptsLog) {
      const tag = log.exceptional ? " excep" : log.dramatic ? " dramatic" : "";
      lines.push(`    #${log.idx}: ${log.successes} succ (${log.roll.join(" ")})${tag}`);
    }
  }
  return lines;
}

// ---------------------------------------------------------------------------
// /start
// ---------------------------------------------------------------------------

interface StartParsed {
  pool: string;
  target: number;
  maxRolls: number | null;
  interval: ExtendedInterval;
  cumulative: boolean;
  description: string;
  error?: string;
}

/**
 * Parse: <pool>=<target>[/<maxRolls>][/<interval>][/cum] <description>
 * Example: intelligence+occult=10/8/scene/cum Decipher the grimoire
 */
export function parseStartArgs(rest: string): StartParsed {
  const blank: StartParsed = {
    pool: "",
    target: 0,
    maxRolls: null,
    interval: "scene",
    cumulative: false,
    description: "",
  };
  const eqIdx = rest.indexOf("=");
  if (eqIdx < 0) {
    return { ...blank, error: "Usage: +extended/start <pool>=<target>[/<maxRolls>][/<interval>][/cum] <description>" };
  }
  const pool = rest.slice(0, eqIdx).trim().toLowerCase();
  if (!pool) return { ...blank, error: "Missing dice pool before '='." };

  const tail = rest.slice(eqIdx + 1).trimStart();
  // Token = up to first whitespace; rest = description.
  const wsMatch = tail.match(/^(\S+)\s*(.*)$/);
  if (!wsMatch) {
    return { ...blank, error: "Missing target and description." };
  }
  const token = wsMatch[1];
  const description = wsMatch[2].trim();
  if (!description) {
    return { ...blank, error: "Missing description." };
  }

  const parts = token.split("/");
  const targetRaw = parseInt(parts[0], 10);
  if (!Number.isFinite(targetRaw) || targetRaw < 1 || targetRaw > 50) {
    return { ...blank, error: "Target must be an integer 1..50." };
  }

  let maxRolls: number | null = null;
  let interval: ExtendedInterval = "scene";
  let cumulative = false;

  for (let i = 1; i < parts.length; i++) {
    const p = parts[i].toLowerCase();
    if (!p) continue;
    if (p === "cum" || p === "cumulative") {
      cumulative = true;
    } else if (VALID_INTERVALS.has(p)) {
      interval = p as ExtendedInterval;
    } else if (/^\d+$/.test(p)) {
      const n = parseInt(p, 10);
      if (n < 1 || n > 50) {
        return { ...blank, error: "Max rolls must be 1..50." };
      }
      maxRolls = n;
    } else {
      return { ...blank, error: `Unknown option '${p}'. Use <maxRolls>, turn/hour/day/scene, or cum.` };
    }
  }

  return { pool, target: targetRaw, maxRolls, interval, cumulative, description };
}

async function extStart(u: IUrsamuSDK, rest: string): Promise<void> {
  const parsed = parseStartArgs(rest);
  if (parsed.error) {
    u.send(parsed.error);
    return;
  }

  // One active action per owner.
  const existing = await getActiveForOwner(u.me.id);
  if (existing) {
    u.send(`You already have an active Extended Action [${existing.id}]. Use +extended/abandon ${existing.id} or +extended/status first.`);
    return;
  }

  const sheet = (u.me.state?.cofd as CofdSheet) || defaultSheet();
  const resolve = sheet.attributes?.resolve ?? 1;
  const composure = sheet.attributes?.composure ?? 1;
  const defaultMax = Math.max(1, resolve + composure);
  const maxRolls = parsed.maxRolls ?? defaultMax;

  // Validate pool by parsing it (does not consume Willpower etc).
  const validate = parseRollExpression(parsed.pool, sheet);
  if (validate.error) {
    u.send(`Pool error: ${validate.error}`);
    return;
  }

  const action = await createExtendedAction({
    ownerId: u.me.id,
    ownerName: u.util.displayName(u.me, u.me),
    roomId: u.here?.id ?? "",
    description: parsed.description,
    pool: parsed.pool,
    target: parsed.target,
    maxRolls,
    interval: parsed.interval,
    cumulativePenalty: parsed.cumulative,
    tag: "",
  });

  await panel(u, [
    `  Opened [${action.id}].`,
    `  Pool ${action.pool} -> target ${action.target}, max ${action.maxRolls} rolls, ${action.interval}${action.cumulativePenalty ? ", cumulative" : ""}.`,
    `  ${action.description}`,
  ]);
}

// ---------------------------------------------------------------------------
// /roll
// ---------------------------------------------------------------------------

async function extRoll(u: IUrsamuSDK, swList: string[], rest: string): Promise<void> {
  // Parse extra mod and stacked switches (after the primary "roll").
  let wantWp = false;
  let rote = false;
  let again: AgainThreshold = 10;
  for (const sw of swList) {
    if (sw === "wp" || sw === "willpower") wantWp = true;
    else if (sw === "rote") rote = true;
    else if (sw === "9again" || sw === "9-again") again = 9;
    else if (sw === "8again" || sw === "8-again") again = 8;
    else if (sw === "roll") { /* primary */ }
    else {
      u.send(`Unknown switch '/${sw}'. Use /wp, /rote, /9again, /8again.`);
      return;
    }
  }

  const action = await getActiveForOwner(u.me.id);
  if (!action) {
    u.send("You have no active Extended Action. Use +extended/start first.");
    return;
  }
  if (action.status !== "active") {
    u.send(`Action [${action.id}] is ${action.status}. Cannot roll.`);
    return;
  }

  // Extra modifier from rest (integer like "+1" or "-2" or "1").
  let extraMod = 0;
  if (rest) {
    const m = rest.match(/^([+-]?\d+)$/);
    if (!m) {
      u.send("Extra modifier must be an integer (e.g. -2, +1, 3).");
      return;
    }
    extraMod = parseInt(m[1], 10);
    if (extraMod < -20 || extraMod > 20) {
      u.send("Modifier out of range (-20..+20).");
      return;
    }
  }

  const sheet = (u.me.state?.cofd as CofdSheet) || defaultSheet();

  // Willpower spend mirrors +roll: deduct first, persist, apply +3 dice.
  let wpBonus = 0;
  let spentWp = false;
  if (wantWp) {
    if ((sheet.advantages?.willpowerCurrent ?? 0) < 1) {
      u.send("You have no Willpower left to spend.");
      return;
    }
    sheet.advantages.willpowerCurrent -= 1;
    wpBonus = 3;
    spentWp = true;
    await u.db.modify(u.me.id, "$set", { "data.cofd": sheet });
  }

  const parsed = parseRollExpression(action.pool, sheet);
  if (parsed.error) {
    u.send(`Pool error: ${parsed.error}`);
    return;
  }

  const penalty = nextAttemptPenalty(action);
  const finalPool = parsed.pool + wpBonus + extraMod + penalty;
  const result = executeRoll(finalPool, { again, rote });

  const outcome = await recordAttempt(action, {
    successes: result.successes,
    exceptional: result.exceptional,
    dramatic: result.dramaticFailure,
    roll: result.rolls,
    note: "",
  });

  const lines: string[] = [];
  const tag = result.exceptional
    ? "%ch%cgexceptional%cn"
    : result.dramaticFailure
      ? "%ch%crdramatic failure%cn"
      : result.successes > 0
        ? "%ch%cchit%cn"
        : "%ch%cxmiss%cn";

  const modStr = [
    spentWp ? "+WP" : "",
    extraMod ? (extraMod >= 0 ? `+${extraMod}` : `${extraMod}`) : "",
    penalty ? `pen ${penalty}` : "",
  ].filter(Boolean).join(" ");

  lines.push(
    `  [${outcome.action.id}] Attempt #${outcome.action.attempts}: ` +
    `${finalPool}d (${result.rolls.join(" ")}) -> ${result.successes} succ ${tag}${modStr ? " " + modStr : ""}`,
  );
  lines.push(`  Accumulated ${outcome.action.accumulated}/${outcome.action.target}  Attempts ${outcome.action.attempts}/${outcome.action.maxRolls}`);

  if (outcome.resolved) {
    if (outcome.reason === "success") {
      lines.push(`  %ch%cgRESOLVED: Success%cn -- accumulated total met the target.`);
    } else {
      lines.push(`  %ch%crRESOLVED: Failed%cn -- max attempts exhausted.`);
    }
  } else if (result.dramaticFailure) {
    lines.push(`  Next attempt will take a -2 penalty (dramatic failure).`);
  }

  await panel(u, lines);
}

// ---------------------------------------------------------------------------
// /status
// ---------------------------------------------------------------------------

async function extStatus(u: IUrsamuSDK, rest: string): Promise<void> {
  let action: ExtendedAction | null;
  if (rest) {
    action = await getExtendedAction(rest);
    if (!action) {
      u.send(`Extended action '${rest}' not found.`);
      return;
    }
  } else {
    action = await getActiveForOwner(u.me.id);
    if (!action) {
      u.send("You have no active Extended Action. Use +extended/start first.");
      return;
    }
  }
  await panel(u, detail(action));
}

// ---------------------------------------------------------------------------
// /list
// ---------------------------------------------------------------------------

async function extList(u: IUrsamuSDK, scope: string): Promise<void> {
  const s = scope.toLowerCase().trim() || "mine";
  let actions: ExtendedAction[] = [];
  if (s === "mine") {
    actions = await listForOwner(u.me.id);
  } else if (s === "here") {
    const roomId = u.here?.id ?? "";
    actions = await listForRoom(roomId);
  } else if (s === "all") {
    if (!isStaff(u.me)) {
      u.send("Permission denied. /list all requires staff.");
      return;
    }
    actions = await listAll();
  } else {
    u.send("Usage: +extended/list [mine|here|all]");
    return;
  }

  const lines: string[] = [];
  lines.push(`  Scope: ${s}  (${actions.length} action${actions.length === 1 ? "" : "s"})`);
  if (actions.length === 0) {
    lines.push("  No Extended Actions found.");
  } else {
    for (const a of actions) lines.push(summarize(a));
  }
  await panel(u, lines);
}

// ---------------------------------------------------------------------------
// /abandon
// ---------------------------------------------------------------------------

async function extAbandon(u: IUrsamuSDK, rest: string): Promise<void> {
  if (!rest) {
    u.send("Usage: +extended/abandon <id>");
    return;
  }
  const action = await getExtendedAction(rest);
  if (!action) {
    u.send(`Extended action '${rest}' not found.`);
    return;
  }
  if (action.status !== "active") {
    u.send(`Action [${action.id}] is ${action.status}. Nothing to abandon.`);
    return;
  }

  // Owner or staff.
  let allowed = action.ownerId === u.me.id;
  if (!allowed) {
    // Cross-owner: locate the owner object and check canEdit.
    const owners = await u.db.search({ id: action.ownerId });
    const owner = owners[0];
    if (owner) {
      try { allowed = await u.canEdit(u.me, owner); } catch { allowed = false; }
    } else {
      allowed = isStaff(u.me);
    }
  }
  if (!allowed) {
    u.send("Permission denied. You cannot abandon that Extended Action.");
    return;
  }

  const next = await abandonExtendedAction(action.id);
  if (!next) {
    u.send("Failed to abandon.");
    return;
  }
  await panel(u, [`  Abandoned [${next.id}].`]);
}

// ---------------------------------------------------------------------------
// /finish (admin)
// ---------------------------------------------------------------------------

async function extFinish(u: IUrsamuSDK, rest: string): Promise<void> {
  if (!isStaff(u.me)) {
    u.send("Permission denied. /finish requires staff.");
    return;
  }
  if (!rest) {
    u.send("Usage: +extended/finish <id>");
    return;
  }
  const next = await finishExtendedAction(rest);
  if (!next) {
    u.send(`Extended action '${rest}' not found.`);
    return;
  }
  await panel(u, [`  Forced [${next.id}] to ${statusGlyph(next.status)} (accumulated ${next.accumulated}/${next.target}).`]);
}

// ---------------------------------------------------------------------------
// /contest (admin)
// ---------------------------------------------------------------------------

async function extContest(u: IUrsamuSDK, rest: string): Promise<void> {
  if (!isStaff(u.me)) {
    u.send("Permission denied. /contest requires staff.");
    return;
  }
  const m = rest.match(/^(\S+)\s*\+\s*(\S+)$/);
  if (!m) {
    u.send("Usage: +extended/contest <idA>+<idB>");
    return;
  }
  const ok = await linkContest(m[1], m[2]);
  if (!ok) {
    u.send("Could not link those actions (unknown id, same id, or not both active).");
    return;
  }
  await panel(u, [`  Linked [${m[1]}] and [${m[2]}] as a contested pair.`]);
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export async function extendedExec(u: IUrsamuSDK): Promise<void> {
  const swRaw = (u.cmd.args[0] ?? "").toLowerCase().trim();
  const rest = u.util.stripSubs(u.cmd.args[1] ?? "").trim();
  const switches = swRaw ? swRaw.split(/[\/,]/).map((s) => s.trim()).filter(Boolean) : [];
  const primary = switches[0] ?? "";

  if (!primary) {
    // Default: status of active.
    await extStatus(u, "");
    return;
  }

  switch (primary) {
    case "start":     return await extStart(u, rest);
    case "roll":      return await extRoll(u, switches, rest);
    case "status":    return await extStatus(u, rest);
    case "list":      return await extList(u, rest);
    case "abandon":   return await extAbandon(u, rest);
    case "finish":    return await extFinish(u, rest);
    case "contest":   return await extContest(u, rest);
    default:
      u.send(`Unknown +extended switch '/${primary}'. Use /start, /roll, /status, /list, /abandon, /finish, /contest.`);
  }
}
