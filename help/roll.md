+roll  -- Roll a CoFD 2e dice pool. d10s, count 8/9/10 as successes, with
         optional n-again threshold, rote action, and Willpower spend.

Syntax:
  +roll <expression>
  +roll/<switch>[/<switch>...] <expression>

  Switches may be separated by '/' or ',':
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
  Vigor                       Single trait (works for powers too).
  6                           Raw dice pool.

  Recognized names: 9 attributes, 24 skills, the active template's Power
  Stat (and aliases like bp, pu), Morality trait, and valid Powers
  (vigor, auspex, forces, etc).

Mechanics:
  Success         Any die showing 8, 9, or 10.
  10-again        Tens count as successes and reroll. Chains.
  9-again, 8-again  Lower the reroll threshold. Chains continue if the
                  new die also meets it.
  Rote            Reroll initial failures (1-7) once. Rerolls still obey
                  the n-again threshold but do not themselves rote.
  Chance die      Pool <= 0 rolls a single d10. Success only on 10. A 1
                  is a Dramatic Failure. Chance dice ignore /rote, /9again,
                  /8again.
  Exceptional     5 or more successes. Triggers Inspired (or equivalent).
  Wound penalty   Applied automatically based on Health damage. Raw pools
                  (+roll 6) skip this. See help health.

Untrained skills:
  Mental skills            -3 dice (Academics, Computer, Crafts,
                           Investigation, Medicine, Occult, Politics,
                           Science).
  Physical / Social        -1 die.

Examples:
  +roll Strength+Brawl              Punch.
  +roll Dexterity+Firearms+2        Aimed shot.
  +roll/wp Resolve+Composure        Resist with willpower spend.
  +roll/rote Wits+Investigation     Investigator rote action.
  +roll/9again Stamina+Athletics    Sprint with 9-again from a Merit.
  +roll/wp/rote/8again Strength+Brawl
  +roll 6                           Raw pool of 6 dice.

See also: cg, sheet, health
