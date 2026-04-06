import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { TaskType } from '@google/generative-ai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ProjectStatus, TicketStatus, Priority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type EmbeddingSourceType = 'project' | 'ticket' | 'comment';

interface EmbeddingChunk {
  content: string;
  sourceType: EmbeddingSourceType;
  sourceId: string;
  metadata: Record<string, unknown>;
}

export interface EmbeddingSyncResult {
  projectId?: string;
  projectCount: number;
  chunkCount: number;
}

export interface EmbeddingSearchResult {
  content: string;
  sourceType: string;
  sourceId: string;
  metadata: Record<string, unknown> | null;
  distance: number;
}

@Injectable()
export class EmbeddingsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateEmbeddings(text: string): Promise<number[]> {
    return this.createQueryEmbeddingsClient().embedQuery(text);
  }

  async syncProjectEmbeddings(projectId: string): Promise<EmbeddingSyncResult> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tickets: {
          include: {
            comments: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const chunks = this.buildProjectChunks(project);
    const vectors = await this.createDocumentEmbeddingsClient().embedDocuments(
      chunks.map((chunk) => chunk.content),
    );

    await this.prisma.$executeRawUnsafe(
      `DELETE FROM "Embedding" WHERE "metadata"->>'projectId' = '${this.escapeSql(projectId)}'`,
    );

    for (const [index, chunk] of chunks.entries()) {
      await this.upsertEmbedding(chunk, vectors[index]);
    }

    return {
      projectId,
      projectCount: 1,
      chunkCount: chunks.length,
    };
  }

  async syncAllEmbeddings(): Promise<EmbeddingSyncResult> {
    const projects = await this.prisma.project.findMany({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    let totalChunks = 0;

    for (const project of projects) {
      const result = await this.syncProjectEmbeddings(project.id);
      totalChunks += result.chunkCount;
    }

    return {
      projectCount: projects.length,
      chunkCount: totalChunks,
    };
  }

  async deleteEmbeddingsBySource(
    sourceType: EmbeddingSourceType,
    sourceId: string,
  ): Promise<{ deleted: number }> {
    const result = await this.prisma.embedding.deleteMany({
      where: {
        sourceType,
        sourceId,
      },
    });

    return { deleted: result.count };
  }

  async search(
    query: string,
    limit = 5,
  ): Promise<EmbeddingSearchResult[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      throw new BadRequestException('q is required');
    }

    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(limit, 1), 20)
      : 5;

    const queryVector = await this.generateEmbeddings(trimmedQuery);
    const results = await this.prisma.$queryRawUnsafe<
      Array<{
        content: string;
        sourceType: string;
        sourceId: string;
        metadata: Record<string, unknown> | null;
        distance: number;
      }>
    >(
      `
        SELECT
          "content",
          "sourceType",
          "sourceId",
          "metadata",
          ("embedding" <=> '${this.vectorLiteral(queryVector)}'::vector) AS distance
        FROM "Embedding"
        ORDER BY "embedding" <=> '${this.vectorLiteral(queryVector)}'::vector
        LIMIT ${safeLimit}
      `,
    );

    return results.map((result) => ({
      ...result,
      distance: Number(result.distance),
    }));
  }

  private createDocumentEmbeddingsClient(): GoogleGenerativeAIEmbeddings {
    return new GoogleGenerativeAIEmbeddings({
      apiKey: this.getGeminiApiKey(),
      model: 'gemini-embedding-001',
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    });
  }

  private createQueryEmbeddingsClient(): GoogleGenerativeAIEmbeddings {
    return new GoogleGenerativeAIEmbeddings({
      apiKey: this.getGeminiApiKey(),
      model: 'gemini-embedding-001',
      taskType: TaskType.RETRIEVAL_QUERY,
    });
  }

  private getGeminiApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY is missing. Add it to apps/api/.env before using embeddings endpoints.',
      );
    }

    return apiKey;
  }

  private buildProjectChunks(project: {
    id: string;
    name: string;
    description: string | null;
    status: ProjectStatus;
    tickets: Array<{
      id: string;
      title: string;
      description: string | null;
      status: TicketStatus;
      priority: Priority;
      comments: Array<{
        id: string;
        author: string;
        content: string;
        createdAt: Date;
      }>;
    }>;
  }): EmbeddingChunk[] {
    const chunks: EmbeddingChunk[] = [
      {
        sourceType: 'project',
        sourceId: project.id,
        metadata: {
          projectId: project.id,
          projectName: project.name,
          status: project.status,
        },
        content: [
          `Project: ${project.name}`,
          `Status: ${project.status}`,
          `Description: ${project.description ?? 'No description provided.'}`,
          `Ticket Count: ${project.tickets.length}`,
        ].join('\n'),
      },
    ];

    for (const ticket of project.tickets) {
      chunks.push({
        sourceType: 'ticket',
        sourceId: ticket.id,
        metadata: {
          projectId: project.id,
          projectName: project.name,
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
        },
        content: [
          `Ticket: ${ticket.title}`,
          `Project: ${project.name}`,
          `Status: ${ticket.status} | Priority: ${ticket.priority}`,
          `Description: ${ticket.description ?? 'No description provided.'}`,
          `Comment Count: ${ticket.comments.length}`,
        ].join('\n'),
      });

      for (const comment of ticket.comments) {
        chunks.push({
          sourceType: 'comment',
          sourceId: comment.id,
          metadata: {
            projectId: project.id,
            projectName: project.name,
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            commentId: comment.id,
            author: comment.author,
            createdAt: comment.createdAt.toISOString(),
          },
          content: [
            `Comment by ${comment.author} on ticket "${ticket.title}"`,
            `Project: ${project.name}`,
            `Created At: ${comment.createdAt.toISOString()}`,
            comment.content,
          ].join('\n'),
        });
      }
    }

    return chunks;
  }

  private async upsertEmbedding(
    chunk: EmbeddingChunk,
    vector: number[],
  ): Promise<void> {
    const metadataJson = JSON.stringify(chunk.metadata);

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO "Embedding" (
        "id",
        "content",
        "embedding",
        "sourceType",
        "sourceId",
        "metadata",
        "createdAt"
      ) VALUES (
        gen_random_uuid()::text,
        '${this.escapeSql(chunk.content)}',
        '${this.vectorLiteral(vector)}'::vector,
        '${this.escapeSql(chunk.sourceType)}',
        '${this.escapeSql(chunk.sourceId)}',
        '${this.escapeSql(metadataJson)}'::jsonb,
        NOW()
      )
      ON CONFLICT ("sourceType", "sourceId") DO UPDATE
      SET
        "content" = EXCLUDED."content",
        "embedding" = EXCLUDED."embedding",
        "metadata" = EXCLUDED."metadata"
    `);
  }

  private escapeSql(value: string): string {
    return value.replace(/'/g, "''");
  }

  private vectorLiteral(values: number[]): string {
    return `[${values.map((value) => value.toFixed(8)).join(',')}]`;
  }
}
