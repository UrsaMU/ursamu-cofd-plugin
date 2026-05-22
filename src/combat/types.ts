// Combat encounter types for CoFD 2e Phase B.

export type EncounterStatus = "intent" | "active" | "resolved";

/** One actor's slot in an encounter initiative order. */
export interface Participant {
  actorId: string;
  name: string;
  /** Initiative roll result (1d10 + Dex + Composure + weapon modifier). */
  initiative: number;
  /** How many attacks this participant has applied Defense against this round. */
  appliedDefense: number;
  /** True if the participant declared a Dodge action this round. */
  isDodging: boolean;
  /** True if incapacitated (Incapacitated health state). */
  isOut: boolean;
  /** Durability of cover the participant is behind (subtracted from attacker pool). 0-3. */
  cover?: number;
  /** Concealment level (1=light, 2=medium, 3=heavy). 0 / undefined means none. */
  concealment?: number;
  /** Actor id of the suppressor who currently has this participant pinned. */
  pinnedBy?: string;
  /** True while the participant has declared a non-violent surrender. */
  surrendered?: boolean;
  /** True if the participant has used their move action this round. */
  movedThisRound?: boolean;
  /** True if the participant is currently in the Beaten Down condition. */
  beatenDown?: boolean;
  /** True once the participant has used their one instant action this turn. */
  actionUsed?: boolean;
  /** True while the participant has Delayed their action this round. */
  delayed?: boolean;
  /** True if the participant chose to Run this turn (consumes instant slot, -1 Defense). */
  ran?: boolean;
}

/** A live combat encounter anchored to a room. */
export interface Encounter {
  id: string;
  roomId: string;
  round: number;
  /** Index into participants[] pointing at whose turn it currently is. */
  turnIdx: number;
  participants: Participant[];
  status: EncounterStatus;
  createdAt: number;
}
