+gear [<player>] [<filter>]  -- Browse equipment and manage carried items.

Syntax:
  +gear                                  View your inventory.
  +gear <player>                         View another player's inventory.
  +gear ammo|weapons|armor|gear          Filter the view by section.
  +gear/list [<cat>]                     Catalog (weapons|ranged|melee|armor|
                                         mental|physical|social|services|ammo).
  +gear/show <key>                       Full catalog entry.
  +gear/add <key>[/<note>] [for <p>]     Add to inventory; ammo merges into
                                         an existing stack.
  +gear/remove <#> [for <player>]        Discard inventory slot #.
  +gear/equip <#> [for <player>]         Equip weapon/armor at slot #.
  +gear/unequip <weapon|armor> [for <p>] Clear an equipped slot.
  +gear/reload [<#|name>] [for <p>]      Reload firearm; consumes one stack.
  +gear/split <#>=<n> [for <player>]     Split <n> rounds off an ammo stack.
  +gear/damage <#|name>[=<n>] [for <p>]  Apply <n> damage; soaks by Durability.
  +gear/repair <#|name>[=<n>] [for <p>]  Repair <n> hp; clamps to max.

Notes:
  Native get/drop/give move items between players and the room.
  Broken items auto-unequip and lose their dark flag.
  Firearms track currentClip; firing decrements, /reload refills from a stack.

Permissions:
  View              connected.
  Modify own        connected.
  Modify other      connected + canEdit (builder+).

Examples:
  +gear                          View your inventory.
  +gear ammo                     Show only your ammo stacks.
  +gear/add pistol-light         Add a light pistol.
  +gear/add magazine-9mm-light   Add (or stack) a 9mm magazine.
  +gear/equip 1                  Equip slot 1.
  +gear/reload                   Reload equipped firearm.
  +gear/split 3=5                Split 5 rounds off ammo stack 3.

More:
  help gear ammo                 Magazines, stacking, concealment.
  help gear durability           Soak math, broken state, repair.
  help gear reload               Reload mechanics and ammo consumption.
  help gear weapons              Ranged + melee tables and rules.
  help gear armor                Armor ratings, Defense/Speed math.
  help gear inventory            Slot model, equip/unequip mechanics.

See also: roll, sheet, condition, tilt, attack, cofd
