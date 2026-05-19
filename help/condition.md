+condition  -- View or modify a character's active Conditions and Tilts.
              Resolving a Condition awards the catalog Beats (typically 1);
              removing it is a correction and awards nothing.

Syntax:
  +condition                                View your active Conditions.
  +condition <player>                       View another player's Conditions.
  +condition/add <key> [for <player>]       Apply the catalog Condition.
  +condition/add <key>/<note> [for <player>] Apply with a note attached.
  +condition/remove <key> [for <player>]    Remove without awarding Beats.
  +condition/resolve <key> [for <player>]   Resolve and award the Beats.
  +condition/list                           Show the catalog.

Switches:
  /add        Apply a catalog entry by key. Optional /<note> attaches a
              free-text note recorded on the active instance.
  /remove     Take the Condition off without awarding Beats. Use this for
              corrections (mistakenly applied, scene cleanup).
  /resolve    Resolve the Condition: remove it and award the catalog Beats
              (Conditions: 1 Beat by default; Tilts: 0).
  /list       Print the catalog. Cond = Condition, Tilt-P = Personal Tilt,
              Tilt-E = Environmental Tilt. A leading * marks Persistent
              Conditions.

Permissions:
  View                connected.
  Modify own          connected.
  Modify other        connected + canEdit (builder+).

Mechanics:
  Conditions are narrative-mechanical states that persist beyond the
  current scene and award Beats on resolution. Tilts are scene-bound
  combat or environment effects and award no Beats.

  Catalog keys are lowercase-kebab slugs:
    Key                  Name
    -------------------  --------------------
    shaken               Shaken
    embarrassing-secret  Embarrassing Secret
    shadow-soul          Shadow Soul
    knocked-down         Knocked Down

  Beat economy:
    Conditions award 1 Beat on resolution by default. Beats convert to
    Experience at 5:1 (see +xp). Tilts award 0 Beats.

Examples:
  +condition                         View your own Conditions.
  +condition Marcus                  View Marcus's Conditions.
  +condition/add shaken              Apply Shaken to yourself.
  +condition/add shaken/Saw the body Apply with a note.
  +condition/resolve shaken          Resolve and earn 1 Beat.
  +condition/remove shaken Marcus    Correction (builder+).
  +condition/list                    Show every catalog entry.

See also: aspiration, beat, xp, sheet, cofd
