import { addCmd, header, footer, divider } from "jsr:@ursamu/ursamu";
import {
  defaultSheet,
  setTrait,
  validateTraitValue,
  parseRollExpression,
  executeRoll,
  formatSheet,
  COFD_SKILLS,
  type CofdSheet
} from "./cofd.ts";
import {
  initCgState,
  getStageInstructions,
  validateCurrentStage,
  updateCgState,
  type CofdCgState
} from "./cg.ts";

export async function sheetExec(u: IUrsamuSDK) {
  const targetName = (u.cmd.args[0] ?? "").trim();
  const target = targetName ? await u.util.target(u.me, targetName) : u.me;

  if (!target) {
    u.send(`Player '${targetName}' not found.`);
    return;
  }

  const sheet = target.state?.cofd as CofdSheet | undefined;
  if (!sheet) {
    u.send("That player does not have an approved character sheet yet.");
    return;
  }

  const formatted = await formatSheet(u.util.displayName(target, u.me), sheet);
  u.send(formatted);
}

export async function sheetSetExec(u: IUrsamuSDK) {
  const lhs = (u.cmd.args[0] ?? "").trim();
  const rhs = (u.cmd.args[1] ?? "").trim();

  if (!lhs || !rhs) {
    u.send("Usage: +sheet/set [<player>/]<trait>=<value> (or specialty/<skill>=<name>)");
    return;
  }

  let targetName = "";
  let trait = lhs;

  if (lhs.includes("/")) {
    const parts = lhs.split("/");
    // Check if it's "specialty/skill"
    if (parts[0].toLowerCase() === "specialty" || parts[0].toLowerCase() === "specialties") {
      trait = lhs;
    } else {
      targetName = parts[0].trim();
      trait = parts.slice(1).join("/").trim();
    }
  }

  const target = targetName ? await u.util.target(u.me, targetName) : u.me;
  if (!target) {
    u.send(`Player '${targetName}' not found.`);
    return;
  }

  // Authorization check
  if (!(await u.canEdit(u.me, target))) {
    u.send("Permission denied. You cannot modify that player's character sheet.");
    return;
  }

  // Check if target has a live sheet
  const hasLiveSheet = !!target.state?.cofd;
  if (!hasLiveSheet) {
    u.send("That player does not have an approved character sheet yet. Sheet modifications are blocked until character generation is completed via '+cg'.");
    return;
  }

  // Specialty handler
  if (trait.toLowerCase().startsWith("specialty/")) {
    const skillName = trait.slice("specialty/".length).trim().toLowerCase();
    if (!(COFD_SKILLS as readonly string[]).includes(skillName)) {
      u.send(`Invalid skill name for specialty: '${skillName}'.`);
      return;
    }

    const specValue = rhs.trim();
    if (!specValue) {
      u.send("Specialty name cannot be empty.");
      return;
    }

    const sheet = (target.state?.cofd as CofdSheet) || defaultSheet();
    if (!sheet.specialties) {
      sheet.specialties = {};
    }
    if (!sheet.specialties[skillName]) {
      sheet.specialties[skillName] = [];
    }

    if (specValue.toLowerCase() === "clear" || specValue.toLowerCase() === "none") {
      sheet.specialties[skillName] = [];
      u.send(`Cleared all specialties for skill '${skillName}' on ${target.name}'s sheet.`);
    } else {
      if (!sheet.specialties[skillName].includes(specValue)) {
        sheet.specialties[skillName].push(specValue);
      }
      u.send(`Added specialty '${specValue}' to skill '${skillName}' on ${target.name}'s sheet.`);
    }

    await u.db.modify(target.id, "$set", { "data.cofd": sheet });
    return;
  }

  // Standard trait handler
  try {
    const sheet = (target.state?.cofd as CofdSheet) || defaultSheet();
    const validatedValue = validateTraitValue(trait, rhs, sheet);
    const updatedSheet = setTrait(sheet, trait, validatedValue);

    await u.db.modify(target.id, "$set", { "data.cofd": updatedSheet });
    u.send(`Set trait '${trait}' to '${validatedValue}' on ${target.name}'s sheet.`);
  } catch (err: any) {
    u.send(`Error: ${err.message}`);
  }
}

