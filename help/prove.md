+prove  -- Show your trait values to another player or the whole room.
          Players cannot see each others' sheets, so +prove is the
          tamper-evident way to surface specific traits in play. Output
          is a PROVE>> system line built from your live sheet and cannot
          be faked with @emit or pose.

Syntax:
  +prove <trait>                         Broadcast one trait to the room.
  +prove <trait>,<trait>,...             Broadcast a comma-separated list.
  +prove <trait>[,<trait>]=<player>      Whisper to one player.
  +prove/here <trait>[,<trait>]          Force a room broadcast.

Switches:
  /here     Always broadcast to the room (default when no =<player>).

Mechanics:
  Trait list is comma-separated. Accepted vocabulary mirrors +roll:
    Attributes:   strength, dexterity, stamina, wits, composure, ...
    Skills:       athletics, brawl, weaponry, persuasion, ...
    Specialties:  skill/spec form, e.g. brawl/boxing (renders as base+1).
    Willpower:    willpower or wp.
    Morality:     integrity, humanity, clarity, etc. (template-specific).
    Power Stat:   blood potency (or bp), primal urge (or pu), wyrd, ...
    Powers:       any template power your sheet has -- vigor, forces,
                  mind, dominate, etc.
  Max 8 traits per command. Unknown tokens are skipped with a quiet note
  appended to your confirmation line.

Permissions:
  Use            connected.
  Cannot prove   another player's sheet -- +prove only reads your own.

Examples:
  +prove strength                          Broadcast Strength to the room.
  +prove strength,athletics,brawl/boxing   Broadcast three traits.
  +prove subterfuge=Marcus                 Whisper Subterfuge to Marcus.
  +prove vigor,blood potency=Lyra          Whisper two supernatural traits.
  +prove/here resolve,composure            Explicit room broadcast.

See also: sheet, roll, cofd
