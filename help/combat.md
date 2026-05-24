+combat  -- Manage a combat encounter: open, join, begin, advance turns,
            and close. All players in the scene share one encounter.

Syntax:
  +combat/start                          Open a new encounter.
  +combat/join                           Join the current encounter.
  +combat/leave                          Leave without ending the encounter.
  +combat/begin                          Roll initiative and set turn order.
  +combat/order                          Show the current initiative table.
  +combat/next                           Advance turn; AI pumps NPCs until
                                         next PC turn or scene resolution.
  +combat/next/manual                    Single-step advance (no AI walker).
  +combat/end                            Close the encounter and clear state.
  +combat/ambush <attacker>=<defender>   Resolve an ambush check before begin.
  +combat/cover <level> [for <player>]   Declare cover.
  +combat/conceal <level> [for <player>] Declare concealment.
  +combat/status [<player>]              Show a participant's combat state.
  +combat/delay                          Hold your action; advance the turn.
  +combat/act                            Take your held action now.
  +combat/move                           Move up to Speed yards (free).
  +combat/run                            Sprint; uses your instant action.
  +combat/reflexive <text>               Announce a reflexive action.

Permissions:
  /start, /end    connected + canEdit (builder+), or room owner.
  All others      connected; participant in the encounter.

Examples:
  +combat/start                  Open a new encounter in this room.
  +combat/join                   Add yourself to the participant list.
  +combat/begin                  Roll initiative for all participants.
  +combat/order                  Show who acts when.
  +combat/ambush Jax=Marcus      Resolve ambush: Jax attacks Marcus.
  +combat/next                   End Jax's turn; Marcus acts next.
  +combat/end                    Close the encounter.

More:
  help combat switches           Per-switch behavior and rules.
  help combat initiative         Initiative formula and weapon modifiers.
  help combat order              Reading the turn table and delaying.
  help combat action-economy     Instant, reflexive, movement slots.
  help combat delaying           /delay and /act in detail.
  help combat modifiers          Attack modifier reference chart.
  help combat specified          Specified target penalties and Tilts.
  help combat cover              Cover levels and Durability penalties.
  help combat conceal            Concealment levels and attacker penalties.

See also: attack, grapple, dodge, health, condition, roll
