+touchstone  -- View or set the Mask and Dirge Touchstones — the mortal
               anchors that bind a vampire to their lost humanity.
               Vampire-only.

Syntax:
  +touchstone                                  View your Touchstones.
  +touchstone <player>                         View another vampire's.
  +touchstone/mask <name> [for <player>]       Set the Mask Touchstone.
  +touchstone/dirge <name> [for <player>]      Set the Dirge Touchstone.
  +touchstone/clear-mask [for <player>]        Clear the Mask Touchstone.
  +touchstone/clear-dirge [for <player>]       Clear the Dirge Touchstone.

Switches:
  /mask         Set the Mask anchor: a mortal tied to the public persona
                and Mask Virtue. Keeps the vampire engaged with society.
  /dirge        Set the Dirge anchor: a mortal tied to the predatory
                self and Dirge Vice. Keeps the vampire feeling, even
                while monstrous.
  /clear-mask   Remove the Mask anchor (death, betrayal, severance).
  /clear-dirge  Remove the Dirge anchor.

Permissions:
  View                connected.
  Modify own          connected.
  Modify other        connected + canEdit (builder+).

Mechanics:
  Each vampire has two Touchstones — Mask and Dirge — chosen at chargen
  and replaceable in play with story-time. They mechanically and
  thematically gate Humanity:

    Both intact     Breaking-point rolls treat 9 as a re-roll (9-again).
                    Willpower may be regained by acting on Mask or Dirge.
    One lost        Drop to standard 10-again on breaking points.
    Both lost       -2 dice on every breaking-point roll. Humanity
                    cannot be regained through experiences.

  Losing a Touchstone (this command's clear-mask / clear-dirge, or any
  in-fiction loss) is itself a breaking point: by default the vampire
  loses 1 Humanity unless a degeneration roll succeeds. Replacing a
  Touchstone takes story-time and roleplay; it is not an instant action.

  Threatening a Touchstone in fiction (acting against them, or hearing
  them threatened) triggers a breaking-point check. Severing a
  Touchstone yourself is one of the harshest breaking points in the
  Requiem.

Examples:
  +touchstone                          View your own Touchstones.
  +touchstone Marcus                   View Marcus's Touchstones.
  +touchstone/mask Lia Martinez        Set your Mask anchor.
  +touchstone/dirge The Hunger I Hide  Set your Dirge anchor.
  +touchstone/clear-mask               Sever the Mask (Humanity risk).
  +touchstone/mask Father Reyes for Marcus
                                       Set Marcus's Mask (builder+).

See also: vitae, sheet, cofd
