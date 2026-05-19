roll mechanics  -- Detailed rules for +roll resolution.

Success and again:
  Success         Any die showing 8, 9, or 10.
  10-again        Tens count as successes and reroll. Chains.
  9-again         Reroll any die showing 9 or 10. Chains while the new
                  die also meets the threshold.
  8-again         Reroll any die showing 8, 9, or 10.

Rote:
  Reroll every initial failure (1-7) once. Rerolls still obey the
  active n-again threshold but do not themselves rote.

Chance die:
  Pool <= 0 rolls a single d10.
    Success only on 10.
    A 1 is a Dramatic Failure.
  Chance dice ignore /rote, /9again, /8again.

Outcomes:
  Failure         Zero successes.
  Success         One or more.
  Exceptional     5 or more successes. Triggers the Inspired condition
                  (or template-specific equivalent).
  Dramatic Fail   See chance die above.

Wound penalty:
  Applied automatically based on Health damage. Raw numeric pools
  (+roll 6) skip the penalty. See help health.

Untrained skill penalty:
  Mental skills            -3 dice (Academics, Computer, Crafts,
                           Investigation, Medicine, Occult, Politics,
                           Science).
  Physical / Social        -1 die.

See also: roll, health, sheet
