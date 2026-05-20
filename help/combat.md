+combat  -- Manage a combat encounter: open, join, begin, advance turns,
            and close. All players in the scene share one encounter.

Syntax:
  +combat/start                          Open a new encounter.
  +combat/join                           Join the current encounter.
  +combat/leave                          Leave without ending the encounter.
  +combat/begin                          Roll initiative and set turn order.
  +combat/order                          Show the current initiative table.
  +combat/next                           Advance to the next combatant's turn.
  +combat/end                            Close the encounter and clear state.
  +combat/ambush <attacker>=<defender>   Resolve an ambush check before begin.
  +combat/delay                          Delay your action to later this turn.

Switches:
  /start    Opens the encounter. Only one encounter can be active per room.
  /join     Adds you to the participant list. Use before /begin.
  /leave    Removes you from the list. Cannot leave on your own turn.
  /begin    Rolls initiative for all joined participants and orders them.
            Calling /begin a second time re-rolls all initiative scores.
  /order    Displays the current table (name, initiative, HP, turn marker).
  /next     Ends the current combatant's turn. Automatically loops the
            round counter and resets per-round Defense tracking.
  /end      Closes the encounter. Requires admin or encounter opener.
  /ambush   Runs a contested Wits+Composure vs Dexterity+Stealth check.
            Loser of the contest cannot act or apply Defense on turn 1.
  /delay    Moves your place in the order to later this turn. Your slot
            becomes permanent for subsequent rounds.

Permissions:
  /start, /end    connected + canEdit (builder+), or room owner.
  All others      connected; participant in the encounter.

Mechanics:
  Initiative = 1d10 + Dexterity + Composure + weapon Initiative modifier.
  Higher results act first. Ties broken by Composure, then Dexterity.
  Defense degrades by 1 for each attack resolved against a character
  within the same turn. It resets at the start of the following turn.

Examples:
  +combat/start                  Open a new encounter in this room.
  +combat/join                   Add yourself to the participant list.
  +combat/begin                  Roll initiative for all participants.
  +combat/order                  Show who acts when.
  +combat/ambush Jax=Marcus      Resolve ambush: Jax attacks Marcus.
  +combat/next                   End Jax's turn; Marcus acts next.
  +combat/end                    Close the encounter.

More:
  help combat initiative         Initiative formula and weapon modifiers.
  help combat order              Reading the turn table and delaying.
  help combat modifiers          Attack modifier reference chart.
  help combat specified          Specified target penalties and Tilts.

See also: attack, grapple, dodge, health, condition, roll
