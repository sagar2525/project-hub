import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [PrismaModule, ProjectsModule, TicketsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
