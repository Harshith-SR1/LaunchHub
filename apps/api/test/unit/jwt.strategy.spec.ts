import { JwtStrategy } from 'src/modules/auth/strategies/jwt.strategy';

describe('JwtStrategy (unit)', () => {
  const mockConfig: any = { get: jest.fn().mockReturnValue('dev-access-secret') };
  const mockPrisma: any = { session: { findUnique: jest.fn() } };

  it('allows when session exists and not revoked', async () => {
    mockPrisma.session.findUnique.mockResolvedValue({ id: 's1', revokedAt: null });
    const strat = new JwtStrategy(mockConfig as any, mockPrisma as any);
    const payload = { sub: 'u1', email: 'a@b', roles: ['CLIENT'], mfaVerified: true, sid: 's1' };
    await expect(strat.validate(payload as any)).resolves.toEqual(payload);
  });

  it('throws when session revoked', async () => {
    mockPrisma.session.findUnique.mockResolvedValue({ id: 's2', revokedAt: new Date() });
    const strat = new JwtStrategy(mockConfig as any, mockPrisma as any);
    const payload = { sub: 'u1', email: 'a@b', roles: ['CLIENT'], mfaVerified: true, sid: 's2' };
    await expect(strat.validate(payload as any)).rejects.toThrow();
  });

  it('allows payloads without sid for compatibility', async () => {
    const strat = new JwtStrategy(mockConfig as any, mockPrisma as any);
    const payload = { sub: 'u1', email: 'a@b', roles: ['CLIENT'], mfaVerified: true };

    await expect(strat.validate(payload as any)).resolves.toEqual(payload);
  });
});
