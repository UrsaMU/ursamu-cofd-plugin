// Merit definitions loaded from resources/merits.json.

export interface MeritDefinition {
  key: string;
  name: string;
  category: string;
  allowedDots: number[];
  prereqs: string[];
}

const meritsUrl = new URL("../../resources/merits.json", import.meta.url);

export const COFD_MERITS: MeritDefinition[] = JSON.parse(Deno.readTextFileSync(meritsUrl));
