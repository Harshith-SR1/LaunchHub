# API Routes

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /auth/request-password-reset`
- `POST /auth/reset-password`
- `POST /auth/verify-email`
- `POST /auth/mfa/setup`
- `POST /auth/mfa/verify`
- `GET /auth/oauth/:provider`
- `GET /auth/oauth/:provider/callback`

## Users

- `GET /users/me`
- `PATCH /users/me`
- `POST /users/kyc`

## Health

- `GET /health`
- `GET /health/ready`

## Planned marketplace routes

- `GET /projects`
- `POST /projects`
- `GET /domains`
- `POST /domains`
- `GET /websites`
- `GET /apps`
- `GET /investments`
- `GET /messages`
- `GET /notifications`
- `GET /reports/ai`
