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
  2. Supernatural Template  Mortal, Changeling: The Lost (changeling).
  3. Template Specifics   Seeming, Kith, Court, Needle, Thread.
  4. Attributes           Distribute {5, 4, 3} extra dots above base 1.
  5. Skills               Distribute {11, 9, 7} dots.
  6. Powers               Mortal 0, Changeling 3.

Notes:
  +cg/submit on stage 6 finalizes the sheet to state.cofd and clears the
  chargen workspace. After submission, edits go through +sheet/set.
  Use +notes to record your backstory and details of any complex merits.

Examples:
  +cg/set concept=Street Detective
  +cg/set virtue=Just
  +cg/submit
  +cg/set template=changeling
  +cg/submit
  +cg/set seeming=Fairest
  +cg/set court=Spring
  +cg/set Strength=3
  +cg/submit

See also: sheet, roll
