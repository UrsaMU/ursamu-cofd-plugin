+notes  -- Character notes with public/private visibility.

Syntax:
  +notes                                    Show your own notes.
  +notes <player>                           Show another player's visible notes.
  +notes <player>/<name>                    Show one note in full.
  +notes/add [<player>/]<name>=<text>       Create a note (public by default).
  +notes/edit [<player>/]<name>=<text>      Replace text of an existing note.
  +notes/del [<player>/]<name>              Delete a note.
  +notes/priv [<player>/]<name>=<vis>       Set visibility to public or private.

Permissions:
  View own         connected.
  View other       connected; private notes hidden unless admin+.
  Edit own         connected.
  Edit other       connected + canEdit (builder+).

Mechanics:
  Notes are character-scoped and stored on the player. Public notes
  are visible to everyone who can see the character. Private notes
  are visible only to the owner and staff (admin+, wizard).

  Limits:
    Name        up to 40 characters; letters, digits, spaces, '_', '-'.
    Text        up to 8000 characters.

  The name is normalised to a stable slug, so 'My Backstory' and
  'my_backstory' refer to the same note.

Examples:
  +notes
  +notes Alice
  +notes Alice/Backstory
  +notes/add Backstory=I was born in a small town near...
  +notes/edit Backstory=...rewritten...
  +notes/priv Backstory=private
  +notes/del Backstory
  +notes/add Bob/Secret=A staff-authored secret note about Bob.

See also: sheet, finger, cg
