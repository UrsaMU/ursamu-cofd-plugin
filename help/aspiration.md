+aspiration  -- View or modify a character's Aspirations. Each character
               carries up to three (3) active Aspirations at once.
               Fulfilling one awards 1 Beat and frees a slot.

Syntax:
  +aspiration                                   View your own list.
  +aspiration <player>                          View another player's list.
  +aspiration/add <text> [for <player>]         Add a short-term Aspiration.
  +aspiration/add/long <text> [for <player>]    Add a long-term Aspiration.
  +aspiration/remove <#> [for <player>]         Remove the slot at # (no Beat).
  +aspiration/fulfill <#> [for <player>]        Fulfill slot # and gain 1 Beat.

Permissions:
  View                connected.
  Modify own          connected.
  Modify other        connected + canEdit (builder+).

Mechanics:
  Max 3 active Aspirations at any time. Typical mix is 2 short-term
  and 1 long-term, not enforced. Fulfilling one awards 1 Beat (Beats
  convert at 5:1 to Experience -- see +xp). Players write a new
  Aspiration after one resolves; the ST approves it. The command
  does not auto-write a replacement.

  Display tags:
    [S]   Short-term Aspiration.
    [L]   Long-term Aspiration.

Examples:
  +aspiration                            View your own list.
  +aspiration Marcus                     View Marcus's list.
  +aspiration/add Win Marco's trust      Short-term, on your sheet.
  +aspiration/add/long Avenge my sister  Long-term, on your sheet.
  +aspiration/remove 2                   Drop slot 2, no Beat awarded.
  +aspiration/fulfill 1                  Fulfill slot 1 and earn 1 Beat.
  +aspiration/add Help Marcus for Marcus Builder+: add to Marcus's sheet.

See also: condition, beat, xp, sheet, cofd
