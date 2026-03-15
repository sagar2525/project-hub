import { Priority, TicketStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @Length(3, 150)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus = TicketStatus.TODO;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority = Priority.MEDIUM;
}
