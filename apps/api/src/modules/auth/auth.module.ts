import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EmailService } from '../../common/services/email.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { GoogleStrategyProvider } from './strategies/google.strategy.js';
import { GitHubStrategyProvider } from './strategies/github.strategy.js';
import { LinkedInStrategyProvider } from './strategies/linkedin.strategy.js';
import { UsersModule } from '../users/users.module.js';
import { RedisModule } from '../../common/modules/redis.module.js';
import { AdminModule } from '../admin/admin.module.js';
import { SessionsService } from './sessions.service.js';
import { SessionsController } from './sessions.controller.js';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    PassportModule,
    RedisModule,
    AdminModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as never,
      },
    }),
  ],
  controllers: [AuthController, SessionsController],
  providers: [AuthService, EmailService, JwtStrategy, GoogleStrategyProvider, GitHubStrategyProvider, LinkedInStrategyProvider, SessionsService],
  exports: [AuthService],
})
export class AuthModule {}