+vitae  -- View or modify a vampire's Vitae pool. Vitae powers Disciplines,
          healing, Blush of Life, and physical boosts. Vampire-only.

Syntax:
  +vitae                                  View your own pool.
  +vitae <player>                         View another vampire's pool.
  +vitae/spend [<n>] [for <player>]       Spend N Vitae (default 1).
  +vitae/gain  [<n>] [for <player>]       Gain N Vitae (capped at BP max).
  +vitae/blush [for <player>]             Spend 1 Vitae for Blush of Life.
  +vitae/boost <attr> [for <player>]      Spend 1 Vitae for +2 Physical.

Switches:
  /spend     Spend Vitae. Warns if N exceeds the BP per-turn cap.
  /gain      Add Vitae. Pool is clamped to BP Max Vitae.
  /blush     Blush of Life: one hour of mortal mimicry per point.
  /boost     +2 to Strength, Dexterity, or Stamina for the scene.

Permissions:
  View                connected.
  Spend / gain self   connected.
  Spend / gain other  connected + canEdit (builder+).

Examples:
  +vitae                         View your pool.
  +vitae/spend 3                 Spend 3 Vitae.
  +vitae/gain 2 for Marcus       Add 2 Vitae to Marcus (builder+).
  +vitae/blush                   Blush of Life for one hour.
  +vitae/boost dexterity         +2 Dexterity for the scene.

More:
  help vitae blood-potency       BP table: max Vitae, per-turn cap, etc.
  help vitae costs               Common Vitae costs (heal, Discipline).

See also: touchstone, sheet, roll, cofd
