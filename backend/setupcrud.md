How you can run this now

Open Powershell at: c:\GITHUB REPOSITORY FILES FOR COLLEGE\NoteApp-CyberiaTech\backend

Copy .env.example to .env and fill your DB password:

copy .env.example .env
# then edit .env with your editor to set PGPASSWORD

Install dependencies:
npm install


Create the database and table (psql or pgAdmin). With psql:

psql -U postgres -c "CREATE DATABASE noteapp;"
psql -U postgres -d noteapp -c "CREATE TABLE notes (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"


Start the server:
npm run dev

Test the endpoints:
GET all notes: GET http://localhost:5000/api/notes
POST create note: POST http://localhost:5000/api/notes with JSON body { "title":"Hi", "content":"Hello" }