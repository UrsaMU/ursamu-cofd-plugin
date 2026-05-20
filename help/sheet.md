+sheet  -- View and edit Chronicles of Darkness character sheets.

Syntax:
  +sheet [<player>]                      View a character sheet.
  +sheet/set <trait>=<value>             Set a trait on your own sheet.
  +sheet/set <player>/<trait>=<v>        Set a trait on another sheet.
  +sheet/set specialty/<skill>=<name>    Add a skill specialty.
  +sheet/set specialty/<skill>=clear     Remove all specialties.
  +sheet/set <trait>=                    Reset a trait to template default.

Permissions:
  View                  connected.
  Edit own sheet        connected, after chargen submission.
  Edit other sheets     canEdit (builder+).

Settable traits:
  Identity      concept, virtue, vice
  Template      template (mortal, vampire, werewolf, mage, changeling)
  Attributes    9 CoFD attributes, 1-5
  Skills        24 CoFD skills, 0-5
  Specialties   specialty/<skill>=<name>
  Merits        by merit key. Instanced merits (Language, Contacts,
                Status, Allies, Mentor, etc.) take a qualifier:
                  +sheet/set language(spanish)=1
                  +sheet/set contacts(police)=2
                Multiple qualifiers under the same merit stack as
                separate purchases.
  Morality      humanity, harmony, wisdom, clarity, or integrity
  Power Stat    blood potency (bp), gnosis, wyrd, primal urge (pu)
  Energy        vitae, essence, mana, glamour
  Custom        clan, covenant, auspice, tribe, path, order, seeming, court
  Other         willpower, size

Examples:
  +sheet                              View your own sheet.
  +sheet Marcus                       View another player's sheet.
  +sheet/set strength=3               Set your Strength to 3.
  +sheet/set Marcus/clan=Ventrue      Set Marcus's Clan (builder+).
  +sheet/set specialty/athletics=Climbing
  +sheet/set athletics=               Reset Athletics to 0.

See also: cg, roll, health
