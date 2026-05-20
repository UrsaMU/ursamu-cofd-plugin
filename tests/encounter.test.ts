// Tests for the Phase B combat encounter subsystem.
// DBO("cofd.encounters") uses an in-memory NeDB during tests.

import { assert, assertEquals, assertNotEquals } from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";
import {
  addParticipant,
  advanceTurn,
  applyDefense,
  createEncounter,
  getEncounterForRoom,
  removeParticipant,
  roll1d10,
  rollInitiative,
  setDodge,
} from "../src/combat/encounter.ts";
import { mockPlayer, mockU, MockObjectStore } from "./helpers/mockU.ts";
import { defaultSheet } from "../src/stats/index.ts";

const OPTS = { sanitizeResources: false, sanitizeOps: false };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock IUrsamuSDK that can provide actor lookups from a store. */
function makeStore() {
  return new MockObjectStore();
}

function makeU(store: MockObjectStore, meOverrides = {}) {
  const me = mockPlayer({ id: "actor-1", name: "Alice", ...meOverrides });
  return mockU({ me, objectStore: store });
}

/** Seed an actor with a CoFD sheet into the store. */
function seedActor(
  store: MockObjectStore,
  id: string,
  name: string,
  attrs: Record<string, number> = {},
) {
  const sheet = defaultSheet();
  sheet.attributes.Dexterity = attrs.Dexterity ?? 2;
  sheet.attributes.Composure = attrs.Composure ?? 2;
  const obj = store.create({ id, name, flags: new Set(["player", "connected"]), state: { cofd: sheet } });
  // MockObjectStore assigns its own id; patch it.
  (obj as any).id = id;
  (store as any).store.delete(obj.id);
  (store as any).store.set(id, obj);
  return obj;
}

// ---------------------------------------------------------------------------
// createEncounter
// ---------------------------------------------------------------------------

describe("createEncounter", OPTS, () => {
  it("returns an encounter with intent status and no participants", async () => {
    const enc = await createEncounter("room-1");
    assertEquals(enc.roomId, "room-1");
    assertEquals(enc.status, "intent");
    assertEquals(enc.participants.length, 0);
    assertEquals(enc.round, 0);
  });

  it("stores encounter retrievable by getEncounterForRoom", async () => {
    const roomId = `room-findme-${Date.now()}`;
    const enc = await createEncounter(roomId);
    const found = await getEncounterForRoom(roomId);
    assert(found, "encounter should be found");
    assertEquals(found.id, enc.id);
  });

  it("getEncounterForRoom returns null when no encounter", async () => {
    const found = await getEncounterForRoom("room-no-encounter");
    assertEquals(found, null);
  });
});

// ---------------------------------------------------------------------------
// addParticipant / removeParticipant
// ---------------------------------------------------------------------------

describe("addParticipant", OPTS, () => {
  it("adds a participant to the encounter", async () => {
    const enc = await createEncounter("room-join-1");
    const actor = mockPlayer({ id: "p1", name: "Bob" });
    const updated = await addParticipant(enc.id, actor);
    assert(updated);
    assertEquals(updated.participants.length, 1);
    assertEquals(updated.participants[0].actorId, "p1");
    assertEquals(updated.participants[0].name, "Bob");
  });

  it("does not duplicate a participant already in the encounter", async () => {
    const enc = await createEncounter("room-join-2");
    const actor = mockPlayer({ id: "p2", name: "Carol" });
    await addParticipant(enc.id, actor);
    const updated = await addParticipant(enc.id, actor);
    assert(updated);
    assertEquals(updated.participants.length, 1);
  });
});

describe("removeParticipant", OPTS, () => {
  it("removes a participant from the encounter", async () => {
    const enc = await createEncounter("room-leave-1");
    const actor = mockPlayer({ id: "p3", name: "Dave" });
    await addParticipant(enc.id, actor);
    const result = await removeParticipant(enc.id, "p3");
    assert(result);
    assertEquals(result.encounter.participants.length, 0);
  });

  it("returns wasActive=false when encounter is not active", async () => {
    const enc = await createEncounter("room-leave-2");
    const a = mockPlayer({ id: "p4", name: "Eve" });
    await addParticipant(enc.id, a);
    const result = await removeParticipant(enc.id, "p4");
    assert(result);
    assertEquals(result.wasActive, false);
  });
});

