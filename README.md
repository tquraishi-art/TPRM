# Website Backend and Admin

Short guide to run the local development server, create an admin, run smoke checks, and build a Docker image.

**Prerequisites**
- **Node**: v18+ (tested with Node 20 in Docker)
- **npm**: bundled with Node
- **Optional**: Redis for production session store

**Quick start (local)**

1. Install dependencies

```bash
npm ci
```

2. Start the server (development, in-memory sessions)

```bash
npm start
```

The app listens on `http://localhost:3000` by default.

**Environment**
- **SESSION_SECRET**: secret for express-session (set to a secure value in production)
- **SESSION_MAX_AGE**: session cookie max age in ms (default 86400000)
- **REDIS_URL**: optional Redis URL to enable Redis-backed sessions
- **GITHUB_CLIENT_ID** / **GITHUB_CLIENT_SECRET**: optional GitHub OAuth
- **BASE_URL**: base callback URL for OAuth (defaults to `http://localhost:3000`)
- **PORT**: server port (default 3000)

Create an `.env` file or export environment variables in your shell before running.

**Create admin user**

On first run, you can create the first user via the CLI which will be elevated to ADMIN:

```bash
node bin/cli.js create-admin --email admin@local --password password
```

Alternatively, use the `POST /api/register` endpoint for the first user; subsequent user creation requires an ADMIN account.

**Admin UI**
- Open `http://localhost:3000/admin/` to access the admin console. Login with the admin credentials created above or use GitHub OAuth if configured.

**Smoke tests (manual)**
Examples to exercise the main flows (login, create metric, list users/audits):

```bash
# Login (saves cookie to cookies.txt)
curl -c cookies.txt -H "Content-Type: application/json" -d '{"email":"admin@local","password":"password"}' http://localhost:3000/api/login

# Create a metric (authenticated)
curl -b cookies.txt -H "Content-Type: application/json" -d '{"name":"smoke","value":1}' http://localhost:3000/api/metrics

# List metrics
curl -b cookies.txt http://localhost:3000/api/metrics

# List users (ADMIN only)
curl -b cookies.txt http://localhost:3000/api/users

# View audit logs (ADMIN only)
curl -b cookies.txt http://localhost:3000/api/audit
```

**Automated tests**

Run Jest (if present in this repo):

```bash
npx jest --runInBand --colors --verbose
```

**Docker**

Build the image locally:

```bash
docker build -t website-backend:local .
```

Run locally:

```bash
docker run -p 3000:3000 --env SESSION_SECRET=replace-me website-backend:local
```

CI / Publishing
- GitHub Actions workflows are configured in `.github/workflows/` for tests and Docker publishing to GHCR. Push to the repository to trigger CI.

**Troubleshooting**
- If authenticated endpoints return `unauthenticated`, confirm the session cookie is present and sent by the client. Curl tests above use `-c` / `-b` to persist cookies.
- In production, set `REDIS_URL` to use a Redis session store to avoid lost sessions on multiple instances.
- If OAuth routes are used, ensure `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` and `BASE_URL` are set.

**Relevant files**
- `server.js` — main Express server and route setup
- `server_helpers.js` — DB helpers, migrations and permission helpers
- `lib/rbac.js` — RBAC helpers and middleware
- `admin/index.html` — admin UI static client
- `bin/cli.js` — helper CLI (create-admin, migrate, list-perms)

If you want, I can add an automated Jest smoke test that runs the sequence used above. Tell me if you'd like that added.
# Website Backend

This workspace contains a minimal Express backend, a SQLite data store for metrics, and optional Redis-backed sessions.

Quick start (development):

1. Install dependencies
```bash
cd /Users/tquraishi/Desktop/Website
npm install
```

2. Seed DB
```bash
npm run seed
```

3a. (Optional) Start Redis via Docker Compose
```bash
docker-compose up -d
export REDIS_URL=redis://127.0.0.1:6379
```

3b. Or start Redis via Homebrew
```bash
brew install redis
brew services start redis
export REDIS_URL=redis://127.0.0.1:6379
```

4. Start the server
```bash
npm start
```

Production with Docker
----------------------

Build the image and run with Docker Compose (production):

```bash
# set a strong SESSION_SECRET first
export SESSION_SECRET="$(openssl rand -hex 32)"
docker compose -f docker-compose.prod.yml up --build -d
```

The SQLite database file is mounted at `./db.sqlite` so data persists on the host.

Endpoints
- `GET /api/metrics` — returns metrics JSON
- `POST /api/resume` — (requires Redis) checks session existence; returns 501 if Redis is not configured

Notes
- For development the server falls back to an in-memory session store when `REDIS_URL` is not set.
- Admin UI is currently disabled; it can be re-enabled once AdminJS compatibility is resolved for your Node version.
 
## New features added

- Per-resource permission storage in SQLite `permissions` table.
- Runtime `requirePermission(resource, action)` middleware in `lib/rbac.js`.
- CLI helper `bin/cli.js` with `create-admin`, `migrate`, and `list-perms` commands.
- Audit viewer improvements: filtering and JSON export in `admin/index.html`.

## CLI usage

Run the local CLI via npm script:

```bash
npm run cli -- migrate
npm run cli -- create-admin --email admin@local --password password
npm run cli -- list-perms
```

Note: the CLI requires Node and the workspace dependencies installed.

## GitHub OAuth

To enable GitHub OAuth set these environment variables (example):

```bash
export GITHUB_CLIENT_ID=your_client_id
export GITHUB_CLIENT_SECRET=your_client_secret
# Optional, defaults to http://localhost:3000
export BASE_URL=https://your-domain.example
```

Then restart the server. OAuth routes available when configured:
- `/auth/github` — start GitHub login
- `/auth/github/callback` — OAuth redirect URI

On successful login the user will be created (if missing) with `EDITOR` role by default.

## Docker image build & publish

This repo includes a `Dockerfile` to build a production image and a GitHub Actions workflow to build and publish the image to GitHub Container Registry (GHCR) on pushes to `main`/`master`.

To publish locally:

```bash
# build and push to GHCR (login first: echo $PAT | docker login ghcr.io -u USER --password-stdin)
./scripts/build_and_push.sh ghcr.io YOUR_USER/TPRM latest
```

To enable GitHub Actions publishing, ensure the repository has `GITHUB_TOKEN` (default) with `packages: write` permission.

# TPRM
# TPRM
# TPRM
