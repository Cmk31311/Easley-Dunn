# Cerberus deployment runbook

Production deployment for Cerberus on the DocMost VPS.

| | |
| --- | --- |
| Host folder | `/home/seezle/cerberus` |
| Public URL | `https://cerberus.easleydunnproductions.com` |
| Containers | `cerberus_api`, `cerberus_web`, `cerberus_db` |
| API runtime | Node **24** |
| API listen port | **5000** |
| Web listen port | **80** |
| Edge network | `cerberus_edge` (not `seezle_default`) |
| Compose CLI | `docker-compose` (hyphen; Compose plugin not installed) |
| Release repo (target) | `ProfessorEasley/Cerberus_Gating` |

Related paths in this repo:

| Path | Purpose |
| --- | --- |
| `deploy/caddy/Caddyfile.cerberus` | Caddy site block |
| `deploy/caddy/README.md` | Edge routing notes |
| `deploy/guides/` | Per-integration production key setup |
| `backend/.env.example` | Full environment variable list |
| `frontend/.env.example` | Frontend build variables |
| `backend/migrations/` | SQL migrations (`node-pg-migrate`) |
| `docs/` | Integration technical docs |

`Dockerfile`s and `docker-compose.yml` ship with the release and live on the server next to `.env`. They are required for go-live.

---

## 1. Responsibilities

| Area | Owns |
| --- | --- |
| Dockerfiles, `docker-compose.yml`, image tags | Application team |
| Build `cerberus_api` / `cerberus_web` (`linux/amd64`) | Application team |
| Production `.env` values and secret generation | Application team (ops places file on host) |
| Migrations (`npm run migrate`) | Application team (run on host against API container) |
| First-admin bootstrap (not `seed:dev`) | Application team |
| SMTP for invites / password reset | Application team + ops |
| Integration keys and Automate go-live | Application team + Prof (keys) + ops (mounts) |
| DNS, patch/reboot/swap, Caddy, `cerberus_edge` | Host ops |
| Image load, `docker-compose up`, health curls, `pg_dump` | Host ops |
| This runbook when compose/ports/env change | Whoever changes them |

Cerberus must **not** join `seezle_default`.

---

## 2. Locked values

| Item | Value |
| --- | --- |
| DB container | `cerberus_db` |
| DB name | `cerberus` |
| DB user | `cerberus_app` |
| DB password | generated once; only in server `.env` |
| `DB_SCHEMA` | `refactor` |
| `DB_SSL` | `false` |
| API `PORT` | `5000` |
| `CORS_ORIGINS` | `https://cerberus.easleydunnproductions.com` (first entry = invite/reset link base) |
| `API_URL` | `https://cerberus.easleydunnproductions.com/api` |
| `REACT_APP_API_URL` | `https://cerberus.easleydunnproductions.com/api` (web **build** arg) |
| `mem_limit` db / api / web | `512m` / `512m` / `128m` |
| Image delivery (beta) | `docker save` → copy tar → `docker load` (no paid registry) |

`PASSWORD_PEPPER` and `SESSION_SECRET`: generate once before any accounts exist. Do not rotate pepper after passwords are hashed.

Do **not** run `npm run seed:dev` in production (script refuses `NODE_ENV=production`; those users are throwaway).

---

## 3. Compose requirements (application team)

`docker-compose.yml` on the server must satisfy:

- Service names: `cerberus_api`, `cerberus_web`, `cerberus_db`
- `cerberus_api` and `cerberus_web` on external network `cerberus_edge`
- `cerberus_db` on a private network shared only with the API
- No published host ports on `cerberus_*`
- `mem_limit`: db `512m`, api `512m`, web `128m`
- API image: Node 24, listens on `5000`, includes migrations + `npm run migrate`
- Web image: static UI on port `80` (e.g. nginx), built with production `REACT_APP_API_URL`
- Env file: `/home/seezle/cerberus/.env` injected into API (and DB credentials as needed)
- Credential dirs mounted into the API container at paths the app expects under the backend working directory:

| Host (under `/home/seezle/cerberus/`) | Inside API container |
| --- | --- |
| `googlecloud_json/` | `…/googlecloud_json/` |
| `googleanalytics_json/` | `…/googleanalytics_json/` |
| `googledrive_json/` | `…/googledrive_json/` |
| `googleplay_json/` | `…/googleplay_json/` |
| `bigquery_json/` | `…/bigquery_json/` |
| `firebase_json/` | `…/firebase_json/` |
| `apple_key/` | `…/apple_key/` |

App resolves credentials relative to the backend package (`backend/<folder>/`). Compose must mount accordingly. Create folders only when that integration is going live; empty dirs are fine until then.

Logging: pick one and stick to it — bind-mount `logs/` for `logs/error.log` + `logs/combined.log`, or stdout-only and use `docker-compose logs`.

---

## 4. Secrets and production `.env`

Generate before first accounts:

```bash
openssl rand -base64 48   # SESSION_SECRET (min 32 chars; rotating signs everyone out)
openssl rand -base64 32   # PASSWORD_PEPPER (required in prod; rotating locks everyone out)
```

Minimum server `.env`:

```text
NODE_ENV=production
DB_SSL=false
DB_SCHEMA=refactor
DATABASE_URL=postgresql://cerberus_app:<password>@cerberus_db:5432/cerberus
SESSION_SECRET=<from openssl above>
PASSWORD_PEPPER=<from openssl above>
CORS_ORIGINS=https://cerberus.easleydunnproductions.com
API_URL=https://cerberus.easleydunnproductions.com/api
PORT=5000
LOG_LEVEL=info
```

**Mail (required before invites or password-reset email):**

```text
MAIL_SMTP_HOSTNAME=<smtp host>
MAIL_SMTP_PORT=<587 or 465>
MAIL_SMTP_USERNAME=<user>
MAIL_SMTP_PASSWORD=<pass>
MAIL_FROM=cerberus@easleydunnproductions.com
```

Port `465` uses TLS (`secure: true`). Without working SMTP, new users cannot receive invite/reset links.

**Session defaults (override only if needed):**

```text
SESSION_COOKIE_NAME=sid
SESSION_IDLE_MINUTES=30
SESSION_ABSOLUTE_HOURS=8
SESSION_SAMESITE=lax
```

Production sets `secure` cookies whenever `NODE_ENV` is not `development`/`test`. The API uses `trust proxy` behind Caddy so Secure cookies and rate limits see the real client. Same-site `lax` is correct when UI and API share the public origin.

**Connectors** — only when that service is live. Missing connector env does not stop the server; grant fails when used. Full list: `backend/.env.example`.

| Integration | Credential folder | Notable env |
| --- | --- | --- |
| Google Cloud | `googlecloud_json/` | (key file only) |
| Google Analytics | `googleanalytics_json/` | `GOOGLE_ANALYTICS_PARENT_RESOURCE` |
| Google Drive | `googledrive_json/` | `GOOGLE_DRIVE_FOLDER_ID` |
| Google Play | `googleplay_json/` | `GOOGLE_PLAY_DEVELOPERID` |
| BigQuery | `bigquery_json/` | (see docs) |
| Firebase | `firebase_json/` | (see docs) |
| Apple App Store Connect | `apple_key/` and/or env | `APPLE_KEY_ID`, `APPLE_ISSUER_ID`, `APPLE_PRIVATE_KEY` |
| Kanboard | — | `KANBOARD_API_*`, `KANBOARD_DEFAULT_*` |
| Discord | — | `DISCORD_*` (not wired for prod yet) |

Changing `REACT_APP_API_URL` requires rebuilding `cerberus_web`.

---

## 5. Frontend build (application team)

From `frontend/`:

- Build-time: `REACT_APP_API_URL=https://cerberus.easleydunnproductions.com/api`
- Optional: `REACT_APP_GOOGLE_CLIENT_ID` (omit if Google sign-in is unused; login is form-based)
- Output: `npm run build` → static assets served by the web image on port 80

Bake `REACT_APP_*` into the image at build time. Runtime `.env` on the host does not change a shipped web bundle.

---

## 6. Images (build → transfer → load)

Build **off the VPS** from a release tag. On Apple Silicon, target `linux/amd64`.

```bash
# build machine — after tagging images to match compose
docker save cerberus_api:<tag> cerberus_web:<tag> -o cerberus-<tag>.tar

# copy tar to the VPS, then:
docker load -i cerberus-<tag>.tar
```

Postgres (`cerberus_db`) remains a normal public image pull. Skip `docker-compose pull` for API/web when using load.

Optional later: free registry (e.g. GHCR) and pull-by-tag instead of tar transfer.

---

## 7. One-time host setup

1. Patch/reboot and add swap as planned.
2. Create the external network once:

```bash
docker network create cerberus_edge
```

