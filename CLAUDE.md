# CLAUDE.md — Chronicles of Darkness (CoFD) Plugin Workspace

Workspace instructions for the Chronicles of Darkness UrsaMU plugin development.

## 🛠 Command Reference
*   **Scaffold Commands**: `npx @lhi/ursamu-dev scaffold <name> [--with-routes] [--with-tests]`
*   **Run Deno Tests**: `deno test -A --reload tests/`
*   **Advance Stage (Design Confirm)**: `bash ~/.gemini/skills/skills/ursamu-dev/hooks/advance-stage.sh --confirm-design`
*   **Advance Stage (Audit Pass)**: `bash ~/.gemini/skills/skills/ursamu-dev/hooks/advance-stage.sh --pass-audit`

---

## 📈 Development Workflow (ursamu-dev 6-Stage Cycle)
We must follow the strict `ursamu-dev` workflow to ensure safety, alignment, and robust design:
1.  **Stage 0: Design**: Research rules, choose command regex, draft invariants, and publish the AAAK Design Plan block for user approval. Run the `--confirm-design` hook.
2.  **Stage 1: Generate**: Write code following standard UrsaMU patterns in `/Users/kumakun/github/ursamu-cofd-plugin/index.ts`, `commands.ts`, etc.
3.  **Stage 2: Audit**: Run the 18-point checklist (privilege checks, injection, `canEdit`, DBO operations).
4.  **Stage 3: Refine**: Remediate checklist items. Run the `--pass-audit` hook.
5.  **Stage 4: Test**: Deno test coverage and run `/tdd-audit` exploit testing cycles.
6.  **Stage 5: Docs**: Update `help/cofd.md` and `README.md`.

---

## 🎲 Chronicles of Darkness (CoFD) Core Rules
### 1. Stats and Traits
*   **Mental Attributes**: Intelligence, Wits, Resolve
*   **Physical Attributes**: Strength, Dexterity, Stamina
*   **Social Attributes**: Presence, Manipulation, Composure
*   **Mental Skills**: Academics, Computer, Crafts, Investigation, Medicine, Occult, Politics, Science
*   **Physical Skills**: Athletics, Brawl, Drive, Firearms, Larceny, Stealth, Survival, Weaponry
*   **Social Skills**: Animal Ken, Empathy, Expression, Intimidation, Persuasion, Socialize, Streetwise, Subterfuge
*   **Untrained Penalties**: -3 dice penalty for Mental Skills, -1 dice penalty for Physical/Social Skills.

### 2. Rolling Mechanics
*   **Standard Roll**: Pool = `Attribute + Skill + Modifiers`. Roll D10s.
*   **Successes**: Roll of `8, 9, or 10` is a success.
*   **10-Again**: Roll of `10` is a success AND is rerolled (can chain).
*   **Exceptional Success**: Achieving `5 or more successes`. Triggers a beneficial condition (e.g., Inspired).
*   **Chance Die**: If the pool drops to `0 or lower`, roll a single **Chance Die**:
    *   Succeeds *only* on a `10` (no rerolls allowed).
    *   A roll of `1` is a **Dramatic Failure** (things get worse).

---

## 💻 Code Conventions
### 1. Imports and Scope
*   Use `jsr:@ursamu/ursamu` for core game APIs (`addCmd`, `registerPluginRoute`, `DBO`, `dbojs`, `gameHooks`).
*   **Workers (System Scripts)**: Never import `jsr:@ursamu/ursamu` inside system scripts; use the injected `u` SDK object instead.
*   **Permissions**: Guard database writes or edits using `await u.canEdit(u.me, target)` and `isAdmin` checks where appropriate.

### 2. Database Modifications
*   Always use `u.db.modify(id, op, data)`. The operator `op` **must** be exactly `"$set"`, `"$unset"`, or `"$inc"`.
*   Character sheets are stored in the player object's `state.cofd` state record to prevent cluttering the root state.

---

## 🎯 Command Invariants
*   `+sheet [<player>]` (connected): Displays formatted character sheet.
*   `+sheet/set <stat>=<value>` (connected/builder+): Modifies character stats.
*   `+roll <stat>[+<skill>][+<modifier>]` (connected): Calculates and executes a CoFD-compliant roll with 10-again, exceptional success, and chance die rules.
