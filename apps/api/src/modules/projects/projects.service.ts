import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ProjectStatus, ProposalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { CreateProposalDto } from './dto/create-proposal.dto.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: { status?: ProjectStatus; skills?: string[]; ownerId?: string }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.skills && filters.skills.length > 0) {
      where.requiredSkills = { hasSome: filters.skills };
    }

    return this.prisma.project.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(ownerId: string, dto: CreateProjectDto) {
    const baseSlug = slugify(dto.title);
    const existing = await this.prisma.project.count({ where: { slug: { startsWith: baseSlug } } });
    const slug = existing > 0 ? `${baseSlug}-${Date.now()}` : baseSlug;

    return this.prisma.project.create({
      data: {
        ownerId,
        title: dto.title,
        slug,
        description: dto.description,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        currency: dto.currency ?? 'USD',
        timelineDays: dto.timelineDays,
        requiredSkills: dto.requiredSkills ?? [],
        status: ProjectStatus.OPEN,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        _count: { select: { proposals: true } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  async update(userId: string, id: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('You do not own this project');
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        currency: dto.currency,
        timelineDays: dto.timelineDays,
        requiredSkills: dto.requiredSkills,
        status: dto.status,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async remove(userId: string, id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('You do not own this project');
    }

    await this.prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.CANCELLED },
    });

    return { success: true };
  }

  async submitProposal(projectId: string, engineerId: string, dto: CreateProposalDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (project.status !== ProjectStatus.OPEN) {
      throw new BadRequestException('Project is not accepting proposals');
    }

    if (project.ownerId === engineerId) {
      throw new BadRequestException('You cannot submit a proposal to your own project');
    }

    const existingProposal = await this.prisma.proposal.findFirst({
      where: { projectId, engineerId },
    });

    if (existingProposal) {
      throw new BadRequestException('You have already submitted a proposal for this project');
    }

    return this.prisma.proposal.create({
      data: {
        projectId,
        engineerId,
        coverLetter: dto.coverLetter,
        price: dto.price,
        currency: dto.currency ?? 'USD',
        estimatedDays: dto.estimatedDays,
        status: ProposalStatus.SUBMITTED,
      },
      include: {
        engineer: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async listProposals(projectId: string, requesterId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (project.ownerId !== requesterId) {
      throw new ForbiddenException('Only the project owner can view proposals');
    }

    return this.prisma.proposal.findMany({
      where: { projectId },
      include: {
        engineer: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProposalStatus(
    projectId: string,
    proposalId: string,
    status: ProposalStatus,
    requesterId: string,
  ) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (project.ownerId !== requesterId) {
      throw new ForbiddenException('Only the project owner can update proposal status');
    }

    const proposal = await this.prisma.proposal.findUnique({ where: { id: proposalId } });

    if (!proposal || proposal.projectId !== projectId) {
      throw new NotFoundException(`Proposal ${proposalId} not found`);
    }

    return this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status },
      include: {
        engineer: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
