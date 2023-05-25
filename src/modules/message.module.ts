import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { MessageService } from 'src/services/message.service';
import { ChatModule } from './chat.module';

@Module({
  imports: [PrismaModule, ChatModule],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
