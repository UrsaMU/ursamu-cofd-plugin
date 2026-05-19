# +beat

Award, subtract, or view Beats — the atomic unit of CoFD 2e advancement.
Five Beats convert to one Experience automatically the moment the fifth is
logged. Arcane Beats track separately and convert into Arcane Experience at
the same 5:1 ratio.

## Syntax

```
+beat                                       View your own pools.
+beat <player>                              View another player's pools.
+beat/add [<player>] [= <reason>]           Award 1 Beat (default self).
+beat/sub [<player>] [= <reason>]           Subtract 1 Beat (correction).
+beat/add/arcane [<player>] [= <reason>]    Award 1 Arcane Beat.
+beat/sub/arcane [<player>] [= <reason>]    Subtract 1 Arcane Beat.
```

## Switches

- `/add` — Award one Beat to the target (default self).
- `/sub` — Subtract one Beat. Used for corrections; never lets a pool fall
  below zero (will pull from the Experience pool if needed).
- `/arcane` — Operate on the Arcane Beat track instead of the standard one.
  Combine with `/add` or `/sub`, e.g. `+beat/add/arcane`.

## Permissions

- Viewing requires `connected`.
- Awarding or subtracting Beats on your own sheet requires `connected`.
- Cross-player edits require `canEdit` (builder+).

## Examples

```
+beat                            View your own pools.
+beat add                        Award yourself 1 Beat.
+beat add = Resolved Inspired    Award yourself 1 Beat with a logged reason.
+beat add Marcus = Took a risk   Award Marcus 1 Beat (builder+).
+beat add/arcane = Frenzy        Award yourself 1 Arcane Beat.
+beat sub Marcus                 Subtract 1 Beat from Marcus (correction).
```

## See also

- `help xp`, `help sheet`, `help cofd`
