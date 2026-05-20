combat order  -- Reading the initiative table and understanding turn order.

Display:
  +combat/order shows each participant in descending initiative order.
  Each row contains:

    Name             Init   HP         Status
    --------         ----   ------     -------
    Jax              14     OOO...     (active)
    Marcus           11     OOOOO.
    Cass             8      OO....

  The active marker shows whose turn it currently is.
  HP boxes: O = healthy box, / = bashing, X = lethal, * = aggravated.
  A dagger (!) next to a name indicates the character is Beaten Down.

Columns explained:
  Name      Character name (or NPC label set by the ST).
  Init      Final initiative result for this combat.
  HP        Compact health track. See: help health.
  Status    Special flags: (active), (delayed), (down), (out).

Turn flow:
  The character with the highest initiative acts first each round.
  When a turn ends (via +combat/next), the marker moves to the next
  combatant. After the last combatant acts, the round counter increments
  and Defense resets for all characters.

Delaying:
  Use +combat/delay on your turn to push your action to later this round.
  Announce at any point before the next round that you are acting.
  Your new position becomes permanent for all future rounds.

Dropping from the order:
  A character reduced to zero Health, rendered Immobilized, or who uses
  +combat/leave is removed from the active rotation. Their row remains
  visible in the table until the encounter ends.

See also: combat, combat initiative, attack, health
