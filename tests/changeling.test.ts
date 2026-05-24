import { assertEquals, assertStringIncludes, assert } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { defaultSheet, setTrait, validateTraitValue } from "../cofd.ts";
import { changelingSection } from "../src/sheet/sections/changeling.ts";
import type { SheetContext } from "../src/sheet/sections/types.ts";
import { COFD_TEMPLATES } from "../src/gamelines/templates.ts";

const OPTS = { sanitizeResources: false, sanitizeOps: false };

describe("Changeling: The Lost Template", OPTS, () => {
  it("initializes changeling sheets with correct defaults", () => {
    let sheet = defaultSheet();
    sheet = setTrait(sheet, "template", "changeling");

    assertEquals(sheet.template, "changeling");
    assertEquals(sheet.powerStatValue, 1); // Wyrd starts at 1 via direct transition
    assertEquals(sheet.energyCurrent, 10); // Glamour max at Wyrd 1 is 10
  });

  it("sets and gets custom fields: seeming, kith, court, needle, thread", () => {
    let sheet = defaultSheet();
    sheet = setTrait(sheet, "template", "changeling");

    sheet = setTrait(sheet, "seeming", "Wizened");
    sheet = setTrait(sheet, "kith", "Gsmith");
    sheet = setTrait(sheet, "court", "Autumn");
    sheet = setTrait(sheet, "needle", "Bon Vivant");
    sheet = setTrait(sheet, "thread", "Hedonist");

    assertEquals(sheet.customFields.seeming, "Wizened");
    assertEquals(sheet.customFields.kith, "Gsmith");
    assertEquals(sheet.customFields.court, "Autumn");
    assertEquals(sheet.customFields.needle, "Bon Vivant");
    assertEquals(sheet.customFields.thread, "Hedonist");
  });

  it("sets and validates valid changeling contract powers", () => {
    let sheet = defaultSheet();
    sheet = setTrait(sheet, "template", "changeling");

    const val = validateTraitValue("spring", "2", sheet);
    sheet = setTrait(sheet, "spring", val);
    assertEquals(sheet.powers.spring, 2);

    const valSummer = validateTraitValue("summer", "3", sheet);
    sheet = setTrait(sheet, "summer", valSummer);
    assertEquals(sheet.powers.summer, 3);
  });

  it("throws when setting non-changeling powers", () => {
    let sheet = defaultSheet();
    sheet = setTrait(sheet, "template", "changeling");

    try {
      validateTraitValue("vigor", "3", sheet);
      assert(false, "Should have thrown for invalid power");
    } catch (e) {
      assert(e instanceof Error);
    }
  });

  it("renders changelingSection correctly with set values", async () => {
    let sheet = defaultSheet();
    sheet = setTrait(sheet, "template", "changeling");
    sheet = setTrait(sheet, "seeming", "Fairest");
    sheet = setTrait(sheet, "kith", "Dancer");
    sheet = setTrait(sheet, "court", "Spring");
    sheet = setTrait(sheet, "needle", "Protector");
    sheet = setTrait(sheet, "thread", "Believer");
    sheet = setTrait(sheet, "wyrd", 3); // Wyrd 3
    sheet = setTrait(sheet, "glamour", 12); // Glamour 12 max

    const ctx: SheetContext = {
      playerName: "Arthur",
      actorId: "1",
      sheet,
      template: COFD_TEMPLATES.changeling,
      width: 78,
    };
    const renderedLines = await changelingSection.render(ctx);

    const fullText = renderedLines.join("\n");
    assertStringIncludes(fullText, "C H A N G E L I N G :   T H E   L O S T");
    assertStringIncludes(fullText, "Fairest");
    assertStringIncludes(fullText, "Dancer");
    assertStringIncludes(fullText, "Spring");
    assertStringIncludes(fullText, "Protector");
    assertStringIncludes(fullText, "Believer");
    assertStringIncludes(fullText, "3  (Glamour max 12)");
    assertStringIncludes(fullText, "12 / 12");
  });
});
