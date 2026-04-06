import { BadRequestException, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  EmbeddingsService,
  EmbeddingSearchResult,
  EmbeddingSyncResult,
} from './embeddings.service';

@Controller('embeddings')
export class EmbeddingsController {
  constructor(private readonly embeddingsService: EmbeddingsService) {}

  @Post('sync')
  syncAll(): Promise<EmbeddingSyncResult> {
    return this.embeddingsService.syncAllEmbeddings();
  }

  @Post('sync/:projectId')
  syncProject(@Param('projectId') projectId: string): Promise<EmbeddingSyncResult> {
    return this.embeddingsService.syncProjectEmbeddings(projectId);
  }

  @Get('search')
  search(
    @Query('q') query?: string,
    @Query('limit') limit?: string,
  ): Promise<EmbeddingSearchResult[]> {
    if (!query?.trim()) {
      throw new BadRequestException('q query parameter is required');
    }

    const parsedLimit =
      typeof limit === 'string' && limit.trim().length > 0
        ? this.parseLimit(limit)
        : undefined;

    return this.embeddingsService.search(query, parsedLimit);
  }

  private parseLimit(value: string): number {
    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed)) {
      throw new BadRequestException('limit must be a number');
    }

    return parsed;
  }
}
