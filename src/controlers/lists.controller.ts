import { Controller, Get } from '@nestjs/common';
import { ListsService } from 'src/services/lists.service';

@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get('chl')
  async getCHLLists() {
    const countries = await this.listsService.getCountriesList();
    const hobbies = await this.listsService.getHobbiesList();
    const languages = await this.listsService.getLanguagesList();
    return { success: true, countries, hobbies, languages };
  }
}
