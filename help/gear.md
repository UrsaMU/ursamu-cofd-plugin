+gear  -- Browse the CoFD 2e equipment catalog and manage carried items.
         Equipping armor applies Defense and Speed penalties on the sheet;
         equipped weapon damage feeds +roll/weapon as bonus successes.

Syntax:
  +gear                                  View your own inventory.
  +gear <player>                         View another player's inventory.
  +gear/list                             Whole catalog.
  +gear/list <cat>                       Filter (weapons, ranged, melee,
                                         armor, mental, physical, social,
                                         services).
  +gear/show <key>                       Full catalog entry.
  +gear/add <key> [for <player>]         Add to inventory.
  +gear/add <key>/<note> [for <player>]  Add with a free-text note.
  +gear/remove <#> [for <player>]        Remove inventory slot #.
  +gear/equip <#> [for <player>]         Equip weapon/armor at slot #.
  +gear/unequip <weapon|armor> [for <p>] Clear an equipped slot.

Switches:
  /list      Show the catalog. Optional category narrows the listing.
  /show      Print a single item's full stat block.
  /add       Add a catalog item to inventory. Each item carries a stable
             id so equip/remove survive reordering.
  /remove    Drop the item at slot # (1-based). If that item was equipped,
             the slot is cleared in the same write.
  /equip     Equip slot # into its natural slot (weapon or armor). Items
             that aren't weapons or armor cannot be equipped.
  /unequip   Clear the named slot.

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

See also: roll, sheet, condition, tilt, cofd
