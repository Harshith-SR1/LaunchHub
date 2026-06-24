import { SessionsService } from 'src/modules/auth/sessions.service';

describe('SessionsService (unit)', () => {
  const mockPrisma: any = {
    session: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockRedis: any = { del: jest.fn() };
  const mockAudit: any = { log: jest.fn() };

  let svc: SessionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new SessionsService(mockPrisma as any, mockRedis as any, mockAudit as any);
  });

  it('lists sessions for a user', async () => {
    mockPrisma.session.findMany.mockResolvedValue([{ id: 's1', userAgent: 'ua', ipAddress: '1.2.3.4', expiresAt: new Date(), revokedAt: null, createdAt: new Date() }]);
    const result = await svc.listUserSessions('user1');
    expect(Array.isArray(result)).toBe(true);
    expect(mockPrisma.session.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user1' } }));
  });

  it('revokes own session', async () => {
    mockPrisma.session.findUnique.mockResolvedValue({ id: 's1', userId: 'user1', refreshTokenHash: 'h' });
    mockPrisma.session.update.mockResolvedValue({});
    const res = await svc.revokeSession('user1', 's1', false, []);
    expect(res).toEqual({ success: true });
    expect(mockRedis.del).toHaveBeenCalledWith('refresh:h');
    expect(mockAudit.log).toHaveBeenCalled();
  });

  it('forbids revoking others when not admin', async () => {
    mockPrisma.session.findUnique.mockResolvedValue({ id: 's2', userId: 'other', refreshTokenHash: 'h' });
    await expect(svc.revokeSession('user1', 's2', false, [])).rejects.toThrow();
  });

  it('allows admin to revoke another users session when permitted', async () => {
    mockPrisma.session.findUnique.mockResolvedValue({ id: 's3', userId: 'other', refreshTokenHash: 'h3' });
    mockPrisma.session.update.mockResolvedValue({});

    const res = await svc.revokeSession('admin-user', 's3', true, ['ADMIN']);

    expect(res).toEqual({ success: true });
    expect(mockPrisma.session.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 's3' } }));
    expect(mockRedis.del).toHaveBeenCalledWith('refresh:h3');
  });

  it('revokes all active sessions for a user', async () => {
    mockPrisma.session.findMany.mockResolvedValue([
      { id: 's1', refreshTokenHash: 'h1' },
      { id: 's2', refreshTokenHash: 'h2' },
    ]);
    mockPrisma.session.updateMany.mockResolvedValue({ count: 2 });

    const res = await svc.revokeAllUserSessions('user1');

    expect(res).toEqual({ revoked: 2 });
    expect(mockPrisma.session.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ['s1', 's2'] } } }));
    expect(mockRedis.del).toHaveBeenCalledWith('refresh:h1');
    expect(mockRedis.del).toHaveBeenCalledWith('refresh:h2');
  });
  });