3. Attach the existing Caddy container to `cerberus_edge`.
4. Merge `deploy/caddy/Caddyfile.cerberus` into `/home/seezle/Caddyfile`.
5. Validate and reload Caddy the same way DocMost is reloaded.
6. Create `/home/seezle/cerberus` and the layout in §8.
7. Point DNS: `cerberus.easleydunnproductions.com` → this server.
8. Confirm Cerberus is not on `seezle_default`.

**Caddy routing (locked):**

- `https://…/api/*` → `cerberus_api:5000` (`handle_path` strips `/api`)
- everything else → `cerberus_web:80`

API routes have **no** `/api` prefix inside the container. Public clients use `/api/...`.

---

## 8. Server layout

```text
/home/seezle/cerberus/
  docker-compose.yml
  .env
  logs/                       # if file logging is chosen
  googlecloud_json/
  googleanalytics_json/
  googledrive_json/
  googleplay_json/
  bigquery_json/
  firebase_json/
  apple_key/
```

Place compose + `.env` before first `up`. Key folders only when needed.

---

## 9. First install

**Prerequisites:** compose + `.env` on server, images loaded, Caddy live, DNS live, SMTP configured if invites are required on day one.

```bash
cd /home/seezle/cerberus

docker-compose up -d

# apply migrations (DB_SCHEMA=refactor must already be set in .env)
docker-compose exec cerberus_api npm run migrate -- up
# if exec does not fit the image layout:
# docker-compose run --rm cerberus_api npm run migrate -- up
```

Ensure schema `refactor` exists for a fresh Postgres volume if migrations do not create it. App and migrate both require `DB_SCHEMA=refactor`; wrong schema looks like an empty database.

### First ADMIN

An empty production database has no login. `POST /admin/roles/grant` cannot assign `ADMIN`. Do **not** use `npm run seed:dev`.

Run the release’s documented one-time bootstrap (SQL or script shipped with the release). Change the temporary password on first HTTPS login.

Until bootstrap exists and has been run, the stack is not ready for users.

Then §11 health checks and an admin login smoke test.

---

## 10. Deploy a new release

```bash
cd /home/seezle/cerberus

# load (or pull) new images for the release tag; update compose tags if needed
docker-compose up -d

docker-compose exec cerberus_api npm run migrate -- up

curl -sS https://cerberus.easleydunnproductions.com/api/health
curl -sS https://cerberus.easleydunnproductions.com/api/health/db
```

If the web image changed, hard-refresh the browser.

Release notes should call out: migration safety, whether rollback needs `migrate down` or DB restore, and any new env/key folders.

---

## 11. Health checks and smoke

Through Caddy:

```bash
curl -sS https://cerberus.easleydunnproductions.com/
curl -sS https://cerberus.easleydunnproductions.com/api/health
curl -sS https://cerberus.easleydunnproductions.com/api/health/db
```

Expect UI HTML on `/`, JSON success on both health routes.

On the host:

```bash
cd /home/seezle/cerberus
docker-compose ps
docker-compose logs --tail=100 cerberus_api
docker-compose logs --tail=100 cerberus_web
docker-compose logs --tail=50 cerberus_db
```

Smoke:

1. Admin sign-in over HTTPS (Secure cookie + `trust proxy`).
2. Change temporary password if this was first bootstrap.
3. If SMTP is live: invite a test user, confirm mail and link host (`CORS_ORIGINS` first entry).
4. Optional: grant/revoke one enabled integration for a test account; confirm in provider console and Cerberus audit.

---

## 12. Logs

In production the API writes Winston files `logs/error.log` and `logs/combined.log` relative to process CWD, plus console. Compose must either:

- bind-mount host `logs/` to that directory, or
- rely on stdout and `docker-compose logs` (and accept or disable file transports in the image)

---

## 13. Backups

Nightly `pg_dump` inside the DB container:

| Item | Value |
| --- | --- |
| Container | `cerberus_db` |
| Database | `cerberus` |
| User | `cerberus_app` |

Example pattern (adjust path/schedule to host practice):

```bash
docker-compose exec -T cerberus_db \
  pg_dump -U cerberus_app -d cerberus \
  > /path/to/backups/cerberus-$(date +%F).sql
```

Test restore on a scratch volume before relying on it. Prefer restore over `migrate down` when a release’s schema change is unsafe to reverse.

---

## 14. Memory

