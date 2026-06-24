import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../../common/services/redis.service.js';
import { AuditService } from '../admin/audit.service.js';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService, private readonly audit: AuditService) {}

  async listUserSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      select: { id: true, ipAddress: true, userAgent: true, expiresAt: true, revokedAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return sessions;
  }

  async revokeSession(userId: string, sessionId: string, allowAdmin = false, currentUserRoles: string[] = []) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    if (session.userId !== userId && !(allowAdmin && currentUserRoles.includes('ADMIN'))) {
      throw new ForbiddenException('Not authorized to revoke this session');
    }

    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });

    try {
      await this.redis.del(`refresh:${session.refreshTokenHash}`);
    } catch (err) {
      // ignore redis errors
    }

    try {
      await this.audit.log({
        userId: session.userId,
        action: 'session.revoke',
        entityType: 'session',
        entityId: session.id,
        ipAddress: null,
        userAgent: null,
        metadata: { revokedBy: userId },
      });
    } catch (err) {
      // ignore audit errors
    }

    return { success: true };
  }

  async revokeAllUserSessions(userId: string) {
    const sessions: any[] = await this.prisma.session.findMany({ where: { userId, revokedAt: null } });
    const ids = sessions.map((s: any) => s.id);

    await this.prisma.session.updateMany({ where: { id: { in: ids } }, data: { revokedAt: new Date() } });

    try {
      await Promise.all(sessions.map((s: any) => this.redis.del(`refresh:${s.refreshTokenHash}`)));
    } catch (err) {
      // ignore
    }

    return { revoked: ids.length };
  }
}
