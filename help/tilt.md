+tilt  -- View or modify active Tilts (Personal + Environmental).
         Tilts award no Beats on resolution -- they're scene-bound
         circumstances, not Conditions. Use /clear at scene end.

Syntax:
  +tilt                                  View your active Tilts.
  +tilt <player>                         View another player's Tilts.
  +tilt/list                             Full catalog.
  +tilt/list <scope>                     Filter (personal|environmental).
  +tilt/show <key>                       Full Tilt entry.
  +tilt/add <key> [for <player>]         Inflict a Tilt by catalog key.
  +tilt/add <key>/<note> [for <player>]  Inflict with a free-text note.
  +tilt/remove <key> [for <player>]      Remove a single Tilt.
  +tilt/clear [for <player>]             Scene-end sweep (no Beats).

Switches:
  /list      Print the catalog (Personal Tilts and Environmental Tilts).
  /show      Print one Tilt's description, effect, causing, and ending.
  /add       Inflict a catalog Tilt on the target. Each key is unique
             per character; duplicates are no-ops.
  /remove    Remove one Tilt by key.
  /clear     Wipe every active Tilt on the target (scene end).

Mechanics:
  Tilts come in two flavors. Personal Tilts attach to one character.
  Environmental Tilts affect a scene but are tracked per-character in
  this implementation (v1 has no scene object).

  Resolving or removing a Tilt awards zero Beats (CoFD 2e core p.282).
  Tilts end at scene end or by the specific Ending text in each entry.

Permissions:
  View              connected.
  Modify own        connected.
  Modify other      connected + canEdit (builder+).

Examples:
  +tilt                          View your active Tilts.
  +tilt/list environmental       List environmental Tilts only.
  +tilt/show stunned             Show the Stunned Tilt entry.
  +tilt/add stunned              Apply Stunned to yourself.
  +tilt/add ice for Marcus       Apply Ice to Marcus (builder+).
  +tilt/clear                    End scene -- wipe all your Tilts.

More:
  help tilt scope                Personal vs Environmental, scene rules.

See also: condition, health, sheet, cofd
