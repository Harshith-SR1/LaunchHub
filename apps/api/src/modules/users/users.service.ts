import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        profile: true,
        mfa: { select: { enabled: true, method: true } },
        kyc: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...safe } = user as any;

    return {
      ...safe,
      roles: user.roles.map((assignment: any) => assignment.role.name),
    };
  }

  async updateMe(
    userId: string,
    input: {
      fullName?: string;
      headline?: string;
      bio?: string;
      avatarUrl?: string;
      companyName?: string;
      websiteUrl?: string;
      linkedinUrl?: string;
      githubUrl?: string;
      skills?: string[];
      hourlyRate?: number;
      availability?: string;
      location?: string;
    },
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const profileData = {
      headline: input.headline,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
      companyName: input.companyName,
      websiteUrl: input.websiteUrl,
      linkedinUrl: input.linkedinUrl,
      githubUrl: input.githubUrl,
      skills: input.skills,
      hourlyRate: input.hourlyRate,
      availability: input.availability,
      location: input.location,
    };

    // Remove undefined keys
    const cleanProfileData: Record<string, any> = {};
    for (const [k, v] of Object.entries(profileData)) {
      if (v !== undefined) cleanProfileData[k] = v;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.fullName ? { fullName: input.fullName } : {}),
        profile: {
          upsert: {
            create: cleanProfileData,
            update: cleanProfileData,
          },
        },
      },
    });

    return this.getMe(userId);
  }

  async submitKyc(
    userId: string,
    input: {
      legalName: string;
      country: string;
      documentType: string;
      documentNumber: string;
    },
  ) {
    await this.prisma.kycProfile.upsert({
      where: { userId },
      update: {
        status: 'PENDING',
        legalName: input.legalName,
        country: input.country,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        submittedAt: new Date(),
      },
      create: {
        userId,
        status: 'PENDING',
        legalName: input.legalName,
        country: input.country,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
      },
    });

    return { success: true, status: 'PENDING' };
  }
}