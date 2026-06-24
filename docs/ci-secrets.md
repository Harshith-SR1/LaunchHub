CI & Secrets for NexusForge

- GitHub Actions secrets (required):
  - `DATABASE_URL` - Postgres connection string for CI (test DB)
  - `REDIS_URL` or `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
  - `OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GOOGLE_CLIENT_SECRET` (and equivalents for GitHub/LinkedIn)
  - `S3_ENDPOINT`, `S3_KEY`, `S3_SECRET`, `S3_BUCKET`
  - `PRISMA_SCHEMA` (optional override)

- Notes:
  - For end-to-end tests use a disposable test database and a disposable Redis instance (Testcontainers or ephemeral infra).
  - Do NOT commit secret values; use GitHub Secrets or a vault. For Kubernetes, create secrets via `kubectl create secret generic redis-secret --from-literal=redis-password="..."`.

- Example GH Action step snippet to set env for API tests:

  - name: Run API e2e tests
    run: |
      npm ci --workspace @nexusforge/api
      npm run test:e2e --workspace @nexusforge/api
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      REDIS_URL: ${{ secrets.REDIS_URL }}
      JWT_ACCESS_SECRET: ${{ secrets.JWT_ACCESS_SECRET }}
      JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}