export async function rollExec(u: IUrsamuSDK) {
  const sw = (u.cmd.args[0] ?? "").toLowerCase().trim();
  const expr = u.util.stripSubs(u.cmd.args[1] ?? "").trim();

  if (!expr) {
    u.send("Usage: +roll[/wp] <expression> (e.g. Strength+Brawl+2)");
    return;
  }

  const sheet = (u.me.state?.cofd as CofdSheet) || defaultSheet();
  let wpBonus = 0;
  let spentWp = false;

  if (sw === "wp" || sw === "willpower") {
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
  const result = executeRoll(finalPool);

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
  lines.push(await divider(null));

  lines.push(`  %chDice Rolls:%cn  [${result.rolls.join(", ")}]`);
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

export async function cgExec(u: IUrsamuSDK) {
  const sw = (u.cmd.args[0] ?? "").toLowerCase().trim();
  const rawArg = (u.cmd.args[1] ?? "").trim();

  // Find target - self only for character generation
  const target = u.me;

  // Load existing character generation state
  let cgState = target.state?.cofd_cg as CofdCgState | undefined;

  // Reset switch
  if (sw === "reset") {
    cgState = initCgState();
    await u.db.modify(target.id, "$set", { "data.cofd_cg": cgState });
    u.send(await header("Character Generation: Reset"));
    u.send("Your character generation state has been reset to a fresh Mortal sheet.");
    u.send(await getStageInstructions(u.util.displayName(target, u.me), cgState));
    u.send(await footer());
    return;
  }

  // If no active cg session exists
  if (!cgState) {
    // If they already have an approved sheet, confirm if they want to reset
    if (target.state?.cofd) {
      u.send("You already have an approved character sheet. If you want to start over, run '%ch+cg/reset%cn'. WARNING: This will NOT delete your approved sheet unless you submit and complete the new one.");
      return;
    }
    // Start fresh cg session
    cgState = initCgState();
    await u.db.modify(target.id, "$set", { "data.cofd_cg": cgState });
    u.send(await header("Character Generation: Started"));
    u.send("Welcome to Chronicles of Darkness Character Generation!");
    u.send(await getStageInstructions(u.util.displayName(target, u.me), cgState));
    u.send(await footer());
    return;
  }

  // Handle +cg/set
  if (sw === "set") {
    if (!rawArg.includes("=")) {
      u.send("Usage: +cg/set <trait>=<value> (e.g., +cg/set Concept=Street Detective, +cg/set Strength=3)");
      return;
    }

    const eqIndex = rawArg.indexOf("=");
    const key = rawArg.slice(0, eqIndex).trim();
    const value = rawArg.slice(eqIndex + 1).trim();

    try {
      cgState = updateCgState(cgState, key, value);
      await u.db.modify(target.id, "$set", { "data.cofd_cg": cgState });
      u.send(`Successfully set cg trait '${key}' to '${value}'.`);
      // Re-send status and instructions for the stage
      u.send(await getStageInstructions(u.util.displayName(target, u.me), cgState));
    } catch (err: any) {
      u.send(`%crError:%cn ${err.message}`);
    }
    return;
  }

  // Handle +cg/back
  if (sw === "back") {
    if (cgState.stage > 1) {
      cgState.stage -= 1;
      await u.db.modify(target.id, "$set", { "data.cofd_cg": cgState });
      u.send(await getStageInstructions(u.util.displayName(target, u.me), cgState));
    } else {
      u.send("You are already at the first stage.");
    }
    return;
  }

  // Handle +cg/next or +cg/submit (advance stage or complete)
  if (sw === "submit" || sw === "next") {
    // Validate stage
    const valResult = validateCurrentStage(cgState);
    if (!valResult.valid) {
      u.send(`%crValidation Error:%cn ${valResult.error}`);
      return;
    }

    if (cgState.stage === 6) {
      // Complete! Copy to active cofd sheet, clear cg state
      const sheet = cgState.sheet;
      if (!sheet.specialties) sheet.specialties = {};

      // Save sheet and clear cg state
      await u.db.modify(target.id, "$set", { "data.cofd": sheet });
      await u.db.modify(target.id, "$unset", { "data.cofd_cg": "" });

      const lines: string[] = [];
      lines.push(await header("Character Generation: Complete!"));
      lines.push(`Congratulations! Character generation for %ch${u.util.displayName(target, u.me)}%cn is complete.`);
      lines.push("Your approved sheet is now active! You can view it using '%ch+sheet%cn'.");
      lines.push("You can now roll traits using '%ch+roll <expression>%cn'.");
      lines.push(await footer());
      u.send(lines.join("\n"));
    } else {
      // Advance stage
      cgState.stage += 1;
      await u.db.modify(target.id, "$set", { "data.cofd_cg": cgState });

      u.send(await header(`Stage Advanced: Stage ${cgState.stage}`));
      u.send(`Successfully submitted and validated your choices for the previous stage.`);
      u.send(await getStageInstructions(u.util.displayName(target, u.me), cgState));
      u.send(await footer());
    }
    return;
  }

  // Default +cg command shows current instructions/status
  u.send(await getStageInstructions(u.util.displayName(target, u.me), cgState));
}

// Register commands in UrsaMU
addCmd({
  name: "+sheet",
  pattern: /^\+sheet(?:\/(\S+))?\s*(.*)/i,
  lock: "connected",
  category: "Cofd",
  help: `+sheet [<player>]  — View a character's Chronicles of Darkness sheet.`,
  exec: async (u: IUrsamuSDK) => {
    const sw = (u.cmd.args[0] ?? "").toLowerCase().trim();
    if (sw === "set") {
      await sheetSetExec(u);
    } else {
      await sheetExec(u);
    }
  }
});

addCmd({
  name: "+roll",
  pattern: /^\+roll(?:\/(\S+))?\s*(.*)/i,
  lock: "connected",
  category: "Cofd",
  help: `+roll[/wp] <expression>  — Perform a Chronicles of Darkness D10 10-again roll.
  
Switches:
  /wp   Spends 1 current Willpower to add +3 dice to the pool.

Examples:
  +roll Strength+Brawl
  +roll Dexterity+Crafts/Automotive+2
  +roll 8
  +roll/wp Resolve+Composure`,
  exec: rollExec
});

addCmd({
  name: "+cg",
  pattern: /^\+cg(?:\/(\S+))?\s*(.*)/i,
  lock: "connected",
  category: "Cofd",
  help: `+cg [<switch>] [<args>]  — Guided character generation experience.

Switches:
  /reset       — Start over with a clean character sheet.
  /set <k>=<v> — Set character generation fields/traits.
  /submit      — Validate current stage and advance (or finalize sheet).

Example usage:
  +cg
  +cg/set name=John Doe
  +cg/set concept=Hacker
  +cg/set template=mortal
  +cg/submit
  +cg/set Strength=3
  +cg/submit`,
  exec: cgExec
});