// ---------------------------------------------------------------------------
// rollInitiative
// ---------------------------------------------------------------------------

describe("rollInitiative", OPTS, () => {
  it("sets status to active and round to 1", async () => {
    const store = makeStore();
    const u = makeU(store);
    const enc = await createEncounter("room-init-1");
    const a = seedActor(store, "init-p1", "Alice", { Dexterity: 3, Composure: 2 });
    const b = seedActor(store, "init-p2", "Bob", { Dexterity: 2, Composure: 3 });
    await addParticipant(enc.id, a);
    await addParticipant(enc.id, b);

    // Wire u.db.get to return from the store.
    (u.db as any).search = async (q: Record<string, unknown>) => {
      if (q.id) return [(store as any).store.get(q.id)].filter(Boolean);
      return (store as any).search(q);
    };

    const updated = await rollInitiative(enc.id, u);
    assert(updated);
    assertEquals(updated.status, "active");
    assertEquals(updated.round, 1);
    assertEquals(updated.turnIdx, 0);
    assertEquals(updated.participants.length, 2);
  });

  it("participants are sorted by initiative descending", async () => {
    const store = makeStore();
    const u = makeU(store);

    const enc = await createEncounter("room-init-order");
    const low = seedActor(store, "low-p", "LowInit", { Dexterity: 1, Composure: 1 });
    const high = seedActor(store, "high-p", "HighInit", { Dexterity: 5, Composure: 5 });
    await addParticipant(enc.id, low);
    await addParticipant(enc.id, high);

    (u.db as any).search = async (q: Record<string, unknown>) => {
      if (q.id) return [(store as any).store.get(q.id)].filter(Boolean);
      return (store as any).search(q);
    };

    // Run initiative several times to confirm high always beats low statistically.
    let highFirst = 0;
    for (let trial = 0; trial < 20; trial++) {
      // Re-add participants to a fresh encounter to avoid carryover.
      const trial_enc = await createEncounter(`room-init-order-${trial}`);
      await addParticipant(trial_enc.id, low);
      await addParticipant(trial_enc.id, high);
      const out = await rollInitiative(trial_enc.id, u);
      if (out && out.participants[0].actorId === "high-p") highFirst++;
    }
    // With Dex+Comp=10 vs 2, high should win most of the time.
    assert(highFirst >= 14, `expected high to win most trials, got ${highFirst}/20`);
  });
});

// ---------------------------------------------------------------------------
// advanceTurn
// ---------------------------------------------------------------------------

describe("advanceTurn", OPTS, () => {
  it("increments turnIdx by 1 within a round", async () => {
    const store = makeStore();
    const u = makeU(store);
    const enc = await createEncounter("room-adv-1");
    const a = seedActor(store, "adv-p1", "A");
    const b = seedActor(store, "adv-p2", "B");
    await addParticipant(enc.id, a);
    await addParticipant(enc.id, b);
    (u.db as any).search = async (q: Record<string, unknown>) => {
      if (q.id) return [(store as any).store.get(q.id)].filter(Boolean);
      return (store as any).search(q);
    };
    await rollInitiative(enc.id, u);

    const after = await advanceTurn(enc.id);
    assert(after);
    assertEquals(after.turnIdx, 1);
    assertEquals(after.round, 1);
  });

  it("wraps turnIdx to 0 and increments round at end of round", async () => {
    const store = makeStore();
    const u = makeU(store);
    const enc = await createEncounter("room-adv-wrap");
    const a = seedActor(store, "wrap-p1", "A");
    const b = seedActor(store, "wrap-p2", "B");
    await addParticipant(enc.id, a);
    await addParticipant(enc.id, b);
    (u.db as any).search = async (q: Record<string, unknown>) => {
      if (q.id) return [(store as any).store.get(q.id)].filter(Boolean);
      return (store as any).search(q);
    };
    await rollInitiative(enc.id, u);

    // Advance past both participants.
    await advanceTurn(enc.id);  // turnIdx -> 1
    const wrapped = await advanceTurn(enc.id); // turnIdx -> 0, round -> 2
    assert(wrapped);
    assertEquals(wrapped.turnIdx, 0);
    assertEquals(wrapped.round, 2);
  });

  it("resets appliedDefense to 0 for all participants at round wrap", async () => {
    const store = makeStore();
    const u = makeU(store);
    const enc = await createEncounter("room-def-reset");
    const a = seedActor(store, "def-p1", "A");
    const b = seedActor(store, "def-p2", "B");
    await addParticipant(enc.id, a);
    await addParticipant(enc.id, b);
    (u.db as any).search = async (q: Record<string, unknown>) => {
      if (q.id) return [(store as any).store.get(q.id)].filter(Boolean);
      return (store as any).search(q);
    };
    await rollInitiative(enc.id, u);

    // Apply defense to one participant.
    await applyDefense(enc.id, "def-p1");
    // Advance past both to trigger a round wrap.
    await advanceTurn(enc.id);
    const after = await advanceTurn(enc.id);
    assert(after);
    for (const p of after.participants) {
      assertEquals(p.appliedDefense, 0, `appliedDefense should reset at round wrap for ${p.name}`);
    }
  });
});

