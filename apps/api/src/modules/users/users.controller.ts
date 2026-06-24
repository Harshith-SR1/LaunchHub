import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { UsersService } from './users.service.js';
import {
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  IsEmail,
  MinLength,
} from 'class-validator';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  githubUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  availability?: string;

  @IsOptional()
  @IsString()
  location?: string;
}

class KycDto {
  @IsString()
  legalName!: string;

  @IsString()
  country!: string;

  @IsString()
  documentType!: string;

  @IsString()
  documentNumber!: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() request: { user: { sub: string } }) {
    return this.usersService.getMe(request.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Req() request: { user: { sub: string } }, @Body() body: UpdateProfileDto) {
    return this.usersService.updateMe(request.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('kyc')
  async submitKyc(@Req() request: { user: { sub: string } }, @Body() body: KycDto) {
    return this.usersService.submitKyc(request.user.sub, body);
  }
}