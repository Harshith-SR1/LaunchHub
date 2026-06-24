import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import * as bcrypt from 'bcryptjs';
import { randomUUID, createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import QRCode from 'qrcode';
import { EmailService } from '../../common/services/email.service.js';
import { RedisService } from '../../common/services/redis.service.js';
import { AuditService } from '../admin/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';

type RegisterInput = {
  email: string;
  username: string;
  fullName: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
  mfaCode?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
    private readonly auditService: AuditService,
  ) {}

  private accessSecret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret';
  private refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';

  async register(input: RegisterInput) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email or username already exists');
    }

    const [clientRole, sellerRole] = await Promise.all([
      this.ensureRole('CLIENT'),
      this.ensureRole('SELLER'),
    ]);

    const passwordHash = await bcrypt.hash(input.password, 12);
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        username: input.username.toLowerCase(),
        fullName: input.fullName,
        passwordHash,
        status: 'PENDING' as any,
        roles: {
          create: [{ roleId: clientRole.id }, { roleId: sellerRole.id }],
        },
        profile: {
          create: {},
        },
        verificationTokens: {
          create: {
            token: verificationToken,
            expiresAt,
          },
        },
      },
      include: {
        roles: { include: { role: true } },
        profile: true,
      },
    });

    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return this.buildAuthResponse(user);
  }

  async login(input: LoginInput, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        roles: { include: { role: true } },
        mfa: true,
      },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.mfa?.enabled) {
      if (!input.mfaCode) {
        return {
          mfaRequired: true,
          message: 'MFA code required',
        };
      }

      const verified = authenticator.verify({
        token: input.mfaCode,
        secret: user.mfa.secret,
      });

      if (!verified) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
      throw new UnauthorizedException('Account is not active');
    }

    // Create session first so we can include session id in access token (sid)
    const placeholderHash = `pending_${randomUUID()}`;
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: placeholderHash,
        ipAddress: undefined,
        userAgent,
        expiresAt: new Date(Date.now() + this.getRefreshTtlMillis()),
      },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.roles.map((role: any) => role.role.name), session.id);
    const refreshHash = await this.hashToken(tokens.refreshToken);

    await this.prisma.session.update({ where: { id: session.id }, data: { refreshTokenHash: refreshHash } });

    try {
      await this.redisService.set(`refresh:${refreshHash}`, session.id, Math.floor(this.getRefreshTtlMillis() / 1000));
    } catch (err) {
      // Redis failure shouldn't block login flow
    }

    try {
      await this.auditService.log({
        userId: user.id,
        action: 'session.create',
        entityType: 'session',
        entityId: session.id,
        ipAddress: null,
        userAgent: userAgent ?? null,
        metadata: {},
      });
    } catch (err) {
      // ignore audit errors
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), status: 'ACTIVE' as any },
    });

    return {
      ...tokens,
      user: await this.usersService.getMe(user.id),
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    return this.issueTokens(payload.sub, payload.email, payload.roles);
  }

  async logout(refreshToken: string) {
    const hashedToken = await this.hashToken(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hashedToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    try {
      await this.redisService.del(`refresh:${hashedToken}`);
    } catch (err) {
      // non-fatal
    }

    try {
      await this.auditService.log({
        userId: null,
        action: 'session.revoke',
        entityType: 'session',
        entityId: null,
        ipAddress: null,
        userAgent: null,
        metadata: { hashedToken },
      });
    } catch (err) {
      // ignore
    }

    return { success: true };
  }

  async verifyEmail(token: string) {
    const tokenRecord = await this.prisma.verificationToken.findUnique({ where: { token } });

    if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.verificationToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: {
          emailVerifiedAt: new Date(),
          status: 'ACTIVE' as any,
        },
      }),
    ]);

    return { success: true };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return { success: true };
    }

    const token = randomUUID();
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    await this.emailService.sendVerificationEmail(user.email, token);
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return { success: true };
    }

    const token = randomUUID();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      },
    });

    await this.emailService.sendPasswordResetEmail(user.email, token);
    return { success: true };
  }

  async resetPassword(input: { token: string; password: string }) {
    const tokenRecord = await this.prisma.passwordResetToken.findUnique({ where: { token: input.token } });

    if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { token: input.token },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.session.updateMany({
        where: { userId: tokenRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { success: true };
  }

  async me(userId: string) {
    return this.usersService.getMe(userId);
  }

  async setupMfa(userId: string) {
    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(userId, 'NexusForge', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    await this.prisma.mfaSecret.upsert({
      where: { userId },
      update: { tempSecret: secret, method: 'TOTP', enabled: false },
      create: { userId, secret: secret, tempSecret: secret, method: 'TOTP', enabled: false },
    });

    return {
      secret,
      otpAuthUrl,
      qrCodeDataUrl,
    };
  }

  async verifyMfa(userId: string, token: string) {
    const mfa = await this.prisma.mfaSecret.findUnique({ where: { userId } });
    if (!mfa) {
      throw new BadRequestException('MFA is not configured');
    }

    const secretToVerify = mfa.tempSecret ?? mfa.secret;
    const verified = authenticator.verify({ token, secret: secretToVerify });

    if (!verified) {
      throw new BadRequestException('Invalid MFA token');
    }

    await this.prisma.mfaSecret.upsert({
      where: { userId },
      update: { secret: secretToVerify, tempSecret: null, enabled: true },
      create: { userId, secret: secretToVerify, enabled: true, method: 'TOTP' },
    });

    return { success: true };
  }

  getOAuthUrl(provider: string) {
    const normalized = provider.toUpperCase();
    const redirectUri = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';

    if (!['GOOGLE', 'GITHUB', 'LINKEDIN'].includes(normalized)) {
      throw new BadRequestException('Unsupported OAuth provider');
    }

    return {
      provider: normalized,
      url: `${redirectUri}/auth/oauth/${normalized.toLowerCase()}`,
    };
  }

  async handleOAuthCallback(provider: string, request: { user?: { id: string } }) {
    const normalized = provider.toUpperCase();
    const external = (request.user as any) ?? null;

    if (!external) {
      throw new BadRequestException('No OAuth profile returned from provider');
    }

    const providerAccountId = external.providerId ?? external.id ?? external.providerAccountId;
    if (!providerAccountId) {
      throw new BadRequestException('OAuth provider did not return an id');
    }

    // Try to find existing OAuth account
    const existingAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: normalized as any,
          providerAccountId: providerAccountId.toString(),
        },
      },
      include: { user: { include: { roles: { include: { role: true } }, profile: true } } },
    });

    let user = existingAccount?.user ?? null;

    // If no oauth account, try to link by email
    if (!user) {
      const email = external.email?.toLowerCase?.() ?? external.emails?.[0]?.value?.toLowerCase?.();
      if (email) {
        user = await this.prisma.user.findUnique({
          where: { email },
          include: { roles: { include: { role: true } }, profile: true },
        });
      }
    }

    // If still no user, create one
    if (!user) {
      const email = external.email?.toLowerCase?.() ?? null;
      const baseUsername = email ? email.split('@')[0] : `${normalized.toLowerCase()}_${String(providerAccountId).slice(0, 8)}`;
      let username = baseUsername;
      let suffix = 0;
      while (await this.prisma.user.findUnique({ where: { username } })) {
        suffix += 1;
        username = `${baseUsername}${suffix}`;
      }

      const [clientRole, sellerRole] = await Promise.all([this.ensureRole('CLIENT'), this.ensureRole('SELLER')]);

      user = await this.prisma.user.create({
        data: {
          email: email ?? `${normalized.toLowerCase()}+${providerAccountId}@no-reply.nexusforge.local`,
          username,
          fullName: external.displayName ?? username,
          passwordHash: null,
          status: 'ACTIVE' as any,
          emailVerifiedAt: email ? new Date() : null,
          roles: { create: [{ roleId: clientRole.id }, { roleId: sellerRole.id }] },
          profile: { create: { avatarUrl: external.profile?.photos?.[0]?.value ?? external.profile?.picture ?? null } },
        },
        include: { roles: { include: { role: true } }, profile: true },
      });
    }

    // Ensure OAuth account exists/updated
    try {
      await this.prisma.oAuthAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: normalized as any,
            providerAccountId: providerAccountId.toString(),
          },
        },
        update: {
          accessToken: external.accessToken ?? undefined,
          refreshToken: external.refreshToken ?? undefined,
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          provider: normalized as any,
          providerAccountId: providerAccountId.toString(),
          accessToken: external.accessToken ?? undefined,
          refreshToken: external.refreshToken ?? undefined,
        },
      });
    } catch (err) {
      // ignore unique races
    }


    // Create session first to include session id in access token
    const placeholderHash = `pending_${randomUUID()}`;
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: placeholderHash,
        ipAddress: (request as any).ip ?? (request as any).headers?.['x-forwarded-for'] ?? null,
        userAgent: (request as any).headers?.['user-agent'] ?? null,
        expiresAt: new Date(Date.now() + this.getRefreshTtlMillis()),
      },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.roles.map((r: any) => r.role.name), session.id);
    const refreshHash = await this.hashToken(tokens.refreshToken);

    await this.prisma.session.update({ where: { id: session.id }, data: { refreshTokenHash: refreshHash } });

    try {
      await this.redisService.set(`refresh:${refreshHash}`, session.id, Math.floor(this.getRefreshTtlMillis() / 1000));
    } catch (err) {
      // ignore Redis errors
    }

    return {
      provider: normalized,
      tokens,
      user: await this.usersService.getMe(user.id),
    };
  }

  private async ensureRole(name: string) {
    return this.prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  private async issueTokens(userId: string, email: string, roles: string[], sessionId?: string) {
    const payload: any = { sub: userId, email, roles, mfaVerified: true };
    if (sessionId) payload.sid = sessionId;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as never,
    });
    const refreshToken = await this.jwtService.signAsync({ sub: userId, email, roles }, {
      secret: this.refreshSecret,
      expiresIn: (process.env.JWT_REFRESH_TTL ?? '30d') as never,
    });

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; email: string; roles: string[] }>(refreshToken, {
        secret: this.refreshSecret,
      });

      const hash = await this.hashToken(refreshToken);

      try {
        const exists = await this.redisService.exists(`refresh:${hash}`);
        if (exists) return payload;
      } catch (err) {
        // fallback to DB check
      }

      const session = await this.prisma.session.findFirst({ where: { refreshTokenHash: hash, revokedAt: null } });
      if (!session) throw new UnauthorizedException('Invalid refresh token');

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getRefreshTtlMillis() {
    return 1000 * 60 * 60 * 24 * 30;
  }

  private buildAuthResponse(user: any) {
    return {
      user: {
        ...user,
        roles: (user.roles ?? []).map((assignment: any) => assignment.role.name),
      },
      message: 'Registration successful. Verification email sent.',
    };
  }
}