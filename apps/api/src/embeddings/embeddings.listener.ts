import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EMBEDDING_PROJECT_SYNC_EVENT,
} from './embedding.events';
import type { EmbeddingProjectSyncEvent } from './embedding.events';
import { EmbeddingsService } from './embeddings.service';

@Injectable()
export class EmbeddingsListener {
  private readonly logger = new Logger(EmbeddingsListener.name);

  constructor(private readonly embeddingsService: EmbeddingsService) {}

  @OnEvent(EMBEDDING_PROJECT_SYNC_EVENT, { async: true })
  async handleProjectSync(event: EmbeddingProjectSyncEvent): Promise<void> {
    try {
      await this.embeddingsService.syncProjectEmbeddings(event.projectId);
      this.logger.log(
        `Synced embeddings for project ${event.projectId} after ${event.reason}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync embeddings for project ${event.projectId} after ${event.reason}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
