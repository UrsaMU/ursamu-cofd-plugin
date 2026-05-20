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
