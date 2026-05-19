// Chronicles of Darkness plugin entry point.
// Phase 1 (commands.ts side-effect import — addCmd() fires at module load).
// Phase 2 (init: register help dir, REST routes).
// Phase 3 (remove: tear down anything init() did).

import "./commands.ts";

import type { IPlugin } from "@ursamu/ursamu";
import { registerPluginRoute } from "@ursamu/ursamu";
import { registerHelpDir } from "@ursamu/help-plugin";
import { routeHandler } from "./routes.ts";

export const plugin: IPlugin = {
  name: "cofd",
  version: "1.0.0",
  description: "Chronicles of Darkness 2e plugin: sheets, chargen, d10 dice with 10/9/8-again, rote, and Willpower spend.",
  dependencies: [
    { name: "help", version: ">=1.0.0" },
  ],

  init: () => {
    registerHelpDir(new URL("./help", import.meta.url).pathname, "cofd");
    registerPluginRoute("/api/v1/cofd", routeHandler);
    return true;
  },

  remove: () => {
    // No gameHooks.on() pairs to tear down yet.
  },
};

export default plugin;
