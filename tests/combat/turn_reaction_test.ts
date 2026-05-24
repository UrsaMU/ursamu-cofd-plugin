// /reaction ambush sets the participant.reactionPosture and is consumed by
// the azlu archetype reading aiState.revealed transitions.

import { assertEquals, assert } from "@std/assert";
import {
  addParticipant,
  createEncounter,
  encounterDb,
} from "../../src/combat/encounter.ts";
import { turnExec } from "../../src/commands/turn.ts";
import { mockU, MockObjectStore } from "../helpers/mockU.ts";
import { defaultSheet } from "../../src/stats/index.ts";

const OPTS = { sanitizeResources: false, sanitizeOps: false };

function seedPC(store: MockObjectStore, id: string, name: string) {
  const sheet = defaultSheet();
  const obj = store.create({
    id, name,
    flags: new Set<string>(["player", "connected"]),
    state: { cofd: sheet },
  });
  // deno-lint-ignore no-explicit-any
  (obj as any).id = id;
  // deno-lint-ignore no-explicit-any
  (store as any).store.delete(obj.id);
  // deno-lint-ignore no-explicit-any
  (store as any).store.set(id, obj);
  return obj;
}

Deno.test("+turn/reaction ambush sets the participant posture", OPTS, async () => {
  const store = new MockObjectStore();
  const me = seedPC(store, "pc1", "Alice");
  const u = mockU({ objectStore: store });
  // Patch u.me to the seeded actor with the correct id.
  // deno-lint-ignore no-explicit-any
  (u as any).me = me;
  const roomId = "room-react-" + crypto.randomUUID();
  // deno-lint-ignore no-explicit-any
  (u as any).here = { id: roomId, broadcast: () => {} };

  const enc = await createEncounter(roomId);
  await addParticipant(enc.id, me as Parameters<typeof addParticipant>[1]);
  // deno-lint-ignore no-explicit-any
  const fresh = await encounterDb.findOne({ id: enc.id } as any);
  assert(fresh);
  // deno-lint-ignore no-explicit-any
  await encounterDb.update({ id: enc.id } as any, { ...fresh, status: "active" });

  // deno-lint-ignore no-explicit-any
  (u as any).cmd = { name: "+turn", original: "+turn/reaction ambush", args: ["reaction", "ambush"], switches: [] };
  const sent: string[] = [];
  // deno-lint-ignore no-explicit-any
  (u as any).send = (m: string) => sent.push(m);
  await turnExec(u as unknown as Parameters<typeof turnExec>[0]);
  console.log("DEBUG sent:", sent);
  console.log("DEBUG u.me.id:", u.me.id);
  // deno-lint-ignore no-explicit-any
  const liveEnc = await encounterDb.findOne({ id: enc.id } as any);
  console.log("DEBUG enc.status:", liveEnc?.status);
  console.log("DEBUG enc.roomId:", liveEnc?.roomId);
  console.log("DEBUG participants full:", JSON.stringify(liveEnc?.participants));
  // deno-lint-ignore no-explicit-any
  const allEncs = await encounterDb.find({} as any);
  console.log("DEBUG all enc ids:", allEncs.map((e) => ({id: e.id, roomId: e.roomId, status: e.status, hasPosture: e.participants.some((p) => !!p.reactionPosture)})));

  // deno-lint-ignore no-explicit-any
  const after = await encounterDb.findOne({ id: enc.id } as any);
  assert(after);
  const p = after.participants.find((x) => x.actorId === "pc1");
  assert(p);
  assertEquals(p!.reactionPosture?.type, "ambush");
});
