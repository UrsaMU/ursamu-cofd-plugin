+sheet  -- View and edit Chronicles of Darkness character sheets.

Syntax:
  +sheet [<player>]                      View a character sheet.
  +sheet/set <trait>=<value>             Set a trait on your own sheet.
  +sheet/set <player>/<trait>=<v>        Set a trait on another sheet.
  +sheet/set specialty/<skill>=<name>    Add a skill specialty.
  +sheet/set specialty/<skill>=<name>: <description>
                                         Add a specialty with a short note.
  +sheet/set specialty/<skill>=          Remove all specialties.
  +sheet/set <trait>=                    Reset a trait to template default.
  +sheet/virtue [<player>] [= <reason>]  Virtue triggered: restore full WP.
  +sheet/vice   [<player>] [= <reason>]  Vice indulged: +1 WP.
  +sheet/rest   [<player>] [= <reason>]  Full night's rest: restore full WP.

Permissions:
  View                  connected.
  Edit own sheet        connected, after chargen submission.
  Edit other sheets     canEdit (builder+).
  Edit own Size         staff only (admin or builder).
  WP regen (others)     canEdit (builder+).

Examples:
  +sheet                              View your own sheet.
  +sheet Marcus                       View another player's sheet.
  +sheet/set strength=3               Set your Strength to 3.
  +sheet/set Marcus/clan=Ventrue      Set Marcus's Clan (builder+).
  +sheet/set specialty/athletics=Climbing
  +sheet/set specialty/brawl=Boxing: southpaw stance
  +sheet/set athletics=               Reset Athletics to 0.
  +sheet/virtue = Stood up to the prince
  +sheet/vice = One drink too many at the gala
  +sheet/rest                         Full night's rest.

More:
  help sheet traits          Settable trait categories and qualifiers.
  help sheet willpower       Willpower regeneration rules.
  help sheet size            Size, Speed, and Health track math.
  help sheet specialties     Specialty syntax and description notes.

See also: cg, roll, health, virtues, vices
