import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') ?? 'dev-access-secret',
    });
  }

  async validate(payload: { sub: string; email: string; roles: string[]; mfaVerified: boolean; sid?: string }) {
    // If token carries a session id (sid), ensure the session still exists and is not revoked.
    if (payload.sid) {
      const session = await this.prisma.session.findUnique({ where: { id: payload.sid } });
      if (!session || session.revokedAt) {
        throw new UnauthorizedException('Session revoked');
      }
    }

    return payload;
  }
}