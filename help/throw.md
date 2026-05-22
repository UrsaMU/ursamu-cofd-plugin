+throw  -- Throw a grenade (AoE) or an aerodynamic weapon at a target.

Syntax:
  +throw <item-key>                Throw a grenade. Damages every other
                                   participant in the encounter.
  +throw <item-key> at <target>    Throw an aerodynamic weapon at one
                                   target (knife, shuriken, throwing-knife).
  +throw/<switch> <item-key>       Stackable switches; see below.

Switches:
  /fratricide        Include the thrower in the blast.
  /willpower (/wp)   Spend 1 Willpower for +3 dice.
  /into-melee[=<n>]  -n dice to avoid hitting bystanders.
  /cover             Not yet implemented. (TODO cover system.)

Permissions:
  Throw              connected. Must be your turn in an active encounter.
  Apply damage       canEdit on each target (builder+ for cross-player).

Mechanics:
  Attack roll        Dexterity + Athletics.
  Grenades           Aimed at the encounter zone, not a target. Every
                     participant rolls Stamina against the throw successes.
  Blast damage       Successes > Stamina -- full force damage (lethal).
                     Successes = Stamina -- half force (round down).
                     Successes < Stamina -- target evades the blast.
  Tilts              Stun grenade applies Stunned to everyone hit.
                     Smoke grenade applies Blinded.
                     Frag / molotov apply Knocked-Down when damage >= Size.
                     Molotov also burns (announced; no tilt key yet).
  Ammo               Grenades are consumed (clip 1) on use.

Examples:
  +throw grenade-frag                 Frag the room.
  +throw grenade-stun                 Flashbang every participant.
  +throw grenade-smoke                Blind the room.
  +throw grenade-molotov              Set the room on fire.
  +throw shuriken at Marcus           Throw a shuriken at Marcus.
  +throw/fratricide grenade-molotov   Include yourself in the blast.
  +throw/wp grenade-frag              Spend 1 WP and throw.
  +throw/into-melee=2 grenade-frag    -2 dice to avoid bystanders.

See also: attack, combat, gear, tilt
