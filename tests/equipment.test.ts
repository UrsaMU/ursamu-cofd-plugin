// Equipment subsystem + +gear command tests.

import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";
import { mockPlayer, mockU } from "./helpers/mockU.ts";
import { defaultSheet } from "../src/stats/index.ts";
import {
  addItem,
  equipAt,
  equippedArmor,
  equippedWeapon,
  lookupItem,
  removeItemAt,
  unequipSlot,
} from "../src/equipment/index.ts";
import { gearExec } from "../src/commands/gear.ts";

const OPTS = { sanitizeResources: false, sanitizeOps: false };

describe("equipment catalog", OPTS, () => {
  it("looks up weapons, armor, gear, services by key", () => {
    assertEquals(lookupItem("pistol-light")?.type, "weapon-ranged");
    assertEquals(lookupItem("knife")?.type, "weapon-melee");
    assertEquals(lookupItem("kevlar-vest")?.type, "armor");
    assertEquals(lookupItem("first-aid-kit")?.type, "gear-mental");
    assertEquals(lookupItem("rope")?.type, "gear-physical");
    assertEquals(lookupItem("cash")?.type, "gear-social");
    assertEquals(lookupItem("auto-repair")?.type, "service");
    assertEquals(lookupItem("nonexistent"), undefined);
    assertEquals(lookupItem(""), undefined);
  });

  it("normalizes keys to lowercase-trim", () => {
    assertEquals(lookupItem("  KEVLAR-VEST  ")?.entry.name, "Kevlar Vest");
  });
});

describe("inventory pure functions", OPTS, () => {
  it("adds, equips, and resolves a weapon", () => {
    let sheet = defaultSheet();
    const r1 = addItem(sheet, "pistol-light");
    assert(!r1.error);
    sheet = r1.sheet;
    assertEquals(sheet.equipment!.items.length, 1);

    const r2 = equipAt(sheet, 1);
    assert(!r2.error);
    sheet = r2.sheet;
    assertEquals(r2.slot, "weapon");
    assertEquals(equippedWeapon(sheet)?.name, "Pistol, Light");
    assertEquals(equippedArmor(sheet), null);
  });

  it("rejects unknown keys", () => {
    const r = addItem(defaultSheet(), "death-ray");
    assert(r.error);
    assertStringIncludes(r.error!, "Unknown");
  });

  it("equipping a non-weapon non-armor errors", () => {
    let sheet = defaultSheet();
    sheet = addItem(sheet, "rope").sheet;
    const r = equipAt(sheet, 1);
    assert(r.error);
    assertStringIncludes(r.error!, "not a weapon or armor");
  });

  it("removing an equipped item nulls its slot", () => {
    let sheet = defaultSheet();
    sheet = addItem(sheet, "knife").sheet;
    sheet = equipAt(sheet, 1).sheet;
    assert(equippedWeapon(sheet));
    sheet = removeItemAt(sheet, 1).sheet;
    assertEquals(equippedWeapon(sheet), null);
    assertEquals(sheet.equipment!.equippedWeapon, null);
  });

  it("equip survives reordering via stable id", () => {
    let sheet = defaultSheet();
    sheet = addItem(sheet, "knife").sheet;     // slot 1
    sheet = addItem(sheet, "rope").sheet;      // slot 2
    sheet = equipAt(sheet, 1).sheet;           // equip knife (item id k)
    const knifeId = sheet.equipment!.equippedWeapon;
    // remove rope (slot 2) -- knife should remain equipped
    sheet = removeItemAt(sheet, 2).sheet;
    assertEquals(sheet.equipment!.equippedWeapon, knifeId);
    assertEquals(equippedWeapon(sheet)?.name, "Knife");
  });

  it("unequipSlot clears the correct slot only", () => {
    let sheet = defaultSheet();
    sheet = addItem(sheet, "knife").sheet;
    sheet = addItem(sheet, "kevlar-vest").sheet;
    sheet = equipAt(sheet, 1).sheet;
    sheet = equipAt(sheet, 2).sheet;
    sheet = unequipSlot(sheet, "weapon");
    assertEquals(equippedWeapon(sheet), null);
    assertEquals(equippedArmor(sheet)?.name, "Kevlar Vest");
  });

  it("out-of-range index errors out", () => {
    const r = removeItemAt(defaultSheet(), 1);
    assert(r.error);
  });
});

describe("+gear command", OPTS, () => {
  it("blocks players without an approved sheet on /add", async () => {
    const me = mockPlayer();
    const u = mockU({ me });
    u.cmd.args = ["add", "knife"];
    await gearExec(u);
    assertStringIncludes(u._sent.join("\n"), "does not have an approved character sheet");
  });

  it("happy path: list -> add -> equip via DB", async () => {
    const me = mockPlayer({ state: { cofd: defaultSheet() } });
    const u = mockU({
      me,
      dbModify: async (_id, op, data: any) => {
        if (op === "$set" && data["data.cofd"]) me.state.cofd = data["data.cofd"];
      },
    });

    u.cmd.args = ["add", "kevlar-vest"];
    u._sent.length = 0;
    await gearExec(u);
    assertStringIncludes(u._sent.join("\n"), "Kevlar Vest");
    const sheetA = me.state.cofd as ReturnType<typeof defaultSheet>;
    assertEquals(sheetA.equipment!.items.length, 1);

    u.cmd.args = ["equip", "1"];
    u._sent.length = 0;
    await gearExec(u);
    assertStringIncludes(u._sent.join("\n"), "wears");
    const sheetB = me.state.cofd as ReturnType<typeof defaultSheet>;
    assert(sheetB.equipment!.equippedArmor);
  });

  it("rejects unknown switch", async () => {
    const u = mockU({ me: mockPlayer({ state: { cofd: defaultSheet() } }) });
    u.cmd.args = ["bogus", ""];
    await gearExec(u);
    assertStringIncludes(u._sent.join("\n"), "Unknown +gear switch");
  });

  it("strips MUSH codes from user-supplied notes", async () => {
    const me = mockPlayer({ state: { cofd: defaultSheet() } });
    const u = mockU({
      me,
      dbModify: async (_id, op, data: any) => {
        if (op === "$set" && data["data.cofd"]) me.state.cofd = data["data.cofd"];
      },
    });
    u.cmd.args = ["add", "knife/%cr%chSecret%cn"];
    await gearExec(u);
    const sheet = me.state.cofd as ReturnType<typeof defaultSheet>;
    const note = sheet.equipment!.items[0]?.note ?? "";
    assertEquals(note.includes("%c"), false);
  });

  it("cross-player edits without canEdit are blocked", async () => {
    const me = mockPlayer({ id: "1", state: { cofd: defaultSheet() } });
    const other = mockPlayer({ id: "2", name: "Marcus", state: { cofd: defaultSheet() } });
    const u = mockU({ me, targetResult: other, canEditResult: false });
    u.cmd.args = ["add", "knife for Marcus"];
    await gearExec(u);
    assertStringIncludes(u._sent.join("\n"), "Permission denied");
  });
});
