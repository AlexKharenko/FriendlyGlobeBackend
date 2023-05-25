import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth.module';
import { UserModule } from './user.module';
import { TokenModule } from './token.module';
import { ListsModule } from './lists.module';
import { WebsocketModule } from './websocket.module';
import { ChatModule } from './chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UserModule,
    ChatModule,
    ListsModule,
    TokenModule,
    WebsocketModule,
  ],
})
export class AppModule {}
