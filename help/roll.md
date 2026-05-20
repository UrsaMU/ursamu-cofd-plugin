+roll  -- Roll a CoFD 2e dice pool. d10s, count 8/9/10 as successes, with
         optional n-again threshold, rote action, and Willpower spend.

Syntax:
  +roll <expression>
  +roll/<switch>[/<switch>...] <expression>

  Switches may also be separated by ',':
    +roll/wp,rote,9again Stamina+Athletics

Switches:
  /wp           Spend 1 current Willpower for +3 dice.
  /rote         Reroll every failed die (1-7) in the initial pool once.
  /9again       Reroll any die showing 9 or 10 (default is 10-again).
  /8again       Reroll any die showing 8, 9, or 10.

Expression grammar:
  Strength+Brawl              Attribute + Skill.
  Dexterity+Crafts/Automotive Skill with specialty.
  Wits+Composure+2            Combo with numeric modifier.
  Vigor                       Single trait (works for powers).
  6                           Raw dice pool.

  Names recognized: 9 attributes, 24 skills, the active template's Power
  Stat (and aliases like bp, pu), Morality trait, and valid Powers
  (vigor, auspex, forces, etc).

Examples:
  +roll Strength+Brawl              Punch.
  +roll/wp Resolve+Composure        Resist with willpower spend.
  +roll/rote Wits+Investigation     Investigator rote action.
  +roll/9again Stamina+Athletics    Sprint with 9-again.
  +roll/wp/rote/8again Strength+Brawl
  +roll 6                           Raw pool of 6 dice.

More:
  help roll successes      Success threshold, chance die, untrained.

See also: cg, sheet, health
