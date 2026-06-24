# Architecture

## System shape

NexusForge uses a monorepo with a Next.js frontend, a NestJS API, a PostgreSQL database through Prisma, Redis for cache and async coordination, S3-compatible storage for uploads, Socket.io for realtime collaboration, and Elasticsearch for search.

## First module sequence

1. Authentication and identity
2. User profile and KYC
3. Dashboard shell
4. Marketplace primitives
5. Asset, escrow, and transaction workflows

## Security baseline

- JWT access tokens with refresh sessions
- OAuth provider accounts linked to a single user
- MFA secrets stored server-side and verified with time-based one-time codes
- Global validation, rate limiting, and structured error handling
- Audit log records for sensitive actions

## Service boundaries

- Web app handles UX, auth screens, dashboards, and marketplace views
- API owns business rules, authentication, authorization, payments, escrow, notifications, and search indexing
- Prisma owns the shared schema and migration history
