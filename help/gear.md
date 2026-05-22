+gear  -- Browse the CoFD 2e equipment catalog and manage carried items.
         Equipping armor applies Defense and Speed penalties on the sheet;
         equipped weapon damage feeds +roll/weapon as bonus successes.

Syntax:
  +gear                                  View your own inventory.
  +gear <player>                         View another player's inventory.
  +gear/list [<cat>]                     Catalog. Optional category filter
                                         (weapons, ranged, melee, armor,
                                         mental, physical, social, services).
  +gear/show <key>                       Full catalog entry.
  +gear/add <key>[/<note>] [for <p>]     Add to inventory (optional note).
  +gear/remove <#> [for <player>]        Remove inventory slot #.
  +gear/equip <#> [for <player>]         Equip weapon/armor at slot #.
  +gear/unequip <weapon|armor> [for <p>] Clear an equipped slot.

Permissions:
  View              connected.
  Modify own        connected.
  Modify other      connected + canEdit (builder+).

Examples:
  +gear                          View your inventory.
  +gear/list weapons             Browse ranged + melee.
  +gear/show kevlar-vest         Show the Kevlar Vest entry.
  +gear/add pistol-light         Add a light pistol.
  +gear/add knife/Heirloom       Add with a note.
  +gear/equip 1                  Equip slot 1.
  +gear/unequip armor            Take off your armor.

More:
  help gear weapons              Ranged + melee tables and rules.
  help gear armor                Armor ratings, Defense/Speed math.
  help gear gear                 Equipment categories and dice bonuses.
  help gear inventory            Slot model, equip/unequip mechanics.

See also: roll, sheet, condition, tilt, cofd
