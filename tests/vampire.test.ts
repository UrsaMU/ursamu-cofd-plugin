// Tests for the M6 Vampire overlay: bane lookup, BP table, Discipline data,
// the Vampire sheet section, and the +vitae spend validator.

import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";

import {
  BLOOD_POTENCY,
  getBane,
  getBloodPotencyEntry,
  getDiscipline,
  VAMPIRE_BANES,
  VAMPIRE_DISCIPLINES,
} from "../src/gamelines/vampire.ts";
import { vampireSection } from "../src/sheet/sections/vampire.ts";
import { COFD_TEMPLATES } from "../src/gamelines/templates.ts";
import { defaultSheet } from "../src/stats/sheet.ts";
import type { CofdSheet } from "../src/stats/sheet.ts";
import type { SheetContext } from "../src/sheet/sections/types.ts";
import { validateVitaeSpend } from "../src/commands/vitae.ts";

function makeContext(sheet: CofdSheet, templateKey = sheet.template): SheetContext {
  const template = COFD_TEMPLATES[templateKey] ?? COFD_TEMPLATES.mortal;
  return {
    playerName: "Test",
    actorId: "test-actor",
    sheet,
    template,
    width: 80,
  };
}

describe("Vampire bane lookup", () => {
  it("getBane('daeva') returns The Wanton Curse", () => {
    const bane = getBane("daeva");
    assert(bane, "expected a bane for daeva");
    assertEquals(bane!.name, "The Wanton Curse");
    assert(bane!.description.length > 0);
  });

  it("getBane is case-insensitive", () => {
    assertEquals(getBane("Daeva")?.name, "The Wanton Curse");
  });

  it("getBane('xyzzy') returns undefined for unknown clans", () => {
    assertEquals(getBane("xyzzy"), undefined);
  });

  it("VAMPIRE_BANES contains all five canonical clans", () => {
    for (const k of ["daeva", "gangrel", "mekhet", "nosferatu", "ventrue"]) {
      assert(VAMPIRE_BANES[k], `missing clan ${k}`);
    }
  });
});

describe("Blood Potency table", () => {
  it("getBloodPotencyEntry(3) returns the BP-3 row with maxVitae 12", () => {
    const row = getBloodPotencyEntry(3);
    assertEquals(row.bp, 3);
    assertEquals(row.maxVitae, 12);
    assertEquals(row.maxPerTurn, 3);
  });

  it("getBloodPotencyEntry(7) returns maxVitae 20, per-turn 7", () => {
    const row = getBloodPotencyEntry(7);
    assertEquals(row.maxVitae, 20);
    assertEquals(row.maxPerTurn, 7);
    assertEquals(row.minHumanity, 5);
  });

  it("getBloodPotencyEntry clamps out-of-range values", () => {
    assertEquals(getBloodPotencyEntry(-1).bp, 0);
    assertEquals(getBloodPotencyEntry(99).bp, 10);
  });

  it("BLOOD_POTENCY has entries for BP 0..10", () => {
    for (let i = 0; i <= 10; i++) {
      assert(BLOOD_POTENCY[i], `missing BP ${i}`);
      assertEquals(BLOOD_POTENCY[i].bp, i);
    }
  });
});

describe("Discipline data", () => {
  it("getDiscipline('vigor') returns 5 levels", () => {
    const d = getDiscipline("vigor");
    assert(d, "expected vigor discipline");
    assertEquals(d!.name, "Vigor");
    assertEquals(d!.levels.length, 5);
    assertEquals(d!.levels[0].dot, 1);
    assertEquals(d!.levels[4].dot, 5);
  });

  it("getDiscipline('xyzzy') returns undefined", () => {
    assertEquals(getDiscipline("xyzzy"), undefined);
  });

  it("VAMPIRE_DISCIPLINES carries Crúac as a covenant discipline", () => {
    const cruac = VAMPIRE_DISCIPLINES["cruac"];
    assert(cruac, "expected cruac entry");
    assertEquals(cruac.signature, false);
  });
});

describe("Vampire sheet section", () => {
  it("returns [] when template is not 'vampire'", async () => {
    const sheet = defaultSheet(); // template defaults to "mortal"
    const ctx = makeContext(sheet);
    const out = await vampireSection.render(ctx);
    assertEquals(out, []);
  });

  it("renders Mask and Dirge fallbacks as '(unset)'", async () => {
    const sheet: CofdSheet = {
      ...defaultSheet(),
      template: "vampire",
      powerStatValue: 1,
      energyCurrent: 5,
      moralityValue: 7,
      customFields: { clan: "Daeva", covenant: "Invictus" },
    };
    const ctx = makeContext(sheet, "vampire");
    const out = await vampireSection.render(ctx);
    const joined = out.join("\n");
    assertStringIncludes(joined, "Mask:");
    assertStringIncludes(joined, "(unset)");
    // Renders Bane lookup from the clan field
    assertStringIncludes(joined, "The Wanton Curse");
    // Renders Blood Potency block + Vitae numbers
    assertStringIncludes(joined, "Blood Potency:");
    assertStringIncludes(joined, "Vitae:");
  });

  it("renders set Touchstones verbatim", async () => {
    const sheet: CofdSheet = {
      ...defaultSheet(),
      template: "vampire",
      customFields: { clan: "Ventrue", covenant: "Invictus" },
      touchstones: { mask: "Lia Martinez", dirge: "The Predator I Am" },
    };
    const ctx = makeContext(sheet, "vampire");
    const out = await vampireSection.render(ctx);
    const joined = out.join("\n");
    assertStringIncludes(joined, "Lia Martinez");
    assertStringIncludes(joined, "The Predator I Am");
    assertStringIncludes(joined, "The Tyrant's Curse");
  });
});

describe("validateVitaeSpend", () => {
  it("blocks spending on a mortal sheet with a clear error", () => {
    const sheet: CofdSheet = { ...defaultSheet(), energyCurrent: 5 };
    // template defaults to "mortal"
    const v = validateVitaeSpend(sheet, 1);
    assertEquals(v.ok, false);
    assertStringIncludes(v.error || "", "Only vampires");
  });

  it("rejects non-positive amounts", () => {
    const sheet: CofdSheet = { ...defaultSheet(), template: "vampire", energyCurrent: 5 };
    const v = validateVitaeSpend(sheet, 0);
    assertEquals(v.ok, false);
  });

  it("rejects spends exceeding the current pool", () => {
    const sheet: CofdSheet = {
      ...defaultSheet(),
      template: "vampire",
      energyCurrent: 2,
      powerStatValue: 1,
    };
    const v = validateVitaeSpend(sheet, 5);
    assertEquals(v.ok, false);
    assertStringIncludes(v.error || "", "Insufficient");
  });

  it("warns (but does not block) when spend exceeds per-turn cap", () => {
    const sheet: CofdSheet = {
      ...defaultSheet(),
      template: "vampire",
      energyCurrent: 10,
      powerStatValue: 1, // per-turn cap = 1
    };
    const v = validateVitaeSpend(sheet, 3);
    assertEquals(v.ok, true);
    assert(v.warning, "expected a per-turn cap warning");
    assertEquals(v.perTurnCap, 1);
  });

  it("approves a normal in-cap spend", () => {
    const sheet: CofdSheet = {
      ...defaultSheet(),
      template: "vampire",
      energyCurrent: 10,
      powerStatValue: 3, // per-turn cap = 3
    };
    const v = validateVitaeSpend(sheet, 2);
    assertEquals(v.ok, true);
    assertEquals(v.warning, undefined);
  });
});
