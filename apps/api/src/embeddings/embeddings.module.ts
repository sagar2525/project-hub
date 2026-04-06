import { Module } from '@nestjs/common';
import { EmbeddingsController } from './embeddings.controller';
import { EmbeddingsListener } from './embeddings.listener';
import { EmbeddingsService } from './embeddings.service';

@Module({
  controllers: [EmbeddingsController],
  providers: [EmbeddingsService, EmbeddingsListener],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
