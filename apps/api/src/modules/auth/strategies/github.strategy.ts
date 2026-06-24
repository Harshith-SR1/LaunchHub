import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy as GitHubStrategy } from 'passport-github2';

@Injectable()
export class GitHubStrategyProvider extends PassportStrategy(GitHubStrategy, 'github') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID') ?? '',
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET') ?? '',
      callbackURL: `${config.get<string>('API_URL') ?? 'http://localhost:4000'}/api/v1/auth/oauth/github/callback`,
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: (err: any, user?: any, info?: any) => void) {
    const user = {
      provider: 'github',
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
      displayName: profile.displayName || profile.username,
      accessToken,
      refreshToken,
      profile,
    };

    done(null, user);
  }
}
