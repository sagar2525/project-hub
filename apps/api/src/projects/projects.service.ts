import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Project, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const projectListSelection = {
  id: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      tickets: true,
    },
  },
} satisfies Prisma.ProjectSelect;

export type ProjectListItem = Prisma.ProjectGetPayload<{
  select: typeof projectListSelection;
}>;

export type ProjectListQueryResult = Omit<ProjectListItem, '_count'> & {
  ticketCount: number;
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status ?? ProjectStatus.ACTIVE,
      },
    });
  }

  async findAll(status?: ProjectStatus): Promise<ProjectListQueryResult[]> {
    const projects = await this.prisma.project.findMany({
      where: status ? { status } : undefined,
      select: projectListSelection,
      orderBy: { createdAt: 'desc' },
    });

    return projects.map(({ _count, ...project }) => ({
      ...project,
      ticketCount: _count.tickets,
    }));
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
      },
    });
  }

  async archive(id: string): Promise<Project> {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.ARCHIVED },
    });
  }
}
