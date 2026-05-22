+attack  -- Resolve an attack against a target in the current encounter.
            Builds the dice pool, applies modifiers, rolls, and records
            damage automatically.

Syntax:
  +attack <target>
  +attack/<switch>[/<switch>...] <target>
  +attack/<switch> <target>=<bodypart>

Switches:
  /brawl          Strength + Brawl - target Defense (default unarmed).
  /melee          Strength + Weaponry - target Defense.
  /ranged         Dexterity + Firearms (Defense does not apply).
  /thrown         Dexterity + Athletics - target Defense.
  /allout         +2 pool; you lose all Defense for this turn.
  /charge         Move 2x Speed and attack. Lose all Defense.
  /aim            +1 die next turn (max +3 over three turns).
  /burst-short    Autofire: +1 pool, 3 rounds, one target only.
  /burst-med      Autofire: +2 pool, 10 rounds, up to 3 targets.
  /burst-long     Autofire: +3 pool, 20 rounds, any number of targets.
  /offhand        -2 pool for non-dominant hand attacks.
  /pull <n>       Pull blow: max damage cap n. Target gains +1 Def.
  /wp             Spend 1 Willpower for +3 dice.
  /specified      Target a body part. Use: +attack/specified <t>=<part>
  /touch          Dex+Brawl or Dex+Wpny to contact target; no damage.

Permissions:
  connected; must be a participant in an active encounter.

Examples:
  +attack Marcus                         Unarmed brawl vs Marcus.
  +attack/melee Marcus                   Weaponry attack vs Marcus.
  +attack/allout Marcus                  All-out brawl; lose Defense.
  +attack/ranged Marcus                  Firearms shot (no Defense sub).
  +attack/burst-short Marcus             Short autofire burst.
  +attack/burst-med Marcus=Cass,Jax      Medium burst, three targets.
  +attack/specified Marcus=head          Head shot (-3 pool).
  +attack/wp/allout Marcus               Willpower + all-out.

More:
  help attack defense        How Defense applies and degrades.
  help attack damage         Damage formula and lethal vs bashing.
  help combat modifiers      Full modifier table.
  help combat specified      Specified target body parts and Tilts.

See also: combat, grapple, dodge, reload, health, roll
