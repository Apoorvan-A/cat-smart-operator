# Security

Owner: Claude 1 (implementation) + Claude 4 (review). Prototype-appropriate, not
production-hardened, but no obvious footguns.

## Authentication
- JWT (HS256) access tokens, expiry from `ACCESS_TOKEN_EXPIRE_MINUTES`.
- Passwords hashed with bcrypt (passlib). Never stored or logged in plaintext.
- Secrets come from environment (`.env`), never hardcoded, never committed.
  `.env` is gitignored; `.env.example` documents the keys.

## Authorization (RBAC)
Roles: `OPERATOR | SUPERVISOR | SAFETY_MANAGER | ADMIN`.

| Action | OPERATOR | SUPERVISOR | SAFETY_MANAGER | ADMIN |
|--------|:--:|:--:|:--:|:--:|
| View own tasks / machine / telemetry | ✅ | ✅ | ✅ | ✅ |
| Acknowledge own alerts | ✅ | ✅ | ✅ | ✅ |
| Escalate alert | ✅ | ✅ | ✅ | ✅ |
| Review incidents | ❌ | ✅ | ✅ | ✅ |
| View all operators/machines | ❌ | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |

Enforced via a FastAPI dependency (`require_role(...)`) at the router layer;
services assume the caller is already authorized.

## Input validation
- All request/response bodies are Pydantic models.
- Telemetry ingest validates ranges; impossible values are quarantined, not stored
  as live.

## Audit logging
- Alert acknowledge/escalate, incident create/review, and auth events write
  structured audit records (who / what / when).

## Other
- CORS restricted to `CORS_ORIGINS`.
- Rate limiting on `/auth/login` and `/telemetry/ingest`.
- No PII beyond synthetic operator names.
- The AI assistant cannot reach the DB or execute arbitrary tools — only the
  fixed, read-only fact tools in `API_CONTRACT.md`.
