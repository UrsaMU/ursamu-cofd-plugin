# +health

View or modify a character's Chronicles of Darkness 2e Health track.
Damage fills from left to right; once full, heavier damage upgrades
lighter damage one box at a time.

## Syntax

```
+health [<player>]                  View the Health track.
+health/bash[<n>] [<player>]        Apply N bashing damage (default 1).
+health/lethal[<n>] [<player>]      Apply N lethal damage.
+health/agg[<n>] [<player>]         Apply N aggravated damage.
+health/heal[<n>] [<player>]        Heal N damage, heaviest first.
+health/heal-bash[<n>] [<player>]   Heal N bashing only.
+health/heal-lethal[<n>] [<player>] Heal N lethal only.
+health/heal-agg[<n>] [<player>]    Heal N aggravated only.
```

## Switches

- `/bash`, `/lethal`, `/agg` — Apply the named damage type. Append digits to
  the switch (no separator) to apply multiple boxes at once.
- `/heal` — Heal damage starting with aggravated, then lethal, then bashing.
- `/heal-bash`, `/heal-lethal`, `/heal-agg` — Heal a specific damage type
  only.

## Permissions

- Viewing requires `connected`.
- Applying or healing damage on your own sheet requires `connected`.
- Cross-player edits require `canEdit` (builder+).

## Mechanics

### Track size

Track size equals `Stamina + Size`. A baseline adult human (Stamina 2,
Size 5) has 7 boxes. Default sheets show fewer until attributes are set.

### Damage cascade

Box characters from lightest to heaviest:

- `[ ]` empty
- `[/]` bashing  — fists, falls, exhaustion
- `[X]` lethal   — blades, bullets
- `[*]` aggravated — fire, claws, supernatural

Free boxes fill first. When the track is full, the next box of a heavier
type upgrades the leftmost lighter-type box one step (bashing -> lethal,
then lethal -> aggravated). Total boxes never exceed the track maximum.

### Wound penalty

When the three rightmost boxes hold any damage, dice rolls take a penalty.
Worst applicable penalty wins; penalties do NOT stack.

| Damaged box           | Penalty |
| --------------------- | ------- |
| third-to-last filled  | -1      |
| second-to-last filled | -2      |
| last (rightmost) full | -3      |

The penalty is applied automatically to every `+roll` expression. Raw
numeric pools (`+roll 6`) skip the penalty.

## Examples

```
+health                        View your own Health track.
+health Marcus                 View Marcus's Health track.
+health/bash                   Take 1 bashing.
+health/lethal3                Take 3 lethal.
+health/agg2 Marcus            Apply 2 aggravated to Marcus (builder+).
+health/heal                   Heal 1 box, heaviest first.
+health/heal-bash5             Heal 5 bashing only.
```

## See also

- `help roll`, `help sheet`, `help cofd`
