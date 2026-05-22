// Chronicles of Darkness plugin entry point.
// Phase 1 (commands.ts side-effect import — addCmd() fires at module load).
// Phase 2 (init: register help dir, REST routes).
// Phase 3 (remove: tear down anything init() did).

import "./commands.ts";

import type { IPlugin, MoveEvent } from "@ursamu/ursamu";
import { registerPluginRoute, gameHooks, dbojs, send, wsService } from "@ursamu/ursamu";
import { registerHelpDir } from "@ursamu/help-plugin";
import { registerJobBuckets } from "@ursamu/jobs-plugin";
import { routeHandler } from "./routes.ts";
import { getEncounterForRoom, setMoved } from "./src/combat/encounter.ts";
import { enforceMoveLock, type MoveLockActor } from "./src/combat/move_lock.ts";

// Active-combat move-lock: anyone who has joined an active encounter cannot
// leave the room until the encounter ends or they leave it explicitly. Admins
// and wizards bypass. Implementation lives in src/combat/move_lock.ts as a
// pure handler; this listener just wires the live SDK as its dependencies.
async function onPlayerMove(e: MoveEvent): Promise<void> {
  const outcome = await enforceMoveLock(
    { actorId: e.actorId, fromRoomId: e.fromRoomId },
    {
      loadEncounter: (roomId) => getEncounterForRoom(roomId),
      loadActor: async (actorId): Promise<MoveLockActor | null> => {
        const a = await dbojs.queryOne({ id: actorId });
        if (!a) return null;
        const rawFlags = a.flags as unknown;
        const flags: Set<string> = rawFlags instanceof Set
          ? (rawFlags as Set<string>)
          : new Set(
              Array.isArray(rawFlags)
                ? (rawFlags as string[])
                : String(rawFlags ?? "").split(/[,\s]+/).filter(Boolean),
            );
        const sock = wsService.getConnectedSockets().find((s) => s.cid === actorId);
        return { id: a.id, flags, socketId: sock?.id };
      },
      snapBack: async (actorId, roomId) => {
        await dbojs.modify({ id: actorId }, "$set", { location: roomId });
      },
      notify: (socketId, msg) => {
        send([socketId], msg, {});
      },
    },
  );

  // If the move was NOT blocked, mark the actor as having used their move
  // action this round in any encounter they participate in. Used by /charge
  // feasibility check in +attack. Errors are swallowed: movement tracking
  // must not throw into the engine.
  if (!outcome.blocked) {
    try {
      for (const roomId of [e.fromRoomId, e.toRoomId]) {
        if (!roomId) continue;
        const enc = await getEncounterForRoom(roomId);
        if (!enc) continue;
        if (enc.participants.some((p) => p.actorId === e.actorId)) {
          await setMoved(enc.id, e.actorId, true);
        }
      }
    } catch (_err) { /* swallow */ }
  }
}

export const plugin: IPlugin = {
  name: "cofd",
  version: "1.0.0",
  description: "Chronicles of Darkness 2e plugin: sheets, chargen, d10 dice with 10/9/8-again, rote, and Willpower spend.",
  dependencies: [
    { name: "help", version: ">=1.0.0" },
    { name: "jobs", version: ">=1.4.0" },
  ],

  init: () => {
    registerHelpDir(new URL("./help", import.meta.url).pathname, "cofd");
    registerJobBuckets(["SHEET", "DOWNTIME"]);
    registerPluginRoute("/api/v1/cofd", routeHandler);
    gameHooks.on("player:move", onPlayerMove);
    return true;
  },

  remove: () => {
    gameHooks.off("player:move", onPlayerMove);
  },
};

export default plugin;
