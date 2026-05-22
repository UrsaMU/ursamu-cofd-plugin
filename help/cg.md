+cg  -- Interactive, six-stage character generation. Each stage validates
        point budgets before advancing.

Syntax:
  +cg                       View current stage and progress.
  +cg/set <trait>=<value>   Distribute points or pick a template option.
  +cg/back                  Return to the previous stage.
  +cg/reset                 Start over with a blank Mortal sheet.
  +cg/submit                Validate the current stage and advance.

Stages:
  1. Core Identity        Concept, Virtue, Vice.
  2. Supernatural Template  Mortal, Vampire, Werewolf, Mage, Changeling.
  3. Template Specifics   Clan, Auspice, Path, Seeming, etc.
  4. Attributes           Distribute {5, 4, 3} extra dots above base 1.
  5. Skills               Distribute {11, 9, 7} dots.
  6. Powers               Mortal 0, Vamp/Were/Chan 3, Mage 6.

Notes:
  +cg/submit on stage 6 finalizes the sheet to state.cofd and clears the
  chargen workspace. After submission, edits go through +sheet/set.

Examples:
  +cg/set concept=Street Detective
  +cg/set virtue=Just
  +cg/submit
  +cg/set template=vampire
  +cg/submit
  +cg/set clan=Daeva
  +cg/set Strength=3
  +cg/submit

See also: sheet, roll
