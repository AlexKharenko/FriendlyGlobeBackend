import { Module } from '@nestjs/common';
import { AuthController } from 'src/controlers/auth.controller';
import { AuthService } from 'src/services/auth.service';
import { UserModule } from './user.module';
import { PrismaModule } from './prisma.module';
import { TokenModule } from './token.module';

@Module({
  imports: [UserModule, PrismaModule, TokenModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
