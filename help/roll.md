# +roll

Roll a CoFD 2e dice pool: d10s, count 8/9/10 as successes, with optional
n-again threshold, rote action, and Willpower spend.

## Syntax

```
+roll <expression>
+roll/<switch>[/<switch>...] <expression>
```

Switches can also be separated by commas:

```
+roll/wp,rote,9again Stamina+Athletics
```

## Switches

- `/wp` — Spend 1 current Willpower for +3 dice.
- `/rote` — Reroll every failed die (1-7) in the initial pool once.
- `/9again` — Reroll any die showing 9 or 10 (default is 10-again).
- `/8again` — Reroll any die showing 8, 9, or 10.

## Expression grammar

Add traits, modifiers, and specialties with `+` / `-`:

```
Strength+Brawl              Attribute + Skill
Dexterity+Crafts/Automotive Skill with specialty
Wits+Composure+2            Combo with numeric modifier
Vigor                       Single trait (works for powers too)
6                           Raw dice pool
```

Recognized trait names are: the 9 Attributes, the 24 Skills, the active
template's Power Stat (and aliases like `bp`, `pu`), the active template's
Morality trait, and the active template's valid Powers (e.g. `vigor`,
`auspex`, `forces`).

## Mechanics

- **Success** — Any die rolling 8, 9, or 10.
- **10-again (default)** — Tens count as successes and reroll. Chains.
- **9-again / 8-again** — Lower the reroll threshold. Chains continue while
  the new die meets the threshold.
- **Rote** — After the initial pool resolves, reroll every die that came up
  1-7 once. Rerolls still obey the n-again threshold but do not themselves
  generate further rote rerolls.
- **Chance die** — When the pool drops to 0 or below, roll a single d10:
  - Succeeds only on 10 (no rerolls).
  - A 1 is a Dramatic Failure.
  - Chance dice ignore /rote, /9again, /8again.
- **Exceptional success** — 5 or more successes. Triggers the *Inspired*
  condition (or template-specific equivalent).
- **Wound penalty** — Applied automatically based on Health damage (see
  `help health`).

## Untrained penalties

Rolling a Skill at 0 dots applies a penalty:

- **Mental skills** — `-3` dice (Academics, Computer, Crafts, Investigation,
  Medicine, Occult, Politics, Science).
- **Physical / Social skills** — `-1` die.

## Examples

```
+roll Strength+Brawl              Punch.
+roll Dexterity+Firearms+2        Aimed shot.
+roll/wp Resolve+Composure        Resist with willpower spend.
+roll/rote Wits+Investigation     Investigator rote action.
+roll/9again Stamina+Athletics    Sprint with 9-again from a Merit.
+roll/wp/rote/8again Strength+Brawl
+roll 6                           Raw pool of 6 dice.
```

## See also

- `help cg`, `help sheet`
