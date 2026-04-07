import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ChatMessage } from '@prisma/client';
import { ChatService, type ChatReply } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  create(@Body() dto: CreateChatDto): Promise<ChatReply> {
    return this.chatService.chat(dto.message, dto.sessionId);
  }

  @Get('history/:sessionId')
  history(@Param('sessionId') sessionId: string): Promise<ChatMessage[]> {
    return this.chatService.getHistory(sessionId);
  }

  @Delete('history/:sessionId')
  clearHistory(
    @Param('sessionId') sessionId: string,
  ): Promise<{ deleted: number }> {
    return this.chatService.clearHistory(sessionId);
  }
}
