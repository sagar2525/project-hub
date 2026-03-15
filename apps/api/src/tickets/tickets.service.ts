import { Injectable, NotFoundException } from '@nestjs/common';
import { Priority, Prisma, Ticket, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

interface FindAllTicketsOptions {
  projectId?: string;
  status?: TicketStatus;
  priority?: Priority;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, dto: CreateTicketDto): Promise<Ticket> {
    await this.ensureProjectExists(projectId);
    return this.prisma.ticket.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        status: dto.status ?? TicketStatus.TODO,
        priority: dto.priority ?? Priority.MEDIUM,
      },
    });
  }

  async findByProject(
    projectId: string,
    status?: TicketStatus,
    priority?: Priority,
  ): Promise<Ticket[]> {
    await this.ensureProjectExists(projectId);
    return this.prisma.ticket.findMany({
      where: {
        projectId,
        status,
        priority,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(options: FindAllTicketsOptions = {}): Promise<Ticket[]> {
    if (options.projectId) {
      await this.ensureProjectExists(options.projectId);
    }

    const sortBy = options.sortBy ?? 'createdAt';
    const sortOrder = options.sortOrder ?? 'desc';
    const orderBy = {
      [sortBy]: sortOrder,
    } as Prisma.TicketOrderByWithRelationInput;

    return this.prisma.ticket.findMany({
      where: {
        projectId: options.projectId,
        status: options.status,
        priority: options.priority,
      },
      orderBy,
    });
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto): Promise<Ticket> {
    await this.findOne(id);
    return this.prisma.ticket.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
      },
    });
  }

  async remove(id: string): Promise<Ticket> {
    await this.findOne(id);
    return this.prisma.ticket.delete({ where: { id } });
  }

  private async ensureProjectExists(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }
}
