import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  username!: string;

  @IsString()
  fullName!: string;

  @MinLength(8)
  password!: string;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  mfaCode?: string;
}

class TokenDto {
  @IsString()
  token!: string;
}

class ResetPasswordDto {
  @IsString()
  token!: string;

  @MinLength(8)
  password!: string;
}

class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginDto, @Headers('user-agent') userAgent?: string) {
    return this.authService.login(body, userAgent);
  }

  @Post('refresh')
  refresh(@Body() body: TokenDto) {
    return this.authService.refresh(body.token);
  }

  @Post('logout')
  logout(@Body() body: TokenDto) {
    return this.authService.logout(body.token);
  }

  @Post('verify-email')
  verifyEmail(@Body() body: TokenDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('resend-verification')
  resendVerification(@Body() body: ForgotPasswordDto) {
    return this.authService.resendVerification(body.email);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: { user: { sub: string } }) {
    return this.authService.me(request.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  setupMfa(@Req() request: { user: { sub: string } }) {
    return this.authService.setupMfa(request.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  verifyMfa(@Req() request: { user: { sub: string } }, @Body() body: TokenDto) {
    return this.authService.verifyMfa(request.user.sub, body.token);
  }

  @Get('oauth/:provider/url')
  oauthUrl(@Param('provider') provider: string) {
    return this.authService.getOAuthUrl(provider);
  }

  @Get('oauth/google')
  @UseGuards((require('@nestjs/passport').AuthGuard)('google'))
  oauthGoogle() {
    // initiates Google OAuth2 flow
    return;
  }

  @Get('oauth/github')
  @UseGuards((require('@nestjs/passport').AuthGuard)('github'))
  oauthGithub() {
    // initiates GitHub OAuth2 flow
    return;
  }

  @Get('oauth/google/callback')
  @UseGuards((require('@nestjs/passport').AuthGuard)('google'))
  oauthGoogleCallback(@Req() request: any) {
    return this.authService.handleOAuthCallback('google', request);
  }

  @Get('oauth/github/callback')
  @UseGuards((require('@nestjs/passport').AuthGuard)('github'))
  oauthGithubCallback(@Req() request: any) {
    return this.authService.handleOAuthCallback('github', request);
  }

  @Get('oauth/linkedin')
  @UseGuards((require('@nestjs/passport').AuthGuard)('linkedin'))
  oauthLinkedin() {
    // initiates LinkedIn OAuth2 flow
    return;
  }

  @Get('oauth/linkedin/callback')
  @UseGuards((require('@nestjs/passport').AuthGuard)('linkedin'))
  oauthLinkedinCallback(@Req() request: any) {
    return this.authService.handleOAuthCallback('linkedin', request);
  }

  @Get('oauth/:provider/callback')
  oauthCallback(@Param('provider') provider: string, @Req() request: any) {
    return this.authService.handleOAuthCallback(provider, request);
  }
}