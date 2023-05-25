import { Module } from '@nestjs/common';
import { UserService } from 'src/services/user.service';
import { PrismaModule } from './prisma.module';
import { UserController } from 'src/controlers/user.controller';
import { TokenModule } from './token.module';

@Module({
  imports: [PrismaModule, TokenModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
