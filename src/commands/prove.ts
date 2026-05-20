// +prove command -- show trait values to another player (or to the room).
// Players cannot see each others' sheets, so +prove is the tamper-evident
// way to surface specific traits. Output uses the PROVE>> system prefix
// drawn from live sheet data; players cannot fake it via @emit/pose.

import type { IUrsamuSDK } from "@ursamu/ursamu";
import { resolveTrait } from "../roller/index.ts";
import { type CofdSheet } from "../stats/index.ts";

const MAX_TRAITS = 8;

interface ParseResult {
  traits: string[];
  recipient: string;
  error?: string;
}

/** "strength, athletics = Marcus" -> { traits, recipient: "Marcus" } */
function parseProveBody(rest: string): ParseResult {
  const eq = rest.indexOf("=");
  const traitPart = eq >= 0 ? rest.slice(0, eq) : rest;
  const recipient = eq >= 0 ? rest.slice(eq + 1).trim() : "";

  const traits = traitPart
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (traits.length === 0) {
    return { traits: [], recipient, error: "Usage: +prove <traits>[=<player>]" };
  }
  if (traits.length > MAX_TRAITS) {
    return {
      traits: [],
      recipient,
      error: `Too many traits (max ${MAX_TRAITS}).`,
    };
  }
  return { traits, recipient };
}

function renderTrait(token: string, sheet: CofdSheet): string | null {
  const resolved = resolveTrait(token, sheet);
  if (!resolved) return null;
  if (resolved.specialty) {
    return `%ch${resolved.label}%cn(${resolved.base}+1)`;
  }
  return `%ch${resolved.label}%cn(${resolved.value})`;
}

export async function proveExec(u: IUrsamuSDK) {
  const sw = (u.cmd.args[0] ?? "").toLowerCase().trim();
  const rest = u.util.stripSubs(u.cmd.args[1] ?? "").trim();

  if (sw && sw !== "here") {
    u.send(`Unknown +prove switch '/${sw}'. Use /here or omit for default behavior.`);
    return;
  }

  if (!rest) {
    u.send("Usage: +prove <traits>[=<player>] or +prove/here <traits>");
    return;
  }

  const sheet = u.me.state?.cofd as CofdSheet | undefined;
  if (!sheet) {
    u.send("You do not have an approved character sheet yet.");
    return;
  }

  const { traits, recipient, error } = parseProveBody(rest);
  if (error) {
    u.send(error);
    return;
  }

  const rendered: string[] = [];
  const skipped: string[] = [];
  for (const token of traits) {
    const out = renderTrait(token, sheet);
    if (out) rendered.push(out);
    else skipped.push(token);
  }

  if (rendered.length === 0) {
    u.send(`No valid traits to prove. Unknown: ${skipped.join(", ")}.`);
    return;
  }

  const name = u.util.displayName(u.me, u.me);
  const line = `%ch%cmPROVE>>%cn ${name} shows: ${rendered.join("  ")}`;
  const skipNote = skipped.length > 0
    ? ` %cx(skipped: ${skipped.join(", ")})%cn`
    : "";

  // /here or no recipient: broadcast to the room (and self).
  if (sw === "here" || !recipient) {
    u.send(line + skipNote);
    const meId = u.me.id;
    const occupants = (u.here?.contents ?? []).filter((o) =>
      o &&
      o !== u.me &&
      o.id !== meId &&
      typeof o.flags?.has === "function" &&
      o.flags.has("player")
    );
    for (const observer of occupants) {
      u.send(line, observer.id);
    }
    return;
  }

  // Targeted whisper.
  const target = await u.util.target(u.me, recipient, true);
  if (!target) {
    u.send(`Player '${recipient}' not found.`);
    return;
  }
  if (target.id === u.me.id) {
    u.send(line + skipNote);
    return;
  }
  u.send(`%ch%cmPROVE>>%cn You show ${u.util.displayName(target, u.me)}: ${rendered.join("  ")}${skipNote}`);
  u.send(line, target.id);
}
