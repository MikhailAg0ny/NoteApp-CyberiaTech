Dashboard / Home

Route: /
Purpose: quick overview (recent notes, favorites, notebooks, quick-create)
Data: latest notes, counts per notebook/tag
Type: server for initial load + small client widgets
UX: prominent quick-create input, keyboard shortcut hint
Notes List (all)

Route: /notes
Purpose: paginated/searchable list of notes
Data: list with title/preview, sort/filter params
Type: server for SSR list + client for filters/sorting
UX: bulk actions (delete, move to notebook), infinite scroll or pagination
Note Detail (view)

Route: /notes/[id]
Purpose: read full note, metadata, tags, attachments
Data: note content, notebook, tags, created/updated timestamps
Type: server component for SEO + client for interactive features (comments, reactions)
UX: copy/share, export, read-only toggle
New Note (create)

Route: /notes/new or modal on any page
Purpose: create note quickly (title, body, tags, notebook)
Data: POST to backend, optional autosave/draft
Type: client component (forms, validation)
UX: autosave drafts, undo, keyboard shortcuts, template selection
Edit Note

Route: /notes/[id]/edit
Purpose: full WYSIWYG/Markdown editing and save history
Data: PATCH/PUT to backend, conflict handling
Type: client for editor + autosave background sync
UX: version history, live preview toggle, save status indicator
Notebooks / Collections

Route: /notebooks and /notebooks/[id]
Purpose: organize notes grouped by notebook
Data: notebook list, notes per notebook
Type: mix server/client
UX: reordering, rename, share notebook link
Tags Explorer

Route: /tags and /tags/[tag]
Purpose: filter and browse notes by tag
Data: tag counts and notes per tag
Type: server for tag pages, client for tag management
UX: tag suggestions, bulk tag add/remove
Search

Route: /search or integrated in header
Purpose: full-text search with filters (title, content, tags, notebook)
Data: search API results, highlight matches
Type: client for instant results; server for deep queries
UX: keyboard-focus, recent searches, search operators
Trash / Archive

Route: /trash and /archive
Purpose: recover deleted notes or view archived ones
Data: soft-deleted flag, restore/delete permanently
Type: client for actions
UX: retention timer, bulk restore, confirm destructive actions
User Profile / Settings

Route: /settings (profile, prefs, theme, account)
Purpose: user preferences, theme toggle, API keys
Data: user settings endpoint
Type: client
UX: preview theme, export/import data, change password
Auth Pages (if not already)

Routes: /login, /register, /forgot-password
Purpose: authentication flows, magic links or OAuth
Data: auth endpoints, error handling
Type: client
UX: social login options, remember-me, redirect after login
Import / Export & Backup

Route: /import and /export
Purpose: import from/ export to Markdown/JSON/OPML, backup management
Data: file upload/download endpoints
Type: client for file handling
UX: progress UI, validation, dry-run preview
Admin / Diagnostics (optional)

Route: /admin or /dev-tools
Purpose: DB/migration status, logs, user management (internal)
Data: protected endpoints
Type: server + client
UX: restrict access, read-only options for non-admins