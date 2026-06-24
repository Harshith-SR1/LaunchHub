import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: any;
  }) {
    const { userId, action, entityType, entityId, ipAddress, userAgent, metadata } = params;
    return this.prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        metadata: metadata ?? {},
      },
    });
  }

  async query(opts: { userId?: string; entityType?: string; entityId?: string; skip?: number; take?: number }) {
    const where: any = {};
    if (opts.userId) where.userId = opts.userId;
    if (opts.entityType) where.entityType = opts.entityType;
    if (opts.entityId) where.entityId = opts.entityId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: opts.skip ?? 0, take: opts.take ?? 50 }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}
