// Equipment section -- equipped weapon/armor + inventory list.
// Suppressed entirely when the character has no items and no equipped slots.

import { divider } from "@ursamu/ursamu";
import { lookupItem } from "../../equipment/index.ts";
import type { SheetContext, SheetSection } from "./types.ts";

function pad(s: string, n: number): string {
  if (s.length >= n) return s.slice(0, n);
  return s + " ".repeat(n - s.length);
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export const equipmentSection: SheetSection = {
  key: "equipment",
  async render(ctx: SheetContext): Promise<string[]> {
    const { sheet } = ctx;
    const state = sheet.equipment;
    const items = state?.items ?? [];
    const hasEquipped = !!(state?.equippedWeapon || state?.equippedArmor);
    if (items.length === 0 && !hasEquipped) return [];

    const lines: string[] = [];
    lines.push(await divider("E Q U I P M E N T"));

    if (state?.equippedWeapon) {
      const item = items.find((i) => i.id === state.equippedWeapon);
      const resolved = item ? lookupItem(item.key) : undefined;
      if (resolved && (resolved.type === "weapon-ranged" || resolved.type === "weapon-melee")) {
        const w = resolved.entry as { name: string; damage: number; initiative: number };
        lines.push(`  Weapon:  ${w.name}  (Dmg ${signed(w.damage)}, Init ${signed(w.initiative)})`);
      }
    }
    if (state?.equippedArmor) {
      const item = items.find((i) => i.id === state.equippedArmor);
      const resolved = item ? lookupItem(item.key) : undefined;
      if (resolved && resolved.type === "armor") {
        const a = resolved.entry as {
          name: string; ratingGeneral: number; ratingBallistic: number;
          defensePenalty: number; speedPenalty: number;
        };
        lines.push(
          `  Armor:   ${a.name}  (${a.ratingGeneral}/${a.ratingBallistic}, ` +
          `Def ${signed(a.defensePenalty)}, Spd ${signed(a.speedPenalty)})`,
        );
      }
    }

    if (items.length > 0) {
      lines.push(`  Inventory:`);
      items.forEach((item, idx) => {
        const resolved = lookupItem(item.key);
        const name = resolved?.entry.name ?? item.key;
        const marks: string[] = [];
        if (state?.equippedWeapon === item.id) marks.push("equipped");
        if (state?.equippedArmor === item.id) marks.push("worn");
        const tag = marks.length ? ` (${marks.join(", ")})` : "";
        const note = item.note ? ` -- ${item.note}` : "";
        lines.push(`    ${pad(String(idx + 1) + ".", 4)} ${name}${tag}${note}`);
      });
    }

    return lines;
  },
};
