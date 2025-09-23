Table USERS {
  user_id int [pk, note: "User's unique identifier"]
  username varchar [note: "Username"]
  email varchar [unique, note: "User's email address (unique)"]
  password_hash varchar [note: "Hashed password for security"]
  created_at datetime [note: "Timestamp of account creation"]
}

Table NOTEBOOKS {
  notebook_id int [pk, note: "Notebook's unique identifier"]
  user_id int [note: "Owner of the notebook"]
  name varchar [note: "Name of the notebook"]
  created_at datetime [note: "Timestamp of notebook creation"]
}

Table NOTES {
  note_id int [pk, note: "Note's unique identifier"]
  user_id int [note: "Owner of the note"]
  notebook_id int [note: "Notebook the note belongs to (optional)"]
  title varchar [note: "Title of the note"]
  content text [note: "Main content of the note"]
  created_at datetime [note: "Timestamp of note creation"]
  updated_at datetime [note: "Timestamp of last note update"]
}

Table TAGS {
  tag_id int [pk, note: "Tag's unique identifier"]
  user_id int [note: "Owner of the tag"]
  name varchar [unique, note: "Name of the tag (unique per user)"]
}

Table NOTE_TAGS {
  note_id int [pk, note: "Identifier of the note"]
  tag_id int [pk, note: "Identifier of the tag"]
}

// --- Relationships ---

// A user can have many notebooks, notes, and tags.
Ref: USERS.user_id < NOTEBOOKS.user_id
Ref: USERS.user_id < NOTES.user_id
Ref: USERS.user_id < TAGS.user_id

// A notebook can contain many notes.
Ref: NOTEBOOKS.notebook_id < NOTES.notebook_id

// Many-to-Many relationship for tags on notes.
Ref: NOTES.note_id < NOTE_TAGS.note_id
Ref: TAGS.tag_id < NOTE_TAGS.tag_id


UPDATE IF ANY CHANGES
VVVVVVVVVVVVVVVVVVVVVV



