combat switches  -- Per-switch behavior for +combat.

Encounter lifecycle:
  /start    Opens the encounter. Only one encounter can be active per room.
  /join     Adds you to the participant list. Use before /begin.
  /leave    Removes you from the list. Cannot leave on your own turn.
  /begin    Rolls initiative for all joined participants and orders them.
            Calling /begin a second time re-rolls all initiative scores.
  /order    Displays the current table (name, initiative, HP, turn marker).
  /next     Ends the current combatant's turn. Automatically loops the
            round counter and resets per-round Defense tracking.
  /end      Closes the encounter. Requires admin or encounter opener.

Pre-combat checks:
  /ambush   Runs a contested Wits+Composure vs Dexterity+Stealth check.
            Loser of the contest cannot act or apply Defense on turn 1.

Action holding:
  /delay    Marks you Delayed and advances past your slot in the order.
            Your held action can be reclaimed later this round with /act.
            All delayed flags clear at the round wrap.
  /act      A delayed actor reclaims their held action. The turn pointer
            jumps to them; the rest of the order resumes after.

Movement:
  /move     You move up to Speed yards. Free -- the instant slot is not
            consumed. Cannot move twice in one round.
  /run      You sprint up to 2 x Speed yards. Consumes your instant
            action and applies -1 Defense until your next turn.

Narration:
  /reflexive   Announces a reflexive action (no slot used). Does not
               affect the action economy; pure narration broadcast.

Battlefield state:
  /cover    Declare cover (partial/substantial/full/none). See:
            help combat cover.
  /conceal  Declare concealment (light/medium/heavy/none). See:
            help combat conceal.
  /status   Print one participant's combat state line.

See also: combat, combat action-economy, combat delaying
