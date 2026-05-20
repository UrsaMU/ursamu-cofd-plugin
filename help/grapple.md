+grapple  -- Initiate or continue a grapple. On the first use, roll to
             grab an opponent. On subsequent turns, both combatants
             contest for control and the winner picks a grapple move.

Syntax:
  +grapple <target>                    Initial grab attempt.
  +grapple/<move> [<target>]           Declare your move this turn.

Initial grab:
  Pool: Strength + Brawl - target Defense.
  On any success: both characters are grappling.
  On exceptional success: immediately pick one move from the list below.

Contested control (each subsequent turn):
  Both characters roll Strength + Brawl on the higher of the two
  Initiatives. The winner picks one move. An exceptional success
  earns two moves.

Moves:
  /break-free     Throw off the opponent. No longer grappling. Counts
                  as a reflexive action; the character may still act.
  /control-wpn    Draw your own holstered weapon, or turn the opponent's
                  weapon against her. Control lasts until she wins a
                  /control-wpn move.
  /damage         Deal bashing damage equal to rolled successes. If you
                  previously won a /control-wpn move, add the weapon
                  modifier to successes.
  /disarm         Remove the opponent's weapon from the grapple. You must
                  have already succeeded at /control-wpn this turn.
  /drop-prone     Both characters fall prone. A character must /break-free
                  before rising.
  /hold           Neither character can apply Defense against incoming
                  attacks until the grapple ends or /break-free is used.
  /restrain       Apply the Immobilized Tilt. Requires a prior /hold move.
                  If you use restraints (tape, zip ties), you may then
                  leave the grapple.
  /take-cover     Use the opponent as a human shield until end of turn.
                  All ranged attacks aimed at you automatically hit the
                  opponent instead.

Firearms in a grapple:
  Shooting into a grapple imposes a -4 pool penalty per grappling
  combatant you want to avoid (not -2 as for normal close combat).

Permissions:
  connected; must be a participant in an active encounter.

Examples:
  +grapple Marcus                  Attempt to grab Marcus.
  +grapple/hold                    Win control: apply Hold move.
  +grapple/damage                  Deal bashing damage.
  +grapple/restrain                Immobilize Marcus (requires Hold).
  +grapple/break-free              Escape the grapple.
  +grapple/take-cover              Use Marcus as a shield.

See also: combat, attack, dodge, health, condition
