import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Priority, Ticket, TicketStatus } from '@prisma/client';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  TicketDetailQueryResult,
  TicketListQueryResult,
  TicketsService,
} from './tickets.service';

@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('projects/:projectId/tickets')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTicketDto,
  ): Promise<Ticket> {
    return this.ticketsService.create(projectId, dto);
  }

  @Get('projects/:projectId/tickets')
  findByProject(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<TicketListQueryResult[]> {
    return this.ticketsService.findByProject(
      projectId,
      this.parseStatus(status),
      this.parsePriority(priority),
      this.parseSortBy(sortBy),
      this.parseSortOrder(sortOrder),
    );
  }

  @Get('tickets')
  findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<TicketListQueryResult[]> {
    return this.ticketsService.findAll({
      projectId,
      status: this.parseStatus(status),
      priority: this.parsePriority(priority),
      sortBy: this.parseSortBy(sortBy),
      sortOrder: this.parseSortOrder(sortOrder),
    });
  }

  @Get('tickets/:id')
  findOne(@Param('id') id: string): Promise<TicketDetailQueryResult> {
    return this.ticketsService.findOne(id);
  }

  @Patch('tickets/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
  ): Promise<Ticket> {
    return this.ticketsService.update(id, dto);
  }

  @Delete('tickets/:id')
  remove(@Param('id') id: string): Promise<Ticket> {
    return this.ticketsService.remove(id);
  }

  private parseStatus(status?: string): TicketStatus | undefined {
    if (!status) {
      return undefined;
    }

    if (!Object.values(TicketStatus).includes(status as TicketStatus)) {
      throw new BadRequestException(
        `status must be one of: ${Object.values(TicketStatus).join(', ')}`,
      );
    }

    return status as TicketStatus;
  }

  private parsePriority(priority?: string): Priority | undefined {
    if (!priority) {
      return undefined;
    }

    if (!Object.values(Priority).includes(priority as Priority)) {
      throw new BadRequestException(
        `priority must be one of: ${Object.values(Priority).join(', ')}`,
      );
    }

    return priority as Priority;
  }

  private parseSortBy(sortBy?: string): 'createdAt' | 'updatedAt' | 'priority' {
    if (!sortBy) {
      return 'createdAt';
    }

    if (
      sortBy !== 'createdAt' &&
      sortBy !== 'updatedAt' &&
      sortBy !== 'priority'
    ) {
      throw new BadRequestException(
        'sortBy must be createdAt, updatedAt or priority',
      );
    }

    return sortBy;
  }

  private parseSortOrder(sortOrder?: string): 'asc' | 'desc' {
    if (!sortOrder) {
      return 'desc';
    }

    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      throw new BadRequestException('sortOrder must be asc or desc');
    }

    return sortOrder;
  }
}
