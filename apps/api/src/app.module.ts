import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { CommentsModule } from './comments/comments.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    ProjectsModule,
    TicketsModule,
    CommentsModule,
    EmbeddingsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
