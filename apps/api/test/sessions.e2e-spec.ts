import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';

describe('Sessions (e2e) - manual env required', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Ensure OAuth env vars are present for providers initialized in AppModule
    process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? 'test-google-id';
    process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? 'test-google-secret';
    process.env.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? 'test-github-id';
    process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? 'test-github-secret';
    process.env.LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID ?? 'test-linkedin-id';
    process.env.LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET ?? 'test-linkedin-secret';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication(new ExpressAdapter());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/auth/sessions should require auth', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/auth/sessions');
    expect(res.status).toBe(401);
  });
});
