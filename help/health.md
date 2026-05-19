+health  -- View or modify a character's Health track. Damage fills from
            left to right; when full, heavier damage upgrades lighter
            damage one box at a time.

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

Mechanics:
  Track size     Stamina + Size. A Stamina 2 / Size 5 human has 7 boxes.

  Box symbols    [ ] empty
                 [/] bashing      (fists, falls, exhaustion)
                 [X] lethal       (blades, bullets)
                 [*] aggravated   (fire, claws, supernatural)

  Cascade        Free boxes fill first. When the track is full, a new box
                 of a heavier type upgrades the leftmost lighter-type box
                 (bashing -> lethal -> aggravated). Total never exceeds
                 the track maximum.

  Wound penalty  When the three rightmost boxes hold any damage:
                   3rd-to-last filled    -1
                   2nd-to-last filled    -2
                   last (rightmost) full -3
                 The worst applicable applies. Penalties do NOT stack.
                 Subtracted from every +roll except raw pools.

Examples:
  +health                        View your own track.
  +health Marcus                 View Marcus's track.
  +health/bash                   Take 1 bashing.
  +health/lethal3                Take 3 lethal.
  +health/agg2 Marcus            2 aggravated to Marcus (builder+).
  +health/heal                   Heal 1 box, heaviest first.
  +health/heal-bash5             Heal 5 bashing.

See also: roll, sheet, cofd
