import { Controller, Delete, Get, Param, Req, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { SessionsService } from './sessions.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@Controller('auth/sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async list(@Req() req: { user: { sub: string; roles?: string[] } }, @Query('userId') userId?: string) {
    // allow admins to list sessions for any user
    if (userId && userId !== req.user.sub && !(req.user.roles ?? []).includes('ADMIN')) {
      throw new ForbiddenException('Not authorized');
    }

    return this.sessionsService.listUserSessions(userId ?? req.user.sub);
  }

  @Delete(':id')
  async revoke(@Req() req: { user: { sub: string; roles?: string[] } }, @Param('id') id: string) {
    return this.sessionsService.revokeSession(req.user.sub, id, true, req.user.roles ?? []);
  }

  @Delete()
  async revokeAll(@Req() req: { user: { sub: string } }) {
    return this.sessionsService.revokeAllUserSessions(req.user.sub);
  }
}
