// Pure modifier stack for CoFD 2e attack resolution.
// Takes attack options and returns a ModifierSet that the pool builder
// or attack command can apply.

export interface AttackOptions {
  pool?: "unarmed" | "melee" | "ranged" | "thrown";
  allOut?: boolean;
  charge?: boolean;
  aim?: number;           // 0-3 accumulated aim bonus
  offhand?: boolean;
  pulling?: { max: number };
  burstShort?: boolean;
  burstMed?: boolean;
  burstLong?: boolean;
  intoMelee?: number;     // number of bystanders avoided
  concealment?: 1 | 2 | 3;
  targetConcealment?: 1 | 2 | 3;
  targetCover?: number;   // cover Durability (used as pool penalty)
  targetProne?: boolean;
  targetSurprised?: boolean;
  specified?: "torso" | "arm" | "leg" | "head" | "heart" | "hand" | "eye";
}

export interface ModifierSet {
  /** Bonus or penalty to the dice pool total. */
  poolMod: number;
  /**
   * Modification to the target's Defense for this attack.
   * Positive means target's Defense is effectively reduced by this much (but
   * all-out/charge bypass is handled separately via targetDefenseOverride).
   */
  targetDefenseMod: number;
  /**
   * Dice penalty from the target's cover (Durability subtracted from pool).
   * Stored separately so the command can show it distinctly in output.
   */
  coverMod: number;
  /** When true the target's Defense is completely bypassed (surprise). */
  targetSurprised: boolean;
  /** When true the attacker loses their own Defense next turn (all-out / charge). */
  attackerLosesDefense: boolean;
}

/** Penalty from shooting into melee to avoid bystanders. */
function intoMeleePenalty(bystanders: number): number {
  if (bystanders <= 0) return 0;
  return -2 * bystanders;
}

/** Bonus / penalty from the target's concealment level when firing back.
 * Per core rules a target in cover suffers the same cover as a penalty to
 * return fire (-1 less than their own cover level). */
function concealmentPenalty(level: 1 | 2 | 3 | undefined): number {
  if (!level) return 0;
  // Level 1: -1  Level 2: -2  Level 3: -3
  return -level;
}

/** Penalty for a specified target location. */
function specifiedPenalty(
  specified: AttackOptions["specified"],
): number {
  if (!specified) return 0;
  switch (specified) {
    case "torso":
      return -1;
    case "arm":
    case "leg":
    case "hand":
      return -2;
    case "head":
      return -3;
    case "heart":
      return -4;
    case "eye":
      return -5;
  }
}

/**
 * Calculate the full modifier set for one attack.
 */
export function buildModifiers(opts: AttackOptions): ModifierSet {
  let poolMod = 0;
  let targetDefenseMod = 0;
  const coverMod = -(opts.targetCover ?? 0);
  let attackerLosesDefense = false;

  // All-out attack: +2 dice, attacker loses Defense.
  if (opts.allOut) {
    poolMod += 2;
    attackerLosesDefense = true;
  }

  // Charge: +2 dice, attacker loses Defense (stacks with all-out: pick the
  // better of the two bonuses rather than double-adding; RAW they share the
  // "lose Defense" cost, so we cap the combined bonus at +2 if both are set).
  if (opts.charge) {
    if (!opts.allOut) {
      poolMod += 2;
    }
    attackerLosesDefense = true;
  }

  // Aim: 0-3 stacked bonus from prior aim action.
  if (opts.aim && opts.aim > 0) {
    poolMod += Math.min(3, opts.aim);
  }

  // Off-hand: -2.
  if (opts.offhand) {
    poolMod -= 2;
  }

  // Pulling blow: +1 to target's effective Defense, damage capped by max.
  if (opts.pulling) {
    targetDefenseMod += 1;
  }

  // Autofire.
  if (opts.burstShort) {
    poolMod += 1;
  } else if (opts.burstMed) {
    poolMod += 2;
  } else if (opts.burstLong) {
    poolMod += 3;
  }

  // Shooting into melee to avoid bystanders.
  if (opts.intoMelee) {
    poolMod += intoMeleePenalty(opts.intoMelee);
  }

  // Target concealment (shooter trying to hit a concealed target).
  if (opts.targetConcealment) {
    poolMod += concealmentPenalty(opts.targetConcealment);
  }

  // Target prone: -2 to ranged attacks, +2 to melee.
  if (opts.targetProne) {
    const isRanged = opts.pool === "ranged";
    poolMod += isRanged ? -2 : 2;
  }

  // Specified target location.
  poolMod += specifiedPenalty(opts.specified);

  return {
    poolMod,
    targetDefenseMod,
    coverMod,
    targetSurprised: opts.targetSurprised === true,
    attackerLosesDefense,
  };
}
