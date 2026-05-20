// +roll command implementation.

import { header, footer, divider, type IUrsamuSDK } from "@ursamu/ursamu";
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
    ? swRaw.split(/[\/,]/).map(s => s.trim()).filter(Boolean)
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
      u.send("Error: You do not have any Willpower left to spend!");
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

  // Formatting output beautifully
  const lines: string[] = [];
  lines.push(await header("C O F D   R O L L"));

  lines.push(`  %chPlayer:%cn      ${u.util.displayName(u.me, u.me)}`);

  const displayTerms = [...parsed.terms];
  if (spentWp) {
    displayTerms.push("Willpower(+3)");
  }
  lines.push(`  %chRoll:%cn        ${displayTerms.join(" + ")}`);
  lines.push(`  %chDice Pool:%cn   ${result.isChanceDie ? "Chance Die" : `${finalPool} dice`}`);

  // Show non-default threshold and rote flag for transparency.
  if (!result.isChanceDie && result.again !== 10) {
    lines.push(`  %chThreshold:%cn   ${result.again}-again`);
  }
  if (!result.isChanceDie && result.rote) {
    lines.push(`  %chRote:%cn         Yes`);
  }

  // If chance die was rolled but the user requested options that don't apply,
  // include a note so they know the options were ignored.
  if (result.isChanceDie && (rote || again !== 10)) {
    lines.push(`  %chNote:%cn         Chance die ignores rote/9-again/8-again.`);
  }

  lines.push(await divider(""));

  lines.push(`  %chDice Rolls:%cn  [${result.rolls.join(", ")}]`);
  if (result.roteRerolls && result.roteRerolls.length > 0) {
    lines.push(`  %chRerolls:%cn     [${result.roteRerolls.join(", ")}]`);
  }
  lines.push(`  %chSuccesses:%cn   %ch%cy${result.successes}%cn`);

  let outcome = "%ch%cyFAILURE%cn";
  if (result.exceptional) {
    outcome = "%ch%cgEXCEPTIONAL SUCCESS%cn (Gain Inspired condition)";
  } else if (result.successes > 0) {
    outcome = "%ch%ccSUCCESS%cn";
  } else if (result.dramaticFailure) {
    outcome = "%ch%crDRAMATIC FAILURE!%cn (Things get worse)";
  }

  lines.push(`  %chOutcome:%cn     ${outcome}`);
  lines.push(await footer());

  u.send(lines.join("\n"));
}
