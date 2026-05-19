# +sheet

View and edit Chronicles of Darkness character sheets.

## Syntax

```
+sheet [<player>]                View a character sheet.
+sheet/set <trait>=<value>       Set a trait on your own sheet.
+sheet/set <player>/<trait>=<v>  Set a trait on another player's sheet.
+sheet/set specialty/<skill>=<name>  Add a skill specialty.
+sheet/set specialty/<skill>=clear   Remove all specialties from a skill.
```

## Permissions

- Viewing requires `connected`.
- Editing your own sheet is permitted after chargen submission.
- Editing another player's sheet requires `canEdit` (builder+).

## Settable traits

- **Identity** — `concept`, `virtue`, `vice`
- **Template** — `template` (mortal, vampire, werewolf, mage, changeling)
- **Attributes** — `strength`, `dexterity`, `stamina`, `presence`,
  `manipulation`, `composure`, `intelligence`, `wits`, `resolve` (1-5)
- **Skills** — any of the 24 CoFD skills (0-5)
- **Specialties** — `specialty/<skill>=<name>`
- **Merits** — by merit key (rating must be a valid dot for that merit)
- **Morality** — `humanity`, `harmony`, `wisdom`, `clarity`, or `integrity`
  depending on template
- **Power Stat** — `blood potency` (or `bp`), `gnosis`, `wyrd`, `primal urge`
  (or `pu`)
- **Energy** — `vitae`, `essence`, `mana`, `glamour`
- **Custom fields** — `clan`, `covenant`, `auspice`, `tribe`, `path`,
  `order`, `seeming`, `court` (template-dependent)
- **Other** — `willpower`, `size`

## Resetting traits

Pass an empty value to reset to the template default:

```
+sheet/set athletics=
+sheet/set vitae=
```

## Examples

```
+sheet                              View your own sheet.
+sheet Marcus                       View another player's sheet.
+sheet/set strength=3               Set your Strength to 3.
+sheet/set Marcus/clan=Ventrue      Set Marcus's Clan (builder+).
+sheet/set specialty/athletics=Climbing
```

## See also

- `help cg`, `help roll`
