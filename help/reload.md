+reload  -- Reload the currently equipped firearm. Also available as
            +gear/reload. Reloading costs an instant action.

Syntax:
  +reload                              Reload your equipped firearm.
  +reload <weapon>                     Reload a named weapon from gear.

Mechanics:
  Reloading is an instant action.

  Speed of reload depends on ammunition method:
    Magazine or speed loader:
      Reload without losing Defense for the turn.
    Loading rounds individually (tube magazine, revolver cylinder):
      You cannot apply Defense on the same turn you reload.

  The system deducts the appropriate round count from your carried
  ammunition. If you have no spare ammunition, the command fails with
  a message.

  Firearms track current and maximum capacity. Use +gear to inspect
  ammo counts:
    +gear                     View all carried equipment and ammo.
    +gear/reload              Alias for +reload (equipped weapon).

Autofire ammo costs:
  Short burst     3 rounds
  Medium burst    10 rounds
  Long burst      20 rounds
  Covering fire   10 rounds

Permissions:
  connected; must be a participant in an active encounter or carrying
  the weapon in gear.

Examples:
  +reload                    Reload equipped firearm.
  +reload Glock              Reload weapon named Glock.

See also: attack, gear, combat
