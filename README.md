# Swittix CRM sync server (Node.js + MySQL)

The desktop app always saves to its local SQLite database first. This server
receives those changes whenever the app can reach it and passes changes made
on other computers back. No internet = nothing is lost, changes wait as
"pending" in the app and upload automatically later.

## Set up

1. Create the database in MySQL:
   `CREATE DATABASE swittix_crm CHARACTER SET utf8mb4;`
2. `cp .env.example .env` and fill in the MySQL login and a long random `API_KEY`.
3. `npm install`
4. `npm start` (tables are created automatically on first start).
5. Check: open `http://SERVER:4000/health` in a browser.
6. In the desktop app: **Administration -> Sync**, enter the server address and
   the same API key, press **Connect**.

Put the server behind HTTPS (nginx / Caddy / your host's proxy) before using it
over the internet, because passwords hashes and student data travel to it.
Keep it running with `pm2 start src/server.js --name swittix-sync`.

## Folders

- `src/models/`      one file per synced table (columns, links, "same thing" keys)
- `src/controllers/` `syncController` (push / pull) and `filesController` (attachments)
- `src/routes/`      `/health`, `/api/ping`, `/api/sync/push`, `/api/sync/pull`, `/api/files/:uuid`
- `src/middleware/`  API key check
- `uploads/`         attached images / PDFs (created automatically)

## How syncing works

- Every row has a `uuid` shared by all computers and a `rev` number that grows
  with every change. Rows are never removed, only flagged `deleted`.
- **Push:** the app sends its queued changes, one table at a time, parents first.
- **Pull:** the app asks for everything with `rev` above the last one it saw.
- If the same user name or account name was created on two computers, the
  server keeps the first one and tells the other computer to use it.
- Conflicts: the last change to reach the server wins. A change still waiting to
  upload on a computer is not overwritten by a download.

## Adding a new synced table later

Add a model file, list it in `src/models/index.js`, and add the same table to
`lib/data/sync/sync_tables.dart` in the app (same order).
