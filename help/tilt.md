+tilt  -- View or modify active Tilts (Personal + Environmental).
         Tilts award no Beats on resolution -- they're scene-bound
         circumstances, not Conditions. Use /clear at scene end.

Syntax:
  +tilt                                  View your active Tilts.
  +tilt <player>                         View another player's Tilts.
  +tilt/list [<scope>]                   Catalog. Optional filter:
                                         personal | environmental.
  +tilt/show <key>                       Full Tilt entry.
  +tilt/add <key>[/<note>] [for <p>]     Inflict a Tilt (optional note).
  +tilt/remove <key> [for <player>]      Remove a single Tilt.
  +tilt/clear [for <player>]             Scene-end sweep (no Beats).

Permissions:
  View              connected.
  Modify own        connected.
  Modify other      connected + canEdit (builder+).

Mechanics:
  Resolving or removing a Tilt awards zero Beats (CoFD 2e core p.282).
  Tilts end at scene end or by the specific Ending text in each entry.

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
