import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { ChatController } from 'src/controlers/chat.controller';
import { ChatService } from 'src/services/chat.service';
import { TokenModule } from './token.module';
import { UserModule } from './user.module';

@Module({
  imports: [PrismaModule, UserModule, TokenModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
