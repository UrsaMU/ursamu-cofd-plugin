+extended  -- Manage CoFD 2e Extended Actions (core p.70).

Extended Actions accumulate successes across many rolls until a target
is hit or the attempt cap is exhausted. Use them for research,
lockpicking, crafting, ritual workings, or any task that takes time.

Syntax:
  +extended                                          Status of your active action.
  +extended/start <pool>=<target>[/<n>][/<int>][/cum] <desc>
                                                     Open a new action.
  +extended/roll [<extra-mod>]                       Roll the next attempt.
  +extended/status [<id>]                            View any action by id.
  +extended/list [mine|here|all]                     List actions in scope.
  +extended/abandon <id>                             Cancel an action.
  +extended/finish <id>                              Staff: force success.
  +extended/contest <idA>+<idB>                      Staff: link two actions.

Switches:
  /start    Open a new Extended Action. Owner is always you.
  /roll     Roll your active action. Stacks with /wp, /rote, /9again, /8again
            and /job=N (posts roll results to Job #N).
  /status   Show one action.
  /list     mine (default), here (this room), all (staff).
  /abandon  Owner or staff.
  /finish   Staff-only override -- forces succeeded.
  /contest  Staff-only -- pair two actions; sibling auto-abandons on success.

Permissions:
  View          connected.
  /start        connected (owner = you).
  /roll         connected (owner only).
  /abandon      owner or canEdit.
  /finish       staff (admin / builder / wizard).
  /list all     staff.
  /contest      staff.

Examples:
  +extended/start intelligence+occult=10 Decipher the grimoire
  +extended/start strength+stamina=15/6/hour/cum Force the cell door
  +extended/roll
  +extended/roll/wp -1
  +extended/roll/wp/job=1024 -1
  +extended/list here

More:
  help extended pool         Pool expressions, targets, and attempts.
  help extended cumulative   /cum cumulative penalty rules.
  help extended contested    Linked contested pairs.
  help extended intervals    turn / hour / day / scene narrative timing.

See also: roll, sheet, condition
