import { Controller, Get, Query, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { GameService } from './game.service';
import { DataSource } from 'typeorm';
import { PageQueryDto } from './common/dto/page-query.dto';
@Controller()
export class GameController {
  constructor(private readonly game: GameService,
    private readonly dataSource: DataSource,) { }

  // STEP 0: @Get('health')
  @Get('health')
  async health() {
    await this.dataSource.query(`Select 1`);
    return { db: 'up' };
  }
  @Get('items')
  items(@Query() query: PageQueryDto) {
    return this.game.items(query);
  }
  @Post('players')
  createPlayer(@Body('name') name: string) {
    return this.game.createPlayer(name);
  }
  @Get('players/:id')
  findPlayer(@Param('id', ParseIntPipe) id: number) {
    return this.game.findPlayer(id);
  }
  @Post('players/:id/attack')
  attack(@Param('id', ParseIntPipe) id: number) {
    return this.game.attack(id);
  }
  @Get('players/:id/inventory')
  inventory(@Param('id', ParseIntPipe) id: number) {
    return this.game.inventory(id);
  }
  @Post('players/:id/buy')
  buy(
    @Param('id', ParseIntPipe) playerId: number,
    @Body('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.game.buy(playerId, itemId);
  }
  @Get('leaderboard')
  leaderboard(@Query() query: PageQueryDto) {
    return this.game.leaderboard(query);
  }
}
