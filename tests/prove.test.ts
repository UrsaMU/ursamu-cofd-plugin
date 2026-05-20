// +prove command tests.

import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";
import { mockPlayer, mockU } from "./helpers/mockU.ts";
import { defaultSheet } from "../src/stats/index.ts";
import { resolveTrait } from "../src/roller/index.ts";
import { proveExec } from "../src/commands/prove.ts";
import { addItem, equipAt } from "../src/equipment/index.ts";

const OPTS = { sanitizeResources: false, sanitizeOps: false };

function sheetWith(over: Partial<ReturnType<typeof defaultSheet>>) {
  return { ...defaultSheet(), ...over };
}

describe("resolveTrait", OPTS, () => {
  it("resolves attributes", () => {
    const s = sheetWith({ attributes: { ...defaultSheet().attributes, strength: 3 } });
    const r = resolveTrait("strength", s);
    assertEquals(r?.label, "Strength");
    assertEquals(r?.value, 3);
  });

  it("resolves skills", () => {
    const s = sheetWith({ skills: { ...defaultSheet().skills, athletics: 2 } });
    assertEquals(resolveTrait("athletics", s)?.value, 2);
  });

  it("resolves skill specialty with +1 bonus", () => {
    const s = sheetWith({
      skills: { ...defaultSheet().skills, brawl: 2 },
      specialties: { brawl: ["Boxing"] },
    });
    const r = resolveTrait("brawl/boxing", s);
    assertEquals(r?.base, 2);
    assertEquals(r?.value, 3);
    assertEquals(r?.specialty, "Boxing");
  });

  it("rejects specialty the sheet does not own", () => {
    const s = sheetWith({ skills: { ...defaultSheet().skills, brawl: 2 } });
    assertEquals(resolveTrait("brawl/kickboxing", s), null);
  });

  it("resolves willpower", () => {
    assertEquals(resolveTrait("willpower", defaultSheet())?.label, "Willpower");
    assertEquals(resolveTrait("wp", defaultSheet())?.label, "Willpower");
  });

  it("returns null for unknown tokens", () => {
    assertEquals(resolveTrait("nonexistent", defaultSheet()), null);
    assertEquals(resolveTrait("", defaultSheet()), null);
  });

  it("resolves vampire power stat via 'bp' alias", () => {
    const s = sheetWith({ template: "vampire", powerStatValue: 2 });
    const r = resolveTrait("bp", s);
    assertEquals(r?.label, "Blood Potency");
    assertEquals(r?.value, 2);
  });
});

