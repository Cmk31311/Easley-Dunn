# Caddy (Cerberus)

Block for `cerberus.easleydunnproductions.com`.

Full deploy steps: `../RUNBOOK.md`.

Traffic goes over Docker network `cerberus_edge`. No host ports on the app containers.

## File

- `Caddyfile.cerberus` — site block for the shared Caddy on the VPS

## Routes

- `/api/*` → `cerberus_api` (`handle_path` drops `/api`)
- everything else → `cerberus_web`

## Check with compose

- Names: `cerberus_api`, `cerberus_web`
- Both on `cerberus_edge`
- Ports in the Caddyfile match the containers (defaults: API `5000`, web `80`)

## Host

1. Create `cerberus_edge` if needed; attach Caddy to it
2. Merge `Caddyfile.cerberus` into `/home/seezle/Caddyfile`
3. Reload Caddy
4. Start the stack from `/home/seezle/cerberus` with `docker-compose`

## Env (build / API)

```text
REACT_APP_API_URL=https://cerberus.easleydunnproductions.com/api
API_URL=https://cerberus.easleydunnproductions.com/api
CORS_ORIGINS=https://cerberus.easleydunnproductions.com
```

`CORS_ORIGINS` is the site origin (invite/reset links). No `/api` on that value.

## Smoke test

- https://cerberus.easleydunnproductions.com/
- https://cerberus.easleydunnproductions.com/api/health
