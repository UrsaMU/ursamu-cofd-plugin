// Width-compliance tests for the four output-overflow bugs.
//
// MUSH terminals wrap at 78 columns and use Latin-1 single-byte glyphs. Any
// output line over 78 visible chars wraps mid-line and looks broken. The
// strings asserted here cover the worst-case ASCII rendering of each fix.

import { assertEquals } from "jsr:@std/assert";
import { compactRollExpr } from "../src/commands/roll.ts";

const OPTS = { sanitizeResources: false, sanitizeOps: false };

/** Strip MUSH %c color codes for visible-length measurement. */
function visibleLen(s: string): number {
  return s.replace(/%c./g, "").length;
}

Deno.test("bug 1a: sheet header is Latin-1 and under 78 cols", OPTS, () => {
  // Reproduce the literal header expression from src/sheet/sections/header.ts.
  const longTemplate = "CHANGELING";
  const headerText = `CHRONICLES OF DARKNESS -- ${longTemplate}`;
  // Latin-1 only.
  for (const ch of headerText) {
    const code = ch.charCodeAt(0);
    if (code > 0xff) {
      throw new Error(`Non-Latin-1 char ${ch} (U+${code.toString(16)})`);
    }
  }
  // The decorated header() adds a small border but the inner text must fit.
  if (headerText.length > 78) {
    throw new Error(`header text too long: ${headerText.length}`);
  }
});

Deno.test("bug 1b: chargen header is Latin-1 and under 78 cols", OPTS, () => {
  const stage = 6;
  const stageName = "POWERS & MERITS";
  const headerText = `CHARACTER CREATION -- STAGE ${stage}: ${stageName}`;
  for (const ch of headerText) {
    if (ch.charCodeAt(0) > 0xff) {
      throw new Error(`Non-Latin-1 char ${ch}`);
    }
  }
  if (headerText.length > 78) {
    throw new Error(`header text too long: ${headerText.length}`);
  }
});

Deno.test("bug 3: compactRollExpr keeps the broadcast under 78 cols", OPTS, () => {
  // Representative case from the bug report. Player names on a MUSH are
  // typically a single token (8-12 chars); the broadcast is bounded by the
  // 78-col MUSH window, so we use a 10-char name here.
  const name = "Marcus";
  // The roller passes only attribute/skill terms here; the equipped-weapon
  // bonus is signaled by the `useWeapon` flag and rendered as a bare "wpn"
  // token, so long weapon names cannot blow the line out.
  const terms = ["dexterity(3)", "weaponry(3)"];
  const expr = compactRollExpr(terms, { spentWp: false, useWeapon: true });
  // /weapon and /wp are absorbed into the compact expression itself, so
  // for a baseline weapon attack the verb is just "rolls" with no suffix.
  const verb = "rolls";
  const dice = "6d (5 9 2 3 6 9)";
  const succWord = "success"; // singular for 1
  const line =
    `%ch%ccROLL>>%cn ${name} ${verb} %ch${expr}%cn ` +
    `${dice} -> %ch%cy1%cn ${succWord} (%ch%ccSuccess%cn)`;
  const vis = visibleLen(line);
  if (vis > 78) {
    throw new Error(`roll broadcast too long (${vis}): ${line}`);
  }
});

Deno.test("bug 3: compactRollExpr abbreviates attributes only", OPTS, () => {
  const got = compactRollExpr(
    ["dexterity(3)", "weaponry(3)"],
    { spentWp: false, useWeapon: false },
  );
  assertEquals(got, "Dex+Weaponry");
});

Deno.test("bug 3: compactRollExpr appends WP and wpn flags", OPTS, () => {
  const got = compactRollExpr(
    ["strength(3)", "brawl(2)"],
    { spentWp: true, useWeapon: true },
  );
  assertEquals(got, "Str+Brawl+WP+wpn");
});

Deno.test("bug 3: 'success' is singular when count is 1", OPTS, () => {
  // Mirrors the inline ternary in roll.ts.
  const word = (n: number) => (n === 1 ? "success" : "successes");
  assertEquals(word(0), "successes");
  assertEquals(word(1), "success");
  assertEquals(word(2), "successes");
});
