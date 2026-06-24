Running e2e tests with Testcontainers

These tests spin up ephemeral Postgres and Redis containers, run Prisma migrations, and boot the Nest API to run real HTTP flows.

Prerequisites:
- Docker running locally
- Node.js (matching repo versions)
- `npx` available

From repo root run:

```powershell
# install deps for API workspace
npm ci --workspace @nexusforge/api
# run e2e tests (may take ~1-2 minutes to start containers and run migrations)
npm run test:e2e --workspace @nexusforge/api
```

Notes:
- Tests execute `npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma`. Ensure your migrations exist under `apps/api/prisma/migrations`.
- CI: set up service containers or use self-hosted runners with Docker enabled.
- If tests fail during migration, check that `prisma` is installed and migrations are present.
