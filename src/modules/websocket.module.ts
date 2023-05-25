import { Module } from '@nestjs/common';
import { ChatGateway } from 'src/websocket/gateways/chat.gateway';
import { TokenModule } from './token.module';
import { MessageModule } from './message.module';
import { WebsocketUtils } from 'src/utils/websocket.util';
import { ChatModule } from './chat.module';

@Module({
  providers: [ChatGateway, WebsocketUtils],
  imports: [TokenModule, MessageModule, ChatModule],
})
export class WebsocketModule {}
