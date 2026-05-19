// Registers CoFD commands with UrsaMU via addCmd().
// Imported for side effects from the top-level commands.ts shim.

import { addCmd, type IUrsamuSDK } from "jsr:@ursamu/ursamu";
import { sheetExec, sheetSetExec } from "./sheet.ts";
import { rollExec } from "./roll.ts";
import { cgExec } from "./chargen.ts";
import { healthExec } from "./health.ts";
import { beatExec } from "./beat.ts";
import { xpExec } from "./xp.ts";
import { conditionExec } from "./condition.ts";
import { aspirationExec } from "./aspiration.ts";

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
  help: `+roll[/wp][/rote][/9again|/8again] <expression>  — Perform a Chronicles of Darkness D10 roll.

Switches:
  /wp        Spends 1 current Willpower to add +3 dice to the pool.
  /rote      Rote action: reroll every failure (1-7) in the initial pool once.
  /9again    Reroll on 9 or 10 instead of just 10.
  /8again    Reroll on 8, 9, or 10 instead of just 10.

Switches stack via / or , (e.g. +roll/wp/rote/9again ...).

Examples:
  +roll Strength+Brawl
  +roll Dexterity+Crafts/Automotive+2
  +roll 8
  +roll/wp Resolve+Composure
  +roll/rote Wits+Investigation
  +roll/9again Resolve+Composure
  +roll/8again Wits+Composure
  +roll/wp/rote/9again Stamina+Athletics`,
  exec: rollExec
});

addCmd({
  name: "+health",
  pattern: /^\+health(?:\/([a-z\-]+\d*))?\s*(.*)/i,
  lock: "connected",
  category: "Cofd",
  help: `+health [<player>]  — View or modify a character's Health track.

Switches:
  /bash[<n>]       Apply N bashing damage (default 1).
  /lethal[<n>]     Apply N lethal damage.
  /agg[<n>]        Apply N aggravated damage.
  /heal[<n>]       Heal N damage, heaviest first.
  /heal-bash[<n>]  Heal N bashing damage only.
  /heal-lethal[<n>] Heal N lethal damage only.
  /heal-agg[<n>]   Heal N aggravated damage only.

Cross-player apply/heal requires canEdit (builder+).

Examples:
  +health                       View your Health track.
  +health Marcus                View Marcus's Health track.
  +health/bash                  Apply 1 bashing to yourself.
  +health/lethal3 Marcus        Apply 3 lethal to Marcus (builder+).
  +health/heal2 Marcus          Heal 2 (heaviest first) on Marcus.
  +health/heal-bash5            Heal 5 bashing on yourself.`,
  exec: healthExec,
});

addCmd({
  name: "+beat",
  pattern: /^\+beat(?:\/(\S+))?\s*(.*)/i,
  lock: "connected",
  category: "Cofd",
  help: `+beat [/add|/sub][/arcane] [<player>] [= <reason>]  — Award or subtract a Beat.

Switches:
  /add         Award 1 Beat (default self).
  /sub         Subtract 1 Beat (correction).
  /arcane      Operate on the Arcane Beat track (supernaturals only).

Cross-player edits require canEdit (builder+). Beats convert to Experience
automatically at 5:1 (standard and Arcane tracks separate).

Examples:
  +beat                          View your own Beat/XP pools.
  +beat add                      Award yourself 1 Beat.
  +beat add Marcus = Took a risk Award Marcus a Beat with a reason (builder+).
  +beat add/arcane = Frenzy      Award yourself 1 Arcane Beat.
  +beat sub Marcus               Correct: remove 1 Beat from Marcus.`,
  exec: beatExec,
});

addCmd({
  name: "+xp",
  pattern: /^\+xp(?:\/(\S+))?\s*(.*)/i,
  lock: "connected",
  category: "Cofd",
  help: `+xp [<player>]  — View XP pools, spend XP to raise traits, or list costs.

Switches:
  /spend <trait>=<dots> [for <player>]   Spend XP to raise a trait.
  /list                                  Show the XP cost table.

Cross-player spends require canEdit (builder+).

Examples:
  +xp                            View your own XP pools.
  +xp Marcus                     View Marcus's pools.
  +xp/spend strength=3           Raise your Strength to 3.
  +xp/spend vigor=2 for Marcus   Raise Marcus's Vigor (Arcane XP, builder+).
  +xp/list                       Show the cost table.`,
  exec: xpExec,
});

addCmd({
  name: "+condition",
  pattern: /^\+condition(?:\/(\S+))?\s*(.*)/i,
  lock: "connected",
  category: "Cofd",
  help: `+condition [<player>]  -- View or modify active Conditions and Tilts.

Switches:
  /add <key>[/<note>] [for <player>]   Apply a Condition or Tilt.
  /remove <key> [for <player>]         Remove without awarding Beats.
  /resolve <key> [for <player>]        Resolve and award the catalog Beats.
  /list                                Show the catalog.

Cross-player edits require canEdit (builder+).

Examples:
  +condition                         View your own Conditions.
  +condition Marcus                  View Marcus's Conditions.
  +condition/add shaken              Apply Shaken to yourself.
  +condition/add shaken/Spilled mead Apply Shaken with a note.
  +condition/resolve shaken          Resolve Shaken and gain 1 Beat.
  +condition/remove shaken Marcus    Correction: remove without Beats.
  +condition/list                    Show every catalog entry.`,
  exec: conditionExec,
});

addCmd({
  name: "+aspiration",
  pattern: /^\+aspiration(?:\/(\S+))?\s*(.*)/i,
  lock: "connected",
  category: "Cofd",
  help: `+aspiration [<player>]  -- View or modify active Aspirations (max 3).

Switches:
  /add <text> [for <player>]        Add a short-term Aspiration.
  /add/long <text> [for <player>]   Add a long-term Aspiration.
  /remove <#> [for <player>]        Remove the Aspiration at slot #.
  /fulfill <#> [for <player>]       Fulfill and gain 1 Beat.

Cross-player edits require canEdit (builder+).

Examples:
  +aspiration                          View your own Aspirations.
  +aspiration Marcus                   View Marcus's Aspirations.
  +aspiration/add Find the killer      Add a short-term Aspiration.
  +aspiration/add/long Become Prince   Add a long-term Aspiration.
  +aspiration/remove 2                 Remove slot 2 (no Beat).
  +aspiration/fulfill 1                Fulfill slot 1 and gain 1 Beat.`,
  exec: aspirationExec,
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