| Container | mem_limit |
| --- | --- |
| `cerberus_db` | 512m |
| `cerberus_api` | 512m |
| `cerberus_web` | 128m |

~1.125 GB total against ~2.3 GB free on the host (DocMost + OS + swap need headroom). Locked for beta; raise only if monitoring requires it.

---

## 15. Integrations go-live

Keys stay off the server until that stage. Production key guides:

- Google Cloud: `deploy/guides/google-cloud-prod-key.md`
- Google Analytics: `deploy/guides/google-analytics-prod-key.md`

Deep technical docs: `docs/` (Play, BigQuery, Drive, Analytics, App Store Connect, Google Cloud, Firebase, Kanboard, Discord).

When enabling a connector:

1. Prof / owner creates provider credentials.
2. Place key files in the matching folder under `/home/seezle/cerberus/` (mounted into API).
3. Set connector env in `.env`.
4. `docker-compose up -d` (or restart `cerberus_api`).
5. Onboard and offboard a test user; confirm provider console + Cerberus audit.

To disable one integration without full rollback: remove that folder / env and restart API. Users already granted may need Manual offboard.

---

## 16. Rollback

1. Note previous image tags.
2. Point compose at those tags (or `docker load` the previous tar).
3. `docker-compose up -d`
4. `migrate down` only if release notes require it; otherwise restore a DB backup.
5. Re-run §11.

---

## 17. Quick commands

```bash
cd /home/seezle/cerberus

docker-compose up -d
docker-compose down
docker-compose ps
docker-compose logs -f cerberus_api

docker-compose exec cerberus_api npm run migrate -- up
docker-compose exec cerberus_api npm run migrate -- down
```

Migrate dry-run (when useful on a break-glass shell with the same env):

```bash
docker-compose exec cerberus_api npm run migrate -- up -- --dry-run
```

---

## 18. Common failures

| Symptom | Check |
| --- | --- |
| API will not start / DB SSL errors | `DB_SSL=false` |
| API refuses to start: secret too short | `SESSION_SECRET` ≥ 32 chars |
| Browser calls blocked / login odd | `CORS_ORIGINS`, HTTPS, rebuild web if `REACT_APP_API_URL` wrong |
| `/api/...` 404 on API | Caddy `handle_path` strip; container routes have no `/api` prefix |
| Empty app / missing tables | `DB_SCHEMA=refactor`; ran `migrate up`; schema exists |
| Invite links wrong host | First entry of `CORS_ORIGINS` is the public site origin (no `/api`) |
| Invites never arrive | `MAIL_*` SMTP; test from API logs |
| Sign-in does nothing over HTTP | `NODE_ENV=production` requires HTTPS for Secure cookies |
| Cannot log in after pepper change | Pepper rotated; hashes invalid |
| No way to sign in on empty DB | First-admin bootstrap not run; do not use `seed:dev` |
| Grant fails for one provider | Missing key folder mount or connector env |
| OOM / container killed | `mem_limit` and host free memory vs DocMost |

---

## 19. Go-live checklist

**Application / release**

- [ ] Dockerfiles + `docker-compose.yml` (networks, volumes, mounts, `mem_limit`, no published ports)
- [ ] Images built for `linux/amd64` when building on Apple Silicon
- [ ] Web image baked with `REACT_APP_API_URL=https://cerberus.easleydunnproductions.com/api`
- [ ] `.env` filled: locked DB/CORS/API values, `SESSION_SECRET`, `PASSWORD_PEPPER`, `DB_SCHEMA=refactor`
- [ ] SMTP (`MAIL_*`) working if invites/reset are required
- [ ] First-admin bootstrap documented, tested, and not `seed:dev`
- [ ] Migration command verified against the API image
- [ ] Caddy ports still match compose (API `5000`, web `80`)
- [ ] Any day-one integrations: keys + env + mount paths ready
- [ ] If a shared DB ever saw `seed:dev`, remove `dev-*@test.invalid` users before treating it as prod

**Host / edge**

- [ ] Swap / patch as planned
- [ ] DNS live
- [ ] `cerberus_edge` created; Caddy attached; site block merged and reloaded
- [ ] `/home/seezle/cerberus` layout + `.env` + compose in place
- [ ] Images loaded
- [ ] `up` → migrate → health curls green
- [ ] Admin login over HTTPS; temporary password changed
- [ ] Backup job: `cerberus_db` / `cerberus` / `cerberus_app`
- [ ] Logging approach chosen (bind-mount or stdout)
