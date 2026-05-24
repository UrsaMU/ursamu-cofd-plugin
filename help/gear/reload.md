+gear/reload  -- Reload an equipped or carried firearm from an ammo stack.

Syntax:
  +gear/reload                          Reload your equipped firearm.
  +gear/reload <#|name> [for <player>]  Reload a specific weapon by slot or
                                        partial name match.

Mechanics:
  Reload picks the first ammo stack in the carrier's inventory whose
  forWeaponKeys list includes the weapon's catalog key. It decrements that
  stack by 1 and refills the weapon's currentClip to the catalog clip
  value. A stack at count=1 is destroyed when consumed.

  If no compatible stack is in inventory, the command fails with:
    "No magazine for <weapon name> in inventory."

  This is the "click on empty" path: the weapon is fine, you simply have
  nothing to feed it. Pick up a mag, frisk an NPC, or hand a spare from a
  teammate via native give.

Name fallback:
  The <#|name> argument is resolved against your inventory. Integers are
  1-based slots; anything else is a case-insensitive substring match
  against the item's display name. First match wins.

Permissions:
  Self                connected.
  For another player  connected + canEdit (builder+).

Examples:
  +gear/reload                   Reload equipped firearm.
  +gear/reload rifle             Match "rifle" in inventory.
  +gear/reload 2 for Marcus      Reload slot 2 on Marcus (builder+).

See also: gear, gear ammo, attack, reload
