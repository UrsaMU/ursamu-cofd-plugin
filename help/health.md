+health  -- View or modify a character's Health track. Damage fills left
            to right; when full, heavier damage upgrades lighter damage
            one box at a time.

Syntax:
  +health [<player>]                  View the Health track.
  +health/bash[<n>] [<player>]        Apply N bashing damage (default 1).
  +health/lethal[<n>] [<player>]      Apply N lethal damage.
  +health/agg[<n>] [<player>]         Apply N aggravated damage.
  +health/heal[<n>] [<player>]        Heal N damage, heaviest first.
  +health/heal-bash[<n>] [<player>]   Heal N bashing only.
  +health/heal-lethal[<n>] [<player>] Heal N lethal only.
  +health/heal-agg[<n>] [<player>]    Heal N aggravated only.

Switches:
  /bash, /lethal, /agg   Apply that damage type. Append digits (no space)
                         for amount: /bash3 = 3 bashing.
  /heal                  Heal damage, heaviest type first.
  /heal-bash, /heal-lethal, /heal-agg   Heal one specific type only.

Permissions:
  View                connected.
  Damage / heal self  connected.
  Damage / heal other connected + canEdit (builder+).

Examples:
  +health                        View your own track.
  +health/bash                   Take 1 bashing.
  +health/lethal3                Take 3 lethal.
  +health/agg2 Marcus            2 aggravated to Marcus (builder+).
  +health/heal                   Heal 1 box, heaviest first.

More:
  help health wounds             Track size, cascade, wound penalty.

See also: roll, sheet, cofd
