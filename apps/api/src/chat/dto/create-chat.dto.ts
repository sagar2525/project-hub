import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateChatDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  message: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
