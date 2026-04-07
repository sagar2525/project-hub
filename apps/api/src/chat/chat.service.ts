import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ChatMessage, Prisma } from '@prisma/client';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  EmbeddingsService,
  type EmbeddingSearchResult,
} from '../embeddings/embeddings.service';
import { PrismaService } from '../prisma/prisma.service';

interface ChatSourceReference {
  sourceType: string;
  sourceId: string;
  snippet: string;
  metadata: Record<string, unknown> | null;
  distance: number;
}

export interface ChatReply {
  response: string;
  sources: ChatSourceReference[];
  sessionId: string;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async chat(message: string, sessionId: string): Promise<ChatReply> {
    const history = await this.getRecentHistory(sessionId);
    const standaloneQuestion = await this.rewriteQuestion(message, history);
    const retrievedChunks = await this.embeddingsService.search(
      standaloneQuestion,
      5,
    );
    const sources = this.toSourceReferences(retrievedChunks);
    const answer = await this.generateAnswer(
      standaloneQuestion,
      history,
      retrievedChunks,
    );

    await this.prisma.chatMessage.createMany({
      data: [
        {
          role: 'user',
          content: message,
          sessionId,
        },
        {
          role: 'assistant',
          content: answer,
          sessionId,
          sources: sources as unknown as Prisma.InputJsonValue,
        },
      ],
    });

    return {
      response: answer,
      sources,
      sessionId,
    };
  }

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async clearHistory(sessionId: string): Promise<{ deleted: number }> {
    const result = await this.prisma.chatMessage.deleteMany({
      where: { sessionId },
    });

    return { deleted: result.count };
  }

  private async getRecentHistory(sessionId: string): Promise<ChatMessage[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return messages.reverse();
  }

  private async rewriteQuestion(
    message: string,
    history: ChatMessage[],
  ): Promise<string> {
    if (history.length === 0) {
      return message;
    }

    const historyText = history
      .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
      .join('\n');

    const rewriteModel = this.createChatModel();
    const rewritten = await rewriteModel.invoke([
      new SystemMessage(
        'Rewrite the user question into a standalone question using the chat history. If the question is already standalone, return it unchanged. Output only the rewritten question.',
      ),
      new HumanMessage(
        `Chat history:\n${historyText}\n\nUser question:\n${message}`,
      ),
    ]);

    const content = this.extractText(rewritten.content).trim();
    return content || message;
  }

  private async generateAnswer(
    standaloneQuestion: string,
    history: ChatMessage[],
    retrievedChunks: EmbeddingSearchResult[],
  ): Promise<string> {
    const context = retrievedChunks.length
      ? retrievedChunks
          .map(
            (chunk, index) =>
              `Source ${index + 1}\nType: ${chunk.sourceType}\nSource ID: ${chunk.sourceId}\nMetadata: ${JSON.stringify(chunk.metadata ?? {})}\nContent:\n${chunk.content}`,
          )
          .join('\n\n')
      : 'No relevant project data was retrieved.';

    const historyText = history.length
      ? history
          .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
          .join('\n')
      : 'No prior chat history.';

    const answerModel = this.createChatModel();
    const response = await answerModel.invoke([
      new SystemMessage(
        [
          'You are a helpful project management assistant.',
          'Answer questions only from the provided project context.',
          'If the information is not present in the context, say: "I don\'t have information about that in the project data."',
          'When possible, mention the relevant project, ticket, or comment in the answer.',
        ].join(' '),
      ),
      new HumanMessage(
        [
          `Context:\n${context}`,
          `Chat History:\n${historyText}`,
          `Question:\n${standaloneQuestion}`,
        ].join('\n\n'),
      ),
    ]);

    const answerText = this.extractText(response.content).trim();

    if (!answerText) {
      throw new InternalServerErrorException(
        'Chat model returned an empty response.',
      );
    }

    return answerText;
  }

  private createChatModel(): ChatGoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY is missing. Add it to apps/api/.env before using chat endpoints.',
      );
    }

    return new ChatGoogleGenerativeAI({
      apiKey,
      model: process.env.GEMINI_CHAT_MODEL ?? 'gemini-2.0-flash',
      temperature: 0.1,
      maxRetries: 2,
    });
  }

  private extractText(
    content: string | Array<{ text?: string; type?: string }>,
  ): string {
    if (typeof content === 'string') {
      return content;
    }

    return content
      .map((part) => ('text' in part && typeof part.text === 'string' ? part.text : ''))
      .join(' ');
  }

  private toSourceReferences(
    chunks: EmbeddingSearchResult[],
  ): ChatSourceReference[] {
    return chunks.map((chunk) => ({
      sourceType: chunk.sourceType,
      sourceId: chunk.sourceId,
      snippet: chunk.content.slice(0, 280),
      metadata: chunk.metadata,
      distance: chunk.distance,
    }));
  }
}
