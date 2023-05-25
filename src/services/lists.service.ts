import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ListsService {
  constructor(private prismaService: PrismaService) {}
  async getCountriesList() {
    return await this.prismaService.country.findMany();
  }
  async getHobbiesList() {
    return await this.prismaService.hobby.findMany();
  }
  async getLanguagesList() {
    return await this.prismaService.language.findMany();
  }
}
