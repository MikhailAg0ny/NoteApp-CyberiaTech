# NoteApp-CyberiaTech — Framework summary

This file documents the frameworks, stack, and where the pieces live in this repository.

## Stack overview
- Frontend: Next.js (App Router) + React + TypeScript + Tailwind CSS. UI is componentized (modals, sidebar, theme provider).
- Backend: Express.js + PostgreSQL (node-postgres `pg`) with JWT authentication and bcrypt password hashing.
- Database: PostgreSQL schema defined in `backend/migrations/init.sql` (users, notebooks, notes, tags, note_tags).

## Key frontend locations
- `frontend/src/app/layout.tsx` — application layout, mounts `Sidebar` and `ThemeProvider`.
- `frontend/src/app/page.tsx` — main notes page: fetches notes, notebooks, tags; renders grid and opens modals.
- `frontend/src/app/login/page.tsx` — login/register UI (stores JWT in localStorage).
- `frontend/src/app/components/` — UI components:
	- `Sidebar.tsx` — navigation and notebook list; dispatches custom DOM events for modal/filter actions.
	- `CreateNoteModal.tsx` — form to create a note (now supports notebooks & tags).
	- `NoteModal.tsx` — full note view/edit modal (view after create or on select).
	- `SettingsModal.tsx`, `ThemeProvider.tsx` — settings and theme management.
- Styling: `frontend/globals.css`, `tailwind.config.js`, `postcss.config.js`.

## Key backend locations
- `backend/index.js` — Express bootstrap, CORS helper, runs migrations, mounts routes.
- `backend/db.js` — Postgres pool connection (driven by `.env`).
- `backend/migrations/init.sql` — canonical schema (users, notebooks, notes, tags, note_tags).
- `backend/routes/*.js` — route wiring (`auth`, `notes`, `notebooks`, `tags`).
- `backend/controllers/*.js` — controllers implementing request handling and validation.
- `backend/models/*.js` — SQL data access using `pg` (noteModel adapts to schema and aggregates tags/notebook info).
- `backend/middleware/auth.js` — JWT verification middleware used to protect routes.

## How the pieces interact (data flow)
1. User logs in/registers via frontend `login` page → backend `auth` controller issues JWT.
2. Frontend stores token in `localStorage` and includes `Authorization: Bearer <token>` on requests.
3. Express `auth` middleware validates token, sets `req.user.user_id`.
4. Notes flow: frontend POST/PUT/GET to `/api/notes` → `notesController` → `noteModel` performs parameterized SQL queries against `notes`, `notebooks`, `tags`, `note_tags` tables.
5. On create/update, the backend returns an enriched note object including `notebook_name` and `tags` so the frontend can render badges without extra calls.

## Edit points (where to change behavior)
- Frontend UI and interactions: edit `frontend/src/app/page.tsx`, `CreateNoteModal.tsx`, `NoteModal.tsx`, `Sidebar.tsx`.
- Backend behavior & data: edit `backend/controllers/*.js` and `backend/models/*.js`. Database changes go in `backend/migrations/*.sql`.

## Run / dev notes (quick)
1. Backend: set environment variables (PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT, JWT_SECRET) then in `backend/`:

```powershell
cd backend
npm install
node index.js
```

2. Frontend: in `frontend/`:

```powershell
cd frontend
npm install
npm run dev
```

Notes: the frontend expects `NEXT_PUBLIC_API_BASE` (e.g. `http://localhost:5000`) if not default. Backend applies SQL migrations from `backend/migrations` at startup.

## Next recommended tasks
- Add simple notebook creation UI in the Sidebar.
- Add tag autocomplete / suggestions when adding tags.
- Add keyboard shortcuts to `NoteModal` (Esc to close, Ctrl+S to save).

-- End of summary

