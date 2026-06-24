import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';

@Injectable()
export class LinkedInStrategyProvider extends PassportStrategy(LinkedInStrategy, 'linkedin') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('LINKEDIN_CLIENT_ID') ?? '',
      clientSecret: config.get<string>('LINKEDIN_CLIENT_SECRET') ?? '',
      callbackURL: `${config.get<string>('API_URL') ?? 'http://localhost:4000'}/api/v1/auth/oauth/linkedin/callback`,
      scope: ['r_liteprofile', 'r_emailaddress'],
      state: true,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: (err: any, user?: any, info?: any) => void) {
    const user = {
      provider: 'linkedin',
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
      displayName: profile.displayName,
      accessToken,
      refreshToken,
      profile,
    };

    done(null, user);
  }
}
