+condition  -- View or modify a character's active Conditions and Tilts.
              Resolving a Condition awards the catalog Beats; removing
              it is a correction and awards nothing.

Syntax:
  +condition                                 View your Conditions.
  +condition <player>                        View another player's.
  +condition/add <key> [for <player>]        Apply by catalog key.
  +condition/add <key>/<note> [for <player>] Apply with a note.
  +condition/remove <key> [for <player>]     Remove (no Beats).
  +condition/resolve <key> [for <player>]    Resolve + award Beats.
  +condition/list                            Show the catalog.

Switches:
  /add        Apply a catalog entry by key. Optional /<note> attaches a
              free-text note recorded on the active instance.
  /remove     Take the Condition off without awarding Beats. Use for
              corrections.
  /resolve    Resolve the Condition: remove it and award the catalog
              Beats (Conditions: 1 by default; Tilts: 0).
  /list       Print the catalog.

Permissions:
  View                connected.
  Modify own          connected.
  Modify other        connected + canEdit (builder+).

Examples:
  +condition                            View your Conditions.
  +condition/add shaken                 Apply Shaken to yourself.
  +condition/add shaken/Saw the body    Apply with a note.
  +condition/resolve shaken             Resolve and earn 1 Beat.
  +condition/remove shaken Marcus       Correction (builder+).
  +condition/list                       Show every catalog entry.

More:
  help condition mechanics              Conditions vs Tilts, Beat math.

See also: aspiration, beat, xp, sheet, cofd
