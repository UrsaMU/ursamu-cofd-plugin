// Vampire: The Requiem 2e overlay data.
//
// Loads enriched static data from templates/vampire.json — Banes, Disciplines,
// and the Blood Potency table — and exposes typed helpers for sheet sections,
// commands, and tests. Pure module: no `u.*` SDK dependencies.

export interface VampireBane {
  name: string;
  description: string;
}

export interface VampireDisciplineLevel {
  dot: number;
  name: string;
  summary: string;
}

export interface VampireDiscipline {
  key: string;
  name: string;
  signature: boolean;
  vitaeBaseCost: number;
  dicePool: string;
  levels: VampireDisciplineLevel[];
}

export interface BloodPotencyEntry {
  bp: number;
  maxVitae: number;
  maxPerTurn: number;
  minHumanity: number;
  bloodRequired: string;
}

// Resolve the vampire template JSON dynamically (walk up two levels to project root).
const vampireUrl = new URL("../../templates/vampire.json", import.meta.url);
const vampireData = JSON.parse(Deno.readTextFileSync(vampireUrl)) as {
  banes?: Record<string, VampireBane>;
  disciplines?: Record<string, Omit<VampireDiscipline, "key">>;
  bloodPotency?: BloodPotencyEntry[];
};

/** Clan-key (lowercase) -> Bane definition. */
export const VAMPIRE_BANES: Record<string, VampireBane> = Object.freeze({
  ...(vampireData.banes ?? {}),
});

/** Discipline-key (lowercase) -> full Discipline record. */
export const VAMPIRE_DISCIPLINES: Record<string, VampireDiscipline> = (() => {
  const out: Record<string, VampireDiscipline> = {};
  const src = vampireData.disciplines ?? {};
  for (const [key, entry] of Object.entries(src)) {
    out[key] = {
      key,
      name: entry.name,
      signature: entry.signature,
      vitaeBaseCost: entry.vitaeBaseCost,
      dicePool: entry.dicePool,
      levels: entry.levels.map((l) => ({ ...l })),
    };
  }
  return Object.freeze(out);
})();

/** Indexed Blood Potency table; index = BP rating, 0..10. */
export const BLOOD_POTENCY: BloodPotencyEntry[] = (() => {
  const src = vampireData.bloodPotency ?? [];
  const out: BloodPotencyEntry[] = [];
  for (const row of src) {
    out[row.bp] = { ...row };
  }
  return Object.freeze(out) as BloodPotencyEntry[];
})();

/** Look up a clan's Bane. Returns undefined for unknown clans. */
export function getBane(clanKey: string): VampireBane | undefined {
  if (!clanKey) return undefined;
  return VAMPIRE_BANES[clanKey.toLowerCase().trim()];
}

/**
 * Look up the Blood Potency row for a BP rating.
 * Clamps to the table range (0..10) so callers always get a valid entry.
 */
export function getBloodPotencyEntry(bp: number): BloodPotencyEntry {
  const idx = Math.max(0, Math.min(10, Math.floor(bp ?? 0)));
  return BLOOD_POTENCY[idx] ?? BLOOD_POTENCY[0];
}

/** Look up a Discipline by key. Returns undefined for unknown keys. */
export function getDiscipline(key: string): VampireDiscipline | undefined {
  if (!key) return undefined;
  return VAMPIRE_DISCIPLINES[key.toLowerCase().trim()];
}

/**
 * True if the spend amount is within the per-turn cap for the given BP.
 * Used by +vitae/spend; we don't model turn state yet, so this is a soft
 * advisory check.
 */
export function withinPerTurnCap(bp: number, spend: number): boolean {
  const row = getBloodPotencyEntry(bp);
  return spend <= row.maxPerTurn;
}
