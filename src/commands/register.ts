// Registers CoFD commands with UrsaMU via addCmd().
// Imported for side effects from the top-level commands.ts shim.

import { addCmd, type IUrsamuSDK } from "@ursamu/ursamu";
import { sheetExec, sheetSetExec } from "./sheet.ts";
import { rollExec } from "./roll.ts";
import { cgExec } from "./chargen.ts";
import { healthExec } from "./health.ts";
import { beatExec } from "./beat.ts";
import { xpExec } from "./xp.ts";
import { conditionExec } from "./condition.ts";
import { aspirationExec } from "./aspiration.ts";
import { vitaeExec } from "./vitae.ts";
import { touchstoneExec } from "./touchstone.ts";
import { approveExec, unapproveExec } from "./approve.ts";
import { notesExec } from "./notes.ts";
import { gearExec } from "./gear.ts";
import { tiltExec } from "./tilt.ts";
import { proveExec } from "./prove.ts";

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
  help: `+roll[/wp][/rote][/weapon][/9again|/8again] <expression>  — Perform a Chronicles of Darkness D10 roll.

Switches:
  /wp        Spends 1 current Willpower to add +3 dice to the pool.
  /rote      Rote action: reroll every failure (1-7) in the initial pool once.
  /weapon    On a hit, add equipped weapon damage as bonus successes.
  /9again    Reroll on 9 or 10 instead of just 10.
  /8again    Reroll on 8, 9, or 10 instead of just 10.

Switches stack via / or , (e.g. +roll/wp/weapon/9again ...).

Examples:
  +roll Strength+Brawl
  +roll Dexterity+Crafts/Automotive+2
  +roll 8
  +roll/wp Resolve+Composure
  +roll/rote Wits+Investigation
  +roll/weapon Strength+Weaponry
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
  name: "+vitae",
  pattern: /^\+vitae(?:\/(\S+))?\s*(.*)/i,
  lock: "connected",
  category: "Cofd",
  help: `+vitae [<player>]  -- View or modify a vampire's Vitae pool.

Switches:
  /spend [<n>] [for <player>]    Spend N Vitae (default 1).
  /gain [<n>] [for <player>]     Gain N Vitae (capped at BP max).
  /blush [for <player>]          Spend 1 Vitae for Blush of Life.
  /boost <attr> [for <player>]   Spend 1 Vitae to boost a Physical Attribute.

Cross-player edits require canEdit (builder+). Only vampires have Vitae.

Examples:
  +vitae                         View your Vitae pool.
  +vitae/spend                   Spend 1 Vitae.
  +vitae/spend 3                 Spend 3 Vitae.
  +vitae/gain 2 for Marcus       Add 2 Vitae to Marcus (builder+).
  +vitae/blush                   Blush of Life: appear human for one hour.
  +vitae/boost strength          +2 Strength for the scene.`,
  exec: vitaeExec,
});

addCmd({
  name: "+touchstone",
  pattern: /^\+touchstone(?:\/(\S+))?\s*(.*)/i,
  lock: "connected",
  category: "Cofd",
  help: `+touchstone [<player>]  -- View or set Mask and Dirge Touchstones (vampire only).

Switches:
  /mask <name> [for <player>]    Set the Mask (public-persona) Touchstone.
  /dirge <name> [for <player>]   Set the Dirge (predatory) Touchstone.
  /clear-mask [for <player>]     Clear the Mask Touchstone.
  /clear-dirge [for <player>]    Clear the Dirge Touchstone.

Cross-player edits require canEdit (builder+).

Examples:
  +touchstone                          View your Touchstones.
  +touchstone/mask Lia Martinez        Set your Mask anchor.
  +touchstone/dirge The Hunger I Hide  Set your Dirge anchor.
  +touchstone/clear-mask               Clear your Mask (Humanity risk).`,
  exec: touchstoneExec,
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

addCmd({
  name: "+approve",
  pattern: /^\+approve(?:\/(\S+))?\s*(.*)/i,
  lock: "connected admin+",
  category: "Cofd",
  help: `+approve <player>[=<notes>]  — Approve a pending Chronicles of Darkness chargen submission.

Closes the player's CGEN job, copies their submitted sheet onto the live
character record, and notifies them.

Examples:
  +approve Alice
  +approve Alice=Welcome to the chronicle. Watch your touchstones.`,
  exec: approveExec,
});

addCmd({
  name: "+unapprove",
  pattern: /^\+unapprove(?:\/(\S+))?\s*(.*)/i,
  lock: "connected admin+",
  category: "Cofd",
  help: `+unapprove <player>=<reason>  — Return a pending Chronicles of Darkness submission for revision.

Reopens the player's CGEN job with a staff comment and clears the
submitted-job marker so the player can edit and resubmit. The CG state
is preserved; the live sheet is unchanged.

Examples:
  +unapprove Alice=Concept needs more detail; please flesh out the backstory.`,
  exec: unapproveExec,
});

addCmd({
  name: "+prove",
  pattern: /^\+prove(?:\/(\S+))?\s*(.*)/i,
  lock: "connected",
  category: "Cofd",
  help: `+prove <traits>[=<player>]  -- Show your trait values to another player or the room.

