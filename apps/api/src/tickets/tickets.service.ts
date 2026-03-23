import { Injectable, NotFoundException } from '@nestjs/common';
import { Priority, Prisma, Ticket, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

const ticketListSelection = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      comments: true,
    },
  },
} satisfies Prisma.TicketSelect;

export type TicketListItem = Prisma.TicketGetPayload<{
  select: typeof ticketListSelection;
}>;

export type TicketListQueryResult = Omit<TicketListItem, '_count'> & {
  commentCount: number;
};

interface FindAllTicketsOptions {
  projectId?: string;
  status?: TicketStatus;
  priority?: Priority;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
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
    sortBy: 'createdAt' | 'updatedAt' | 'priority' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<TicketListQueryResult[]> {
    await this.ensureProjectExists(projectId);
    const tickets = await this.prisma.ticket.findMany({
      where: {
        projectId,
        status,
        priority,
      },
      select: ticketListSelection,
      orderBy: this.buildOrderBy(sortBy, sortOrder),
    });

    return tickets.map(({ _count, ...ticket }) => ({
      ...ticket,
      commentCount: _count.comments,
    }));
  }

  async findAll(options: FindAllTicketsOptions = {}): Promise<TicketListQueryResult[]> {
    if (options.projectId) {
      await this.ensureProjectExists(options.projectId);
    }

    const sortBy = options.sortBy ?? 'createdAt';
    const sortOrder = options.sortOrder ?? 'desc';

    const tickets = await this.prisma.ticket.findMany({
      where: {
        projectId: options.projectId,
        status: options.status,
        priority: options.priority,
      },
      select: ticketListSelection,
      orderBy: this.buildOrderBy(sortBy, sortOrder),
    });

    return tickets.map(({ _count, ...ticket }) => ({
      ...ticket,
      commentCount: _count.comments,
    }));
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

  private buildOrderBy(
    sortBy: 'createdAt' | 'updatedAt' | 'priority',
    sortOrder: 'asc' | 'desc',
  ): Prisma.TicketOrderByWithRelationInput | Prisma.TicketOrderByWithRelationInput[] {
    if (sortBy === 'priority') {
      return [{ priority: sortOrder }, { createdAt: 'desc' }, { id: 'desc' }];
    }

    return {
      [sortBy]: sortOrder,
    } as Prisma.TicketOrderByWithRelationInput;
  }
}
