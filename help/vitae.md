+vitae  -- View or modify a vampire's Vitae pool. Vitae is the blood
          resource drawn from feeding; nearly every Discipline activation,
          healing, and Blush of Life draws from it. Vampire-only.

Syntax:
  +vitae                                  View your own Vitae pool.
  +vitae <player>                         View another vampire's pool.
  +vitae/spend [<n>] [for <player>]       Spend N Vitae (default 1).
  +vitae/gain  [<n>] [for <player>]       Gain N Vitae (capped at BP max).
  +vitae/blush [for <player>]             Spend 1 Vitae for Blush of Life.
  +vitae/boost <attr> [for <player>]      Spend 1 Vitae to boost a Physical
                                          Attribute (+2 for the scene).

Switches:
  /spend      Spend Vitae. Default amount is 1. Above the per-turn cap
              the command still spends but warns that the action spans
              multiple turns of fiction.
  /gain       Add Vitae to the pool from feeding or storyteller award.
              The pool is clamped to the BP Max-Vitae value.
  /blush      Blush of Life: 1 Vitae buys roughly one hour of mortal
              mimicry (warm skin, breathing, ability to eat or have sex).
  /boost      1 Vitae adds +2 to one Physical Attribute (Strength,
              Dexterity, or Stamina) for the scene. Scene state is not
              tracked automatically; treat the bonus as display only.

Permissions:
  View                connected.
  Spend / gain self   connected.
  Spend / gain other  connected + canEdit (builder+).

Mechanics:
  Only vampires have Vitae. Sheets with a non-vampire template reject
  the command. Vitae spending checks the current pool first.

  Blood Potency table (RAW 2e):
    BP  Max Vitae  Per-Turn  Min Humanity  Notes
    --  ---------  --------  ------------  ----------------------
     0    10          1          -         Newly Embraced.
     1    10          1          -         Animal/human/vampire.
     2    11          2          -         Animal no longer slakes.
     3    12          3          -         Human or vampire.
     4    13          4          -         Human or vampire.
     5    14          5          7         Human blood weakening.
     6    15          6          6         Vice/Virtue or Kindred.
     7    20          7          5         Vampire vitae preferred.
     8    30          8          4         Must hunt Kindred.
     9    50          9          3         Almost only Kindred.
    10    75         10          2         Mythic monster.

  Per-turn cap: above-cap spends require multiple turns of fiction in
  the scene. The command warns but does not block.

  Common Vitae costs:
    Heal 1 bashing       1 Vitae   reflexive
    Heal 1 lethal        1 Vitae   1 turn each
    Heal 1 aggravated    5 Vitae   1 day of rest + 1 Willpower
    Boost a Physical     1 Vitae   +2 for the scene
    Power a Discipline   varies    per Discipline entry
    Blush of Life        1 Vitae   one hour of warmth
    Wake at sunset       1 Vitae   automatic each night
    Create a ghoul       1 Vitae   one month of bond
    Embrace              all but 1 Vitae returned at point of death

Examples:
  +vitae                         View your Vitae pool.
  +vitae Marcus                  View Marcus's pool.
  +vitae/spend                   Spend 1 Vitae.
  +vitae/spend 3                 Spend 3 Vitae.
  +vitae/gain 2 for Marcus       Add 2 Vitae to Marcus (builder+).
  +vitae/blush                   Blush of Life for one hour.
  +vitae/boost dexterity         +2 Dexterity for the scene.

See also: touchstone, sheet, roll, cofd
