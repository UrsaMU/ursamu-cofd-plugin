+integrity  -- View Integrity, trigger a Breaking Point, or adjust the track.

Syntax:
  +integrity                                  View your own Integrity track.
  +integrity <player>                         View another player's track.
  +integrity/break <reason> [+/-N]            Self-trigger a Breaking Point.
  +integrity/break <player>=<reason> [+/-N]   ST-initiated for another player.
  +integrity/set <0-10> [for <player>]        ST: set Integrity rating directly.

Switches:
  /break      Roll Resolve + Composure to resist a triggering event.
  /set        Adjust the Integrity rating without a roll (staff).

Permissions:
  View          connected.
  Break self    connected.
  Break other   connected + canEdit (builder+).
  Set           connected for self, canEdit for other.

Mechanics:
  Pool is Resolve + Composure + Integrity-rating mod + optional situational
  modifier. Situational modifiers are capped at +/-5 per RAW. See:
    help integrity rating-mod   Integrity-rating-to-modifier table.
    help integrity situations   Sample situational modifiers (RAW p.74).
    help integrity outcomes     Success tiers and Condition awards.
    help integrity anchors      Virtue/Vice bonuses and Condition feed.

Examples:
  +integrity                          View your Integrity track.
  +integrity Marcus                   View Marcus's track.
  +integrity/break Saw a ghost -1     Self-trigger with -1 situational mod.
  +integrity/break Killed in self-defense -4
  +integrity/break Marcus=Watched a murder -3   ST roll for Marcus.
  +integrity/set 5 for Marcus         Staff: set Marcus to Integrity 5.

See also: condition, sheet, virtues, vices, touchstone
