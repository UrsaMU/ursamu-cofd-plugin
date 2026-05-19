+xp  -- View Experience pools, spend XP to raise traits, or list the cost
        table. Standard and Arcane Experience are separate ledgers.

Syntax:
  +xp                                      View your own pools.
  +xp <player>                             View another player's pools.
  +xp/spend <trait>=<targetDots>           Spend XP to raise a trait.
  +xp/spend <trait>=<dots> for <player>    Spend XP on another sheet.
  +xp/list                                 Show the XP cost table.

Switches:
  /spend     Raise the named trait to the target dot count. Charges the
             cumulative per-dot cost from the current rating up to the
             target, drawn from Standard or Arcane XP.
  /list      Print the cost table.

Permissions:
  View                connected.
  Spend on self       connected.
  Spend on other      connected + canEdit (builder+).

Spending rules:
  XP is spent during downtime. Prerequisites must already be met (Merit
  prereqs, Attribute minimums for Skills, template gating for powers).

  Experiences cannot be granted directly. They flow through the Beat
  economy. Award Beats with +beat/add.

  Arcane-category costs draw from the Arcane pool. Mortals have no Arcane
  pool and cannot purchase Arcane traits.

  Specialty purchases go through +sheet/set specialty/<skill>=<name>.
  This command does not bill flat-cost categories automatically.

Cost table:
  Trait Type           Cost         Pool
  -------------------  -----------  ----------
  Attribute            4 / dot      Standard
  Skill                2 / dot      Standard
  Skill Specialty      1 flat       Standard
  Merit                1 / dot      Standard
  Willpower (perm)     2 / dot      Standard
  Integrity / morality 2 / dot      Standard
  Supernatural Power   4 / dot      Arcane
  Power Stat           5 / dot      Arcane

Examples:
  +xp                              View your own pools.
  +xp Marcus                       View Marcus's pools.
  +xp/spend strength=3             Raise your Strength to 3 (8 XP).
  +xp/spend athletics=2            Raise your Athletics to 2 (4 XP).
  +xp/spend vigor=2 for Marcus     Raise Marcus's Vigor to 2 (builder+).
  +xp/list                         Show the cost table.

See also: beat, sheet, cofd
