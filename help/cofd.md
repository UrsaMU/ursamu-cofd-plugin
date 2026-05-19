# Chronicles of Darkness (CoFD) Plugin Help

The Chronicles of Darkness (CoFD) plugin provides a fully file-driven supernatural template engine, interactive character creation, and a standard D10 10-Again roll parser.

---

## 🎨 Interactive Character Generation (+cg)

Before viewing or modifying character sheets, players must complete their character sheet through the 6-stage interactive guide.

### Syntax
*   `+cg` — View current instructions, stage details, allocated traits, and progress.
*   `+cg/set <trait>=<value>` — Distribute points or choose a supernatural template choice.
    *   *Examples:* `+cg/set concept=Street Knight`, `+cg/set Strength=3`, `+cg/set Persuasion=2`
*   `+cg/back` — Move back one stage to correct previous choices.
*   `+cg/reset` — Reset character generation back to a blank Mortal sheet at Stage 1.
*   `+cg/submit` — Validate current stage point allocations. If successful, advances to next stage or finalizes character sheet.

### Stages
1.  **Core Identity:** Concept, Virtue, Vice.
2.  **Supernatural Template:** Choose template (Mortal, Vampire, Werewolf, Mage, Changeling).
3.  **Template Specifics:** Set template-specific fields (e.g. Clan, Auspice, Path, Seeming).
4.  **Attributes Allocation:** Allocation of `{5, 4, 3}` extra dots above base 1.
5.  **Skills Allocation:** Allocation of `{11, 9, 7}` dots.
6.  **Supernatural Powers:** Starting powers dots validation (Mortal = 0, Vampire/Werewolf/Changeling = 3, Mage = 6).

---

## 🎲 Character Sheets (+sheet)

Display and modify character sheets once character generation is complete.

### Syntax
*   `+sheet [<player>]` — Display formatted ASCII character sheet of target player.
*   `+sheet/set <stat>=<value>` — Directly set character sheet traits (Admin/Builder only, or Self once approved).
    *   *Examples:* `+sheet/set Academics=4`, `+sheet/set specialty:Academics=History`
*   `+sheet/set specialty:<skill>=` — Remove a specialty from a skill.
    *   *Example:* `+sheet/set specialty:Academics=`

---

## 🎲 10-Again Rolls (+roll)

Execute standard CoFD d10 rolls with untrained penalties, specialty bonuses, willpower spends, and 10-again rerolls.

### Syntax
*   `+roll <expression>[+<modifier>][/willpower]`
    *   Expressions can be attribute names, skill names, combos, or direct dice values.
    *   *Examples:*
        *   `+roll Strength+Brawl` (Combo roll)
        *   `+roll Strength+Brawl+2` (Combo roll with modifier)
        *   `+roll Vigor` (Template power trait roll)
        *   `+roll 6` (Raw dice pool roll)
        *   `+roll Strength+Brawl/willpower` (Combo roll spending 1 Willpower point for +3 dice)

### Mechanics
*   **Successes:** Any dice rolling `8`, `9`, or `10`.
*   **10-Again:** All rolls of `10` are kept as successes and rerolled.
*   **Chance Die:** Pools at `0` or below roll a single Chance Die. Succeeds only on `10`. A roll of `1` is a **Dramatic Failure**.
*   **Exceptional Success:** Getting `5 or more successes`.

---

## See Also
*   `help cofd` — This plugin overview
*   `help rolls` — Rules of D10 10-again rolling
