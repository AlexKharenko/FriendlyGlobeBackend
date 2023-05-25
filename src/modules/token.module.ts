import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from 'src/services/token.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [JwtModule, PrismaModule],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