Switches:
  /here    Always broadcast to the room (default when no =<player>).

Trait list is comma-separated. Accepts everything +roll accepts:
attributes, skills, skill/specialty, willpower, morality (Integrity,
Humanity, etc.), power stat (Blood Potency, Primal Urge, Wyrd...),
and any template power your sheet has (Vigor, Forces, Mind, etc.).

Equipment tokens are also accepted:
  weapon     Your equipped weapon with damage and initiative.
  armor      Your equipped armor with rating and Def/Spd penalties.
  gear       Your full inventory list.

Max 8 traits per command. Output is a PROVE>> system line read from
your live sheet -- it cannot be faked with @emit or pose.

Examples:
  +prove strength                       Broadcast your Strength.
  +prove strength,athletics,brawl       Broadcast three traits.
  +prove subterfuge/cons=Marcus         Whisper a specialty to Marcus.
  +prove/here resolve+composure         (use commas, not +) /here is explicit.
  +prove vigor,blood potency=Lyra       Whisper Vigor + Blood Potency.
  +prove weapon                         Show your equipped weapon.
  +prove armor=Marcus                   Whisper your equipped armor to Marcus.
  +prove weapon,armor,gear              Show full loadout.`,
  exec: proveExec,
});

addCmd({
  name: "+gear",
  pattern: /^\+gear(?:\/(\S+))?\s*(.*)/i,
  lock: "connected",
  category: "Cofd",
  help: `+gear [<player>]  -- Browse equipment and manage carried items.

Switches:
  /list [<cat>]                          Catalog by category (weapons|ranged|melee|armor|mental|physical|social|services).
  /show <key>                            Full catalog entry for an item.
  /add <key>[/<note>] [for <player>]     Add an item to inventory.
  /remove <#> [for <player>]             Discard inventory slot #.
  /equip <#> [for <player>]              Equip weapon or armor at slot #.
  /unequip <weapon|armor> [for <player>] Unequip a slot.
  /drop <#> [for <player>]               Drop an unequipped item here.
  /pickup <name|#>                       Pick up a dropped item from this room.
  /give <#> to <player>                  Hand an inventory item to another player.
  /reload [<#>] [for <player>]           Reload a firearm (equipped if no <#>).

Equipped armor applies Defense and Speed penalties on the sheet.
Equipped weapon damage adds to +roll/weapon successes on a hit.
Firearms track their own ammo; firing decrements, /reload refills.
Cross-player edits require canEdit (builder+).

Examples:
  +gear                          View your inventory.
  +gear/list weapons             Browse the weapon tables.
  +gear/show kevlar-vest         Show the Kevlar Vest entry.
  +gear/add pistol-light         Add a light pistol to your inventory.
  +gear/equip 1                  Equip slot 1.
  +gear/reload                   Reload your equipped firearm.
  +gear/drop 2                   Drop slot 2 in the current room.
  +gear/give 1 to Marcus         Hand slot 1 to Marcus.`,
  exec: gearExec,
});

addCmd({
  name: "+tilt",
  pattern: /^\+tilt(?:\/(\S+))?\s*(.*)/i,
  lock: "connected",
  category: "Cofd",
  help: `+tilt [<player>]  -- View or modify active Tilts (Personal + Environmental).

Switches:
  /list [<scope>]                        Catalog (filter: personal|environmental).
  /show <key>                            Full Tilt entry.
  /add <key>[/<note>] [for <player>]     Inflict a Tilt.
  /remove <key> [for <player>]           Remove a Tilt (no Beats awarded).
  /clear [for <player>]                  End-of-scene sweep — clear all Tilts.

Tilts award no Beats on resolution (CoFD 2e core p.282).
Cross-player edits require canEdit (builder+).

Examples:
  +tilt                          View your active Tilts.
  +tilt/list environmental       List environmental Tilts.
  +tilt/show stunned             Show the Stunned Tilt.
  +tilt/add stunned              Apply Stunned to yourself.
  +tilt/add ice for Marcus       Apply Ice to Marcus (builder+).
  +tilt/clear                    End scene — wipe your Tilts.`,
  exec: tiltExec,
});

addCmd({
  name: "+notes",
  pattern: /^\+notes(?:\/(\S+))?\s*(.*)/i,
  lock: "connected",
  category: "Cofd",
  help: `+notes [...]  — Character notes with public/private visibility.

Syntax:
  +notes                        Show your own notes.
  +notes <player>               Show another player's visible notes.
  +notes <player>/<name>        Show one note in full.
  +notes/add [<player>/]<name>=<text>    Create a note (public by default).
  +notes/edit [<player>/]<name>=<text>   Replace the text.
  +notes/del [<player>/]<name>           Delete a note.
  +notes/priv [<player>/]<name>=public|private

Notes:
  Private notes are visible only to their owner and staff. Cross-player
  edits require canEdit. Max name 40 chars; max text 8000 chars.`,
  exec: notesExec,
});
