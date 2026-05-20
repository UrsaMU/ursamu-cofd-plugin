+dodge  -- Declare a dodge, trading your action to double Defense as an
           active dice pool against incoming attacks.

Syntax:
  +dodge               Declare dodge for your turn.
  +dodge/cancel        Cancel a declared dodge before any attacks land.

Mechanics:
  Declaring dodge uses your instant action for the turn.
  Your Defense is doubled and rolled as a dice pool against each attack.
  Each success from the Dodge roll subtracts one from the attacker's
  successes. If the attacker's successes drop to zero, the attack fails.
  Remaining attacker successes have the weapon modifier added before
  calculating damage.

  Dodge only works when Defense would normally apply (unarmed, melee,
  thrown). It has no effect against Firearms attacks.

Multiple attackers:
  Against two or more opponents, reduce your Defense by 1 per additional
  attacker before doubling.
  Example: Defense 3, three attackers -> (3 - 2) * 2 = 2 dice.
  If Defense is reduced to 0 before doubling, roll a chance die.
  A dramatic failure while Dodging reduces your Defense by 1 next turn.

Willpower while dodging:
  You may spend 1 Willpower during dodge to add +2 to Defense against
  one specific attacker (apply before doubling).

Incompatibilities:
  A character who declares Dodge cannot also attack that turn.
  A character cannot dodge and perform an All-Out Attack or Charge
  in the same turn.

Permissions:
  connected; must be a participant in an active encounter.

Examples:
  +dodge               Declare dodge; double Defense this turn.
  +dodge/cancel        Change your mind before attacks resolve.

See also: combat, attack, grapple, health
