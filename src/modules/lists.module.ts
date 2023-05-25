import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { ListsController } from 'src/controlers/lists.controller';
import { ListsService } from 'src/services/lists.service';

@Module({
  imports: [PrismaModule],
  controllers: [ListsController],
  providers: [ListsService],
})
export class ListsModule {}
