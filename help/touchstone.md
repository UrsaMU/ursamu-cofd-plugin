+touchstone  -- View or set the Mask and Dirge Touchstones, the mortal
               anchors that bind a vampire to their lost humanity.
               Vampire-only.

Syntax:
  +touchstone                                  View your Touchstones.
  +touchstone <player>                         View another vampire's.
  +touchstone/mask <name> [for <player>]       Set the Mask anchor.
  +touchstone/dirge <name> [for <player>]      Set the Dirge anchor.
  +touchstone/clear-mask [for <player>]        Clear the Mask.
  +touchstone/clear-dirge [for <player>]       Clear the Dirge.

Switches:
  /mask          Set the Mask anchor: a mortal tied to public persona
                 and Mask Virtue. Keeps the vampire engaged.
  /dirge         Set the Dirge anchor: a mortal tied to predatory self
                 and Dirge Vice. Keeps the vampire feeling.
  /clear-mask    Remove the Mask (death, betrayal, severance).
  /clear-dirge   Remove the Dirge.

Permissions:
  View                connected.
  Modify own          connected.
  Modify other        connected + canEdit (builder+).

Examples:
  +touchstone                          View your Touchstones.
  +touchstone/mask Lia Martinez        Set your Mask anchor.
  +touchstone/dirge The Hunger I Hide  Set your Dirge anchor.
  +touchstone/clear-mask               Sever the Mask (Humanity risk).
  +touchstone/mask Father Reyes for Marcus     Builder+.

More:
  help touchstone mechanics            Humanity link, breaking points.

See also: vitae, sheet, cofd
