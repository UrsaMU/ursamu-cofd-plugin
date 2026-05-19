# Chronicles of Darkness (CoFD) UrsaMU Plugin

A highly modular, completely file-driven supernatural template plugin for **UrsaMU**, supporting a fully guided interactive character generation experience (`+cg`), dynamic ASCII character sheet layouts (`+sheet`), and standard Chronicles of Darkness d10 10-Again rolling mechanics (`+roll`).

---

## 🚀 Key Features

*   **File-Driven Supernatural Templates**: Add any supernatural template (Mortal, Vampire, Werewolf, Mage, Changeling, etc.) just by adding a new JSON file to the `templates/` directory on startup. No engine changes required!
*   **6-Stage Guided Character Generation (`+cg`)**: Walks new players step-by-step through setting core identity, choosing supernatural templates, filling template specifics, distributing category-invariant points (Attributes `{5, 4, 3}`, Skills `{11, 9, 7}`), and allocating starting supernatural powers.
*   **Dynamic ASCII Sheet Engine**: Beautiful, exactly 78-character wide retro ASCII display tailored automatically to the player's active supernatural template (adapting section headers, custom attributes, power traits, and energy levels).
*   **10-Again Roll Parser**: Fully compliant Chronicles of Darkness d10 roller resolving untrained skill penalties (-3 Mental, -1 Physical/Social), specialty bonuses (+1 die), willpower spending (+3 dice), and chance die rules for <= 0 pools.
*   **Robust Security & Integrity**: Blocks unapproved sheet views or edits for players mid-character creation.

---

## 🛠️ CLI Commands

| Command | Syntax | Lock | Description |
|---------|--------|------|-------------|
| `+cg` | `+cg` | `connected` | Display guided chargen instructions, progress status, and current choices. |
| `+cg/set` | `+cg/set <trait>=<value>` | `connected` | Distribute points or choose options in the active creation stage. |
| `+cg/back` | `+cg/back` | `connected` | Move back one creation stage to adjust past decisions. |
| `+cg/reset` | `+cg/reset` | `connected` | Clear current character generation state and start over at Stage 1 as a Mortal. |
| `+cg/submit` | `+cg/submit` | `connected` | Validate point math and choices. If valid, advance to the next stage (or finalize sheet). |
| `+sheet` | `+sheet [<player>]` | `connected` | View approved dynamic ASCII character sheet of target. Blocked if unapproved. |
| `+sheet/set`| `+sheet/set <stat>=<value>` | `connected` | Manually edit sheet attributes, skills, or add specialties (Builder/Admin, or approved player self-edit). |
| `+roll` | `+roll <expression>[+<modifier>][/willpower]` | `connected` | Execute standard CoFD D10 dice rolls with modifiers, specialties, and 10-again rules. |

---

## 🛠️ Setup & Development

The plugin is designed for the **UrsaMU** framework using **Deno**.

### File Structure
*   `templates/` - Supernatural JSON configuration files.
*   `templates.ts` - Startup scanning and loading of template assets.
*   `cofd.ts` - Sheet models, ASCII sheet formatting layout, and roll parsing engine.
*   `cg.ts` - 6-Stage Character Generation engine and point-spent math validation.
*   `commands.ts` - Game command command-parsers and sheet security boundaries.
*   `tests/` - Complete unit and BDD integration test suite.

### Running Tests
Execute the comprehensive test suite with:
```bash
deno test -A --unstable-kv tests/
```

All commands, mechanics, roll calculations, and 6-stage guided creation states are 100% covered and verified.
