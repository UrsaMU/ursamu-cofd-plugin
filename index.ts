import "./commands.ts";
import type { IPlugin } from "jsr:@ursamu/ursamu";
// import type { SessionEvent } from "jsr:@ursamu/ursamu"; // needed for event handler types
// import { gameHooks } from "jsr:@ursamu/ursamu";          // uncomment to use event hooks
import { registerPluginRoute } from "jsr:@ursamu/ursamu";
import { registerHelpDir } from "jsr:@ursamu/help-plugin";
import { routeHandler } from "./routes.ts";

// Named handler reference — required so remove() can call gameHooks.off()
// with the exact same function reference used in init().
// const onCofdLogin = ({ actorId, actorName }: SessionEvent) => {
//   /* ... */
// };

export const plugin: IPlugin = {
  name: "cofd",
  version: "1.0.0",
  description: "TODO: one-sentence description of cofd.",

  init: () => {
    registerHelpDir(new URL("./help", import.meta.url).pathname, "cofd");
    // gameHooks.on("player:login", onCofdLogin);
    registerPluginRoute("/api/v1/cofd", routeHandler);
    // Note: REST routes persist until server restart and cannot be hot-unloaded.
    return true;
  },

  remove: () => {
    // gameHooks.off("player:login", onCofdLogin);
  },
};
