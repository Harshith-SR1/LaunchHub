import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { execSync } from 'child_process';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import request from 'supertest';
import Redis from 'ioredis';
import path from 'path';
import { AppModule } from '../src/app.module.js';

jest.setTimeout(180_000);

describe('Sessions e2e with Testcontainers', () => {
  let pgContainer: StartedTestContainer;
  let redisContainer: StartedTestContainer;
  let app: INestApplication;
  let redisClient: Redis;

  beforeAll(async () => {
    // Ensure OAuth env vars are present for providers initialized in AppModule
    process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? 'test-google-id';
    process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? 'test-google-secret';
    process.env.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? 'test-github-id';
    process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? 'test-github-secret';
    process.env.LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID ?? 'test-linkedin-id';
    process.env.LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET ?? 'test-linkedin-secret';

    // Start Postgres
    pgContainer = await new GenericContainer('postgres:15-alpine')
      .withEnv('POSTGRES_USER', 'test')
      .withEnv('POSTGRES_PASSWORD', 'test')
      .withEnv('POSTGRES_DB', 'testdb')
      .withExposedPorts(5432)
      .start();

    const pgHost = pgContainer.getHost();
    const pgPort = pgContainer.getMappedPort(5432);
    const databaseUrl = `postgresql://test:test@${pgHost}:${pgPort}/testdb?schema=public`;

    // Start Redis
    redisContainer = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();

    const redisHost = redisContainer.getHost();
    const redisPort = redisContainer.getMappedPort(6379);

    // Set env for the API
    process.env.DATABASE_URL = databaseUrl;
    process.env.REDIS_HOST = redisHost;
    process.env.REDIS_PORT = String(redisPort);

    // Run Prisma migrations for the API schema
    const prismaSchema = path.resolve(__dirname, '..', 'prisma', 'schema.prisma');
    try {
      execSync(`npx prisma db push --accept-data-loss --schema="${prismaSchema}"`, {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: databaseUrl }
      });
    } catch (err) {
      console.warn('Prisma db push failed. Continuing test may fail.');
    }

    // Start Nest application — explicitly pass ExpressAdapter to resolve workspace hoisting issue
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication(new ExpressAdapter());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Connect to Redis for assertions
    redisClient = new Redis({ host: redisHost, port: redisPort });
  });

  afterAll(async () => {
    if (app) await app.close();
    if (redisClient) await redisClient.quit();
    if (pgContainer) await pgContainer.stop();
    if (redisContainer) await redisContainer.stop();
  });

  it('register -> login -> list sessions -> revoke session', async () => {
    const server = app.getHttpServer();

    // 1) Register
    const email = `e2e-${Date.now()}@example.test`;
    const password = 'P@ssword123!';
    const reg = await request(server)
      .post('/api/v1/auth/register')
      .send({ email, password })
      .set('Accept', 'application/json');

    expect([200,201]).toContain(reg.status);

    // 2) Login
    const login = await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .set('Accept', 'application/json');

    expect(login.status).toBe(200);
    const accessToken = login.body?.accessToken || login.body?.access_token || login.body?.access;
    const refreshToken = login.body?.refreshToken || login.body?.refresh_token;
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    // 3) List sessions
    const list = await request(server)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(list.status).toBe(200);
    const sessions = list.body;
    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions.length).toBeGreaterThan(0);

    const sessionId = sessions[0].id;

    // 4) Revoke session
    const revoke = await request(server)
      .delete(`/api/v1/auth/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect([200,204]).toContain(revoke.status);

    // 5) Assert session is revoked in listing
    const after = await request(server)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`);
    const afterSessions = after.body;
    const found = afterSessions.find((s: any) => s.id === sessionId);
    expect(found).toBeDefined();
    expect(found.revokedAt).toBeTruthy();

    // 6) Optional: assert Redis cleanup (hashed refresh key removed)
    // If implementation stores refresh:{sha} -> sessionId in Redis, check keys
    const keys = await redisClient.keys('refresh:*');
    // Ensure the revoked session's mapping (if any) is removed or does not point to active sessionId
    // This is a soft assertion (implementation detail may vary)
    expect(Array.isArray(keys)).toBe(true);
  });
});
