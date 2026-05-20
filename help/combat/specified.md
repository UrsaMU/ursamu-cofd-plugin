combat specified  -- Targeting a specific body part: penalties and Tilt
                    thresholds.

Syntax (via +attack):
  +attack/specified <target>=<bodypart>

Body part penalties and thresholds:

  Target    Pool Penalty   Tilt Triggered         Threshold
  --------  ------------   ---------------------  --------------------
  Torso     -1             none                   --
  Arm       -2             Arm Wrack              damage > Stamina
  Leg       -2             Leg Wrack              damage > Stamina
  Head      -3             Stunned                damage >= target Size
  Heart     -3             (special -- see below) 5+ damage points
  Hand      -4             Arm Wrack              any damaging hit
  Eye       -5             Blinded                any damaging hit

Tilt effects summary:
  Arm Wrack (one arm)
    Drop anything held. Suffer off-hand penalties for most rolls.
  Arm Wrack (both arms)
    Chance die on manual dexterity rolls. -3 to other Physical actions.
  Leg Wrack (one leg)
    Half Speed. -2 to Physical rolls involving movement.
  Leg Wrack (both legs)
    Knocked Down. Give up action to move at Speed 1.
  Stunned
    Lose next action. Half Defense until the character next acts.
  Blinded (one eye)
    -3 to vision-related rolls.
  Blinded (both eyes)
    -5 to vision-related rolls. Lose all Defense.

Heart shots:
  Dealing 5 or more points of damage to the heart has special effects
  for certain monstrous targets. Consult the relevant template rules.

Persistent Conditions after combat:
  Tilts are in-combat only. When combat ends, some Tilts upgrade to
  lasting Conditions:
    Blinded Tilt -> Blind Condition (awards 1 Beat when resolved).
  Other Tilts end with the scene unless the Storyteller rules otherwise.

See also: combat modifiers, attack, health, condition