// ---------------------------------------------------------------------------
// applyDefense / setDodge
// ---------------------------------------------------------------------------

describe("applyDefense", OPTS, () => {
  it("increments appliedDefense by 1 each call", async () => {
    const enc = await createEncounter("room-applydef");
    const a = mockPlayer({ id: "def-actor", name: "A" });
    await addParticipant(enc.id, a);
    await applyDefense(enc.id, "def-actor");
    const result = await applyDefense(enc.id, "def-actor");
    assert(result);
    const p = result.participants.find((x) => x.actorId === "def-actor")!;
    assertEquals(p.appliedDefense, 2);
  });
});

describe("setDodge", OPTS, () => {
  it("marks participant as dodging", async () => {
    const enc = await createEncounter("room-dodge");
    const a = mockPlayer({ id: "dodge-actor", name: "A" });
    await addParticipant(enc.id, a);
    const result = await setDodge(enc.id, "dodge-actor", true);
    assert(result);
    const p = result.participants.find((x) => x.actorId === "dodge-actor")!;
    assertEquals(p.isDodging, true);
  });

  it("clears dodge flag when set to false", async () => {
    const enc = await createEncounter("room-undodge");
    const a = mockPlayer({ id: "undodge-actor", name: "A" });
    await addParticipant(enc.id, a);
    await setDodge(enc.id, "undodge-actor", true);
    const result = await setDodge(enc.id, "undodge-actor", false);
    assert(result);
    const p = result.participants.find((x) => x.actorId === "undodge-actor")!;
    assertEquals(p.isDodging, false);
  });
});

// ---------------------------------------------------------------------------
// removeParticipant auto-advance (was active turn)
// ---------------------------------------------------------------------------

describe("removeParticipant when it is their turn", OPTS, () => {
  it("turnIdx adjusts so the next player is in slot 0 after removal of slot 0", async () => {
    const store = makeStore();
    const u = makeU(store);
    const roomId = `room-rm-active-${crypto.randomUUID()}`;
    const enc = await createEncounter(roomId);
    const uid = crypto.randomUUID().slice(0, 8);
    const a = seedActor(store, `rm-p1-${uid}`, "A");
    const b = seedActor(store, `rm-p2-${uid}`, "B");
    await addParticipant(enc.id, a);
    await addParticipant(enc.id, b);
    (u.db as any).search = async (q: Record<string, unknown>) => {
      if (q.id) return [(store as any).store.get(q.id)].filter(Boolean);
      return (store as any).search(q);
    };
    await rollInitiative(enc.id, u);

    // Check current actor.
    const live = await getEncounterForRoom(roomId);
    assert(live);
    const currentActorId = live.participants[live.turnIdx].actorId;
    const result = await removeParticipant(enc.id, currentActorId);
    assert(result);
    assertEquals(result.wasActive, true);
    // After removal, turnIdx should still be valid.
    const remaining = result.encounter.participants.length;
    assert(result.encounter.turnIdx < remaining || remaining === 0);
  });
});

// ---------------------------------------------------------------------------
// roll1d10
// ---------------------------------------------------------------------------

describe("roll1d10", OPTS, () => {
  it("always returns a value between 1 and 10 inclusive", () => {
    for (let i = 0; i < 200; i++) {
      const r = roll1d10();
      assert(r >= 1 && r <= 10, `Expected 1-10, got ${r}`);
    }
  });
});
