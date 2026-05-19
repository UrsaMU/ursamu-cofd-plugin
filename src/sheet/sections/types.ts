// Shared types for sheet section renderers.

import type { CofdSheet } from "../../stats/sheet.ts";
import type { CofdTemplate } from "../../gamelines/templates.ts";

export interface SheetContext {
  playerName: string;
  sheet: CofdSheet;
  template: CofdTemplate;
  width: number;
}

export interface SheetSection {
  /** Unique key for ordering / overrides. */
  key: string;
  /** Lines this section contributes; return [] to suppress entirely. */
  render(ctx: SheetContext): Promise<string[]> | string[];
}
