// +roll command implementation. Output is a single compact line:
//
//   ROLL>> Marcus rolls strength+brawl  5d (3 7 8 9 10) -> 2 successes (Success)
//
// Variants:
//   /wp /rote /9again /8again — appear in the "rolls" verb prefix
//   chance die                 — shows "chance" instead of "Nd"
//   rote rerolls               — appended as "rote(...)" after the main dice
//   willpower spend            — "rolls/wp" prefix

import type { IUrsamuSDK } from "@ursamu/ursamu";
import { defaultSheet, type CofdSheet } from "../stats/index.ts";
import { parseRollExpression, executeRoll, type AgainThreshold } from "../roller/index.ts";

export async function rollExec(u: IUrsamuSDK) {
  const swRaw = (u.cmd.args[0] ?? "").toLowerCase().trim();
  const expr = u.util.stripSubs(u.cmd.args[1] ?? "").trim();

  if (!expr) {
    u.send("Usage: +roll[/wp][/rote][/9again|/8again] <expression> (e.g. Strength+Brawl+2)");
    return;
  }

  // Multi-switch: split on / or , so users can stack /wp/rote/9again, etc.
  const switches = swRaw
    ? swRaw.split(/[\/,]/).map((s) => s.trim()).filter(Boolean)
    : [];

  let wantWp = false;
  let rote = false;
  let again: AgainThreshold = 10;

  for (const sw of switches) {
    if (sw === "wp" || sw === "willpower") {
      wantWp = true;
    } else if (sw === "rote") {
      rote = true;
    } else if (sw === "9again" || sw === "9-again") {
      again = 9;
    } else if (sw === "8again" || sw === "8-again") {
      again = 8;
    } else {
      u.send(`Error: Unknown switch '/${sw}'. Valid: /wp, /rote, /9again, /8again.`);
      return;
    }
  }

  const sheet = (u.me.state?.cofd as CofdSheet) || defaultSheet();
  let wpBonus = 0;
  let spentWp = false;

  if (wantWp) {
    if (sheet.advantages.willpowerCurrent < 1) {
      u.send("Error: You do not have any Willpower left to spend.");
      return;
    }
    sheet.advantages.willpowerCurrent -= 1;
    wpBonus = 3;
    spentWp = true;
    await u.db.modify(u.me.id, "$set", { "data.cofd": sheet });
  }

  const parsed = parseRollExpression(expr, sheet);
  if (parsed.error) {
    u.send(`Error: ${parsed.error}`);
    return;
  }

  const finalPool = parsed.pool + wpBonus;
  const result = executeRoll(finalPool, { again, rote });

  // Build the switch-suffix on "rolls" — e.g. "rolls/wp/rote".
  const verbSwitches: string[] = [];
  if (spentWp) verbSwitches.push("wp");
  if (result.rote && !result.isChanceDie) verbSwitches.push("rote");
  if (!result.isChanceDie && result.again !== 10) verbSwitches.push(`${result.again}again`);
  const verb = verbSwitches.length ? `rolls/${verbSwitches.join("/")}` : "rolls";

  // Dice display: "5d (3 7 8 9 10)" or "chance (1)".
  const diceList = result.rolls.join(" ");
  const diceBlock = result.isChanceDie
    ? `chance (${diceList})`
    : `${finalPool}d (${diceList})`;

  // Optional rote rerolls trailing the dice block.
  const roteBlock = (result.roteRerolls && result.roteRerolls.length > 0)
    ? ` rote(${result.roteRerolls.join(" ")})`
    : "";

  // Outcome label + color.
  let outcomeLabel = "Failure";
  let outcomeColor = "%ch%cx";
  if (result.exceptional) {
    outcomeLabel = "Exceptional";
    outcomeColor = "%ch%cg";
  } else if (result.successes > 0) {
    outcomeLabel = "Success";
    outcomeColor = "%ch%cc";
  } else if (result.dramaticFailure) {
    outcomeLabel = "Dramatic Failure";
    outcomeColor = "%ch%cr";
  }

  const name = u.util.displayName(u.me, u.me);
  const line =
    `%ch%ccROLL>>%cn ${name} ${verb} %ch${expr}%cn  ` +
    `${diceBlock}${roteBlock} -> %ch%cy${result.successes}%cn successes ` +
    `(${outcomeColor}${outcomeLabel}%cn)`;

  u.send(line);
}
