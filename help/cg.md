# +cg

Interactive, six-stage character generation. Each stage validates point
budgets before advancing.

## Syntax

```
+cg                       View current stage instructions and progress.
+cg/set <trait>=<value>   Distribute points or choose a template option.
+cg/back                  Return to the previous stage.
+cg/reset                 Start over with a blank Mortal sheet.
+cg/submit                Validate the current stage and advance.
```

## Stages

1. **Core Identity** — Concept, Virtue, Vice.
2. **Supernatural Template** — Mortal, Vampire, Werewolf, Mage, or Changeling.
3. **Template Specifics** — Clan, Auspice, Path, Seeming, etc.
4. **Attributes** — Distribute `{5, 4, 3}` extra dots above base 1.
5. **Skills** — Distribute `{11, 9, 7}` dots.
6. **Supernatural Powers** — Mortal: 0. Vampire/Werewolf/Changeling: 3.
   Mage: 6.

## Examples

```
+cg/set concept=Street Detective
+cg/set virtue=Justice
+cg/set vice=Pride
+cg/submit
+cg/set template=vampire
+cg/submit
+cg/set clan=Daeva
+cg/set covenant=Invictus
+cg/submit
+cg/set Strength=3
+cg/set Dexterity=2
+cg/set Presence=2
+cg/submit
```

## Notes

`+cg/submit` on the final stage finalizes the sheet, writes it to
`state.cofd`, and clears the chargen workspace. After submission, further
edits go through `+sheet/set` (and require builder permissions on other
players).

## See also

- `help sheet`, `help roll`
