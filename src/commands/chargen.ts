// +cg command implementation: guided 6-stage character creation.

import { header, footer, type IUrsamuSDK } from "@ursamu/ursamu";
import {
  initCgState,
  getStageInstructions,
  validateCurrentStage,
  updateCgState,
  type CofdCgState,
} from "../chargen/index.ts";

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
