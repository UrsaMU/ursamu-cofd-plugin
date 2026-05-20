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
  /allout         +2 pool; you lose all Defense for this turn. Cannot
                  combine with /charge.
  /charge         Move up to 2x Speed and attack in one action. Lose
                  all Defense. Cannot combine with /allout.
  /aim            Declare aiming this turn for +1 die next turn (max +3).
                  Incompatible with autofire switches.
  /burst-short    Autofire: +1 pool, 3 rounds, one target only.
  /burst-med      Autofire: +2 pool, 10 rounds, up to 3 targets.
                  Extra targets listed after = separated by commas.
  /burst-long     Autofire: +3 pool, 20 rounds, any number of targets.
  /offhand        -2 pool for non-dominant hand attacks.
  /pull <n>       Pull blow: set max damage cap to n. Target gains +1 Def.
  /wp             Spend 1 Willpower for +3 dice.
  /specified      Target a body part. Use: +attack/specified <t>=<part>
  /touch          Dex+Brawl or Dex+Wpny to contact target; no damage.

Defense:
  Defense is automatically subtracted from the pool (unarmed, melee,
  thrown). Each successive attack against the same character degrades
  their Defense by 1 for the rest of the turn.
  Defense does not apply to Firearms attacks (+attack/ranged).

Damage:
  Damage = successes rolled + weapon modifier.
  All weapons deal lethal damage by default.
  Use /pull to force bashing damage (Willpower spend required for weapons).

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
  help combat modifiers      Full modifier table.
  help combat specified      Specified target body parts and Tilts.

See also: combat, grapple, dodge, reload, health, roll
