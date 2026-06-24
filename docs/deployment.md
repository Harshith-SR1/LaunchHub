# Deployment

## Local

- `docker compose up -d` for PostgreSQL, Redis, Elasticsearch, and S3-compatible storage
- Run Prisma migrations
- Start API and web applications separately

## Production

- Build both apps into Docker images
- Run API behind an ingress with TLS termination
- Use managed PostgreSQL, Redis, search, and object storage where available
- Deploy with rolling updates and health probes
- Keep secrets in a cloud secret manager or Kubernetes secrets store

## Kubernetes baseline

- `Namespace` for NexusForge
- ConfigMap for non-secret runtime configuration
- Deployments for web and API
- Services for internal routing
- Ingress for public traffic
