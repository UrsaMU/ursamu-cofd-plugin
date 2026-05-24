+npc  -- Spawn and manage non-player antagonists for combat scenes.

Syntax:
  +npc                                List NPCs in the current room.
  +npc/list                           Same as +npc.
  +npc/build <name>=<archetype>[/<tier>]  Spawn an NPC with full stat block.
  +npc/create <name>=<archetype>      Alias for /build.
  +npc/show <name-or-id>              Display the full stat block.
  +npc/powers                         List the Dread Powers / Numina catalog.
  +npc/addpower <npc>=<key>           Attach a dread power.
  +npc/rmpower <npc>=<key>            Detach a dread power.
  +npc/ai <npc>=<ai-archetype>        Set NPC AI archetype (staff).
  +npc/aggro <npc>=<target>           Spike NPC threat toward target (staff).
  +npc/destroy <name-or-id>           Remove an NPC.

Permissions:
  View / list / show / powers   connected.
  Build / addpower / rmpower    staff (admin or builder).
  Destroy                       staff + canEdit on the NPC.

Examples:
  +npc                              List room NPCs.
  +npc/build Goon=thug              Spawn a Thug (minor tier).
  +npc/build Karl=hunter/storyteller Spawn a storyteller-tier Hunter.
  +npc/show Karl                    Show Karl's stat block.
  +npc/powers                       List dread powers.
  +npc/addpower Karl=mortal-mask    Attach Mortal Mask.
  +combat/join for Goon             Add Goon to the encounter.
  +attack Goon                      Attack Goon.
  +npc/destroy Goon                 Remove Goon.

More:
  help npc tiers          Tier capacities for powers and merits.
  help npc archetypes     Archetype catalog and default loadouts.
  help npc derived        Derived stats: Health, Defense, Initiative.

See also: combat, attack, sheet
