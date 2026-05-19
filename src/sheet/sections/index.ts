// Default ordered list of sheet section renderers.

import type { SheetSection } from "./types.ts";
import { headerSection } from "./header.ts";
import { attributesSection } from "./attributes.ts";
import { skillsSection } from "./skills.ts";
import { advantagesSection } from "./advantages.ts";
import { healthSection } from "./health.ts";
import { meritsSection } from "./merits.ts";
import { specialtiesSection } from "./specialties.ts";
import { powersSection } from "./powers.ts";
import { vampireSection } from "./vampire.ts";
import { beatsXpSection } from "./beats-xp.ts";
import { conditionsAspirationsSection } from "./conditions-aspirations.ts";

export type { SheetSection, SheetContext } from "./types.ts";

export {
  headerSection,
  attributesSection,
  skillsSection,
  advantagesSection,
  healthSection,
  meritsSection,
  specialtiesSection,
  powersSection,
  vampireSection,
  beatsXpSection,
  conditionsAspirationsSection,
};

/** Default render order. Future subsystems append their own sections here. */
export const defaultSections: SheetSection[] = [
  headerSection,
  attributesSection,
  skillsSection,
  advantagesSection,
  healthSection,
  meritsSection,
  specialtiesSection,
  powersSection,
  vampireSection,
  beatsXpSection,
  conditionsAspirationsSection,
];
