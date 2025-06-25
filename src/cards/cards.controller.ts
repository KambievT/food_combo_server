import { Controller, Get } from '@nestjs/common';
import { mockCards } from './cards.mock';

@Controller('cards')
export class CardsController {
  @Get('menu')
  getAllCards() {
    return mockCards;
  }
}