describe("+prove command", OPTS, () => {
  it("rejects no traits", async () => {
    const u = mockU({ me: mockPlayer({ state: { cofd: defaultSheet() } }) });
    u.cmd.args = ["", ""];
    await proveExec(u);
    assertStringIncludes(u._sent.join("\n"), "Usage");
  });

  it("rejects sender with no sheet", async () => {
    const u = mockU({ me: mockPlayer() });
    u.cmd.args = ["", "strength"];
    await proveExec(u);
    assertStringIncludes(u._sent.join("\n"), "approved");
  });

  it("rejects unknown switch", async () => {
    const u = mockU({ me: mockPlayer({ state: { cofd: defaultSheet() } }) });
    u.cmd.args = ["bogus", "strength"];
    await proveExec(u);
    assertStringIncludes(u._sent.join("\n"), "Unknown +prove switch");
  });

  it("rejects all-unknown trait list with a useful error", async () => {
    const u = mockU({ me: mockPlayer({ state: { cofd: defaultSheet() } }) });
    u.cmd.args = ["", "fluffiness,unicorns"];
    await proveExec(u);
    const out = u._sent.join("\n");
    assertStringIncludes(out, "Unknown");
    assertStringIncludes(out, "fluffiness");
  });

  it("caps trait list at 8", async () => {
    const u = mockU({ me: mockPlayer({ state: { cofd: defaultSheet() } }) });
    u.cmd.args = ["", "strength,dexterity,stamina,wits,resolve,composure,intelligence,presence,manipulation"];
    await proveExec(u);
    assertStringIncludes(u._sent.join("\n"), "Too many traits");
  });

  it("broadcasts to room with PROVE>> prefix when no recipient", async () => {
    const sheet = sheetWith({ attributes: { ...defaultSheet().attributes, strength: 3 } });
    const u = mockU({ me: mockPlayer({ state: { cofd: sheet } }) });
    u.cmd.args = ["", "strength"];
    await proveExec(u);
    const out = u._sent.join("\n");
    assertStringIncludes(out, "PROVE>>");
    assertStringIncludes(out, "Strength");
    assertStringIncludes(out, "(3)");
  });

  it("renders specialty as base+1", async () => {
    const sheet = sheetWith({
      skills: { ...defaultSheet().skills, brawl: 2 },
      specialties: { brawl: ["Boxing"] },
    });
    const u = mockU({ me: mockPlayer({ state: { cofd: sheet } }) });
    u.cmd.args = ["", "brawl/boxing"];
    await proveExec(u);
    assertStringIncludes(u._sent.join("\n"), "(2+1)");
  });

  it("notes skipped tokens but still sends valid ones", async () => {
    const u = mockU({ me: mockPlayer({ state: { cofd: defaultSheet() } }) });
    u.cmd.args = ["", "strength, made-up-thing"];
    await proveExec(u);
    const out = u._sent.join("\n");
    assertStringIncludes(out, "PROVE>>");
    assertStringIncludes(out, "skipped");
    assertStringIncludes(out, "made-up-thing");
  });

  it("whispers to named recipient with =<player>", async () => {
    const me = mockPlayer({ id: "1", state: { cofd: defaultSheet() } });
    const other = mockPlayer({ id: "2", name: "Marcus" });
    const u = mockU({ me, targetResult: other });
    u.cmd.args = ["", "strength=Marcus"];
    await proveExec(u);
    const out = u._sent.join("\n");
    assertStringIncludes(out, "You show Marcus");
    // and one of the sends should be addressed to target.id
    const ids = u._dbCalls; // unused -- verify the send array contains the broadcast line for target
    void ids;
  });

  it("targeted whisper to a missing player errors cleanly", async () => {
    const u = mockU({ me: mockPlayer({ state: { cofd: defaultSheet() } }), targetResult: null });
    u.cmd.args = ["", "strength=Ghost"];
    await proveExec(u);
    assertStringIncludes(u._sent.join("\n"), "not found");
  });

  it("proves equipped weapon with damage and initiative", async () => {
    let sheet = defaultSheet();
    sheet = addItem(sheet, "pistol-light").sheet;
    sheet = equipAt(sheet, 1).sheet;
    const u = mockU({ me: mockPlayer({ state: { cofd: sheet } }) });
    u.cmd.args = ["", "weapon"];
    await proveExec(u);
    const out = u._sent.join("\n");
    assertStringIncludes(out, "Pistol, Light");
    assertStringIncludes(out, "Dmg +1");
  });

  it("proves equipped armor with rating and penalties", async () => {
    let sheet = defaultSheet();
    sheet = addItem(sheet, "flak-jacket").sheet;
    sheet = equipAt(sheet, 1).sheet;
    const u = mockU({ me: mockPlayer({ state: { cofd: sheet } }) });
    u.cmd.args = ["", "armor"];
    await proveExec(u);
    const out = u._sent.join("\n");
    assertStringIncludes(out, "Flak Jacket");
    assertStringIncludes(out, "2/4");
    assertStringIncludes(out, "Def -1");
  });

  it("proves gear inventory list", async () => {
    let sheet = defaultSheet();
    sheet = addItem(sheet, "knife").sheet;
    sheet = addItem(sheet, "rope").sheet;
    const u = mockU({ me: mockPlayer({ state: { cofd: sheet } }) });
    u.cmd.args = ["", "gear"];
    await proveExec(u);
    const out = u._sent.join("\n");
    assertStringIncludes(out, "Knife");
    assertStringIncludes(out, "Rope");
  });

  it("reports 'none' for unequipped slots gracefully", async () => {
    const u = mockU({ me: mockPlayer({ state: { cofd: defaultSheet() } }) });
    u.cmd.args = ["", "weapon,armor"];
    await proveExec(u);
    const out = u._sent.join("\n");
    assertStringIncludes(out, "none equipped");
    assertStringIncludes(out, "none worn");
  });

  it("mixes gear tokens with attribute traits", async () => {
    let sheet = defaultSheet();
    sheet.attributes.strength = 3;
    sheet = addItem(sheet, "knife").sheet;
    sheet = equipAt(sheet, 1).sheet;
    const u = mockU({ me: mockPlayer({ state: { cofd: sheet } }) });
    u.cmd.args = ["", "strength, weapon"];
    await proveExec(u);
    const out = u._sent.join("\n");
    assertStringIncludes(out, "Strength");
    assertStringIncludes(out, "Knife");
  });

  it("strips MUSH codes from input", async () => {
    const sheet = sheetWith({ attributes: { ...defaultSheet().attributes, strength: 3 } });
    const u = mockU({ me: mockPlayer({ state: { cofd: sheet } }) });
    u.cmd.args = ["", "%cr%chstrength%cn"];
    await proveExec(u);
    assertStringIncludes(u._sent.join("\n"), "Strength");
  });
});
