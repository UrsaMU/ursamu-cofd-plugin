+aspiration  -- View or modify a character's Aspirations. CoFD 2e
               characters carry up to three (3) active Aspirations at once.
               Fulfilling one awards 1 Beat and frees a slot for a new one.

Syntax:
  +aspiration                                   View your own list.
  +aspiration <player>                          View another player's list.
  +aspiration/add <text> [for <player>]         Add a short-term Aspiration.
  +aspiration/add/long <text> [for <player>]    Add a long-term Aspiration.
  +aspiration/remove <#> [for <player>]         Remove the slot at # (no Beat).
  +aspiration/fulfill <#> [for <player>]        Fulfill the slot and gain 1 Beat.

Switches:
  /add        Add a new Aspiration. Defaults to short-term.
  /add/long   Add a long-term Aspiration (campaign-scale goal).
  /remove     Drop the Aspiration at the numbered slot without awarding any
              Beats. Use this when an Aspiration is no longer playable.
  /fulfill    Fulfill the Aspiration at the numbered slot and award 1 Beat.

Permissions:
  View                connected.
  Modify own          connected.
  Modify other        connected + canEdit (builder+).

Mechanics:
  Active count       Max 3 active Aspirations at any time.
  Typical mix        2 short-term, 1 long-term (not enforced).
  Beat reward        1 Beat on fulfillment. Beats convert at 5:1 to
                     Experience (see +xp).
  Replacement        Players write a new Aspiration after one resolves;
                     the Storyteller approves it. The command does not
                     auto-write a replacement.

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
  +aspiration/add Help Marcus for Marcus Add to Marcus's sheet (builder+).

See also: condition, beat, xp, sheet, cofd
