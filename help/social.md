+social  -- Chronicles of Darkness Social Maneuvering (Core p.81-83).

Track a persistent social encounter between you and a subject: doors,
impression, leverage history, and capitulation.

Syntax:
  +social                                List your active maneuvers.
  +social/start <target>=<goal>          Open a maneuver with a stated goal.
  +social/impression <level> [for <t>]   Set impression. ST/canEdit.
  +social/door [<reason>] [for <t>]      Roll one door attempt.
  +social/soft <kind>=<text> [for <t>]   Soft leverage (aspiration|vice|gift).
  +social/hard [severe] <text> [for <t>] Hard leverage (threat/blackmail).
  +social/force [for <t>]                Force the doors -- one shot.
  +social/status [<target>]              Show the maneuver panel.
  +social/list                           Same as +social.
  +social/end [for <t>]                  Abandon the maneuver.

Permissions:
  View own              connected.
  Run own               connected (initiator is always you).
  Override impression   connected + canEdit on subject (ST/builder+).

Examples:
  +social/start Marcus=Loan me the grimoire
  +social/impression good for Marcus
  +social/soft aspiration=Help him achieve academic glory
  +social/door Pitch the offer
  +social/hard severe Threaten him at gunpoint
  +social/force
  +social/end

More:
  help social doors         Doors, contested rolls, and door penalties.
  help social impression    Impression levels and time-per-roll.
  help social leverage      Soft vs hard leverage rules.
  help social force         Forcing the doors: high-risk one-shot.

See also: roll, condition, aspiration, beat
