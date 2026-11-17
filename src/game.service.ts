import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In,Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { PageQueryDto } from './common/dto/page-query.dto';
import { Player } from './entities/player.entity';
import { InventoryItem } from './entities/inventory-item.entity';
@Injectable()
export class GameService {
  // STEP 1: items({ page, limit })
  // STEP 2: createPlayer(name), findPlayer(id), toPlayerView(player, attack = 1)
  // STEP 3: attack(id)
  // STEP 4: inventory(id), buy(playerId, itemId), attackOf(playerId)
  // STEP 5: leaderboard({ page, limit }) without the N+1 problem
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepository: Repository<InventoryItem>,
  ) { }
  async items({ page, limit }: PageQueryDto) {
    const [data, total] = await this.itemRepository.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, page, limit, total };
  }
  toPlayerView(player: Player, attack = 1) {
    const monsters = [
      { name: 'Slime', icon: '🟢' },
      { name: 'Goblin', icon: '👺' },
      { name: 'Skeleton', icon: '💀' },
      { name: 'Orc', icon: '👹' },
      { name: 'Dragon', icon: '🐉' },
    ];

    const maxHp = 8 + player.kills * 4;
    const monster = monsters[player.kills % monsters.length];

    return {
      id: player.id,
      name: player.name,
      level: 1 + Math.floor(player.xp / 100),
      xp: player.xp,
      gold: player.gold,
      attack,
      kills: player.kills,
      monster: {
        ...monster,
        hp: player.monsterHp ?? maxHp,
        maxHp,
      },
    };
  }
  async createPlayer(name: string) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 20) {
      throw new BadRequestException('Name must be between 2 and 20 characters');
    }

    const player = this.playerRepository.create({
      name: name.trim(),
      gold: 0,
      xp: 0,
      kills: 0,
      monsterHp: null,
    });

    const savedPlayer = await this.playerRepository.save(player);

    return this.toPlayerView(savedPlayer);
  }
  async findPlayer(id: number) {
    const player = await this.playerRepository.findOneBy({ id });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    return this.toPlayerView(player, await this.attackOf(id));
  }
  async attack(id: number) {
    const player = await this.playerRepository.findOneBy({ id });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    const damage = await this.attackOf(id);
    const currentHp = player.monsterHp ?? (8 + player.kills * 4);
    const remainingHp = Math.max(0, currentHp - damage);
    const defeated = remainingHp === 0;

    let reward: { gold: number; xp: number } | null = null;

    if (defeated) {
      const gold = 5 + player.kills * 2;

      player.gold += gold;
      player.xp += 25;
      player.kills += 1;
      player.monsterHp = null;

      reward = { gold, xp: 25 };
    } else {
      player.monsterHp = remainingHp;
    }

    const savedPlayer = await this.playerRepository.save(player);

    return {
      damage,
      defeated,
      reward,
     player: this.toPlayerView(savedPlayer, damage),
    };
  }
  async inventory(playerId: number) {

    await this.findPlayer(playerId);

    const rows = await this.inventoryRepository.find({
      where: { playerId },
      relations: { item: true },
    });

    return rows.map(({ item, quantity }) => ({ item, quantity }));
  }
  async attackOf(playerId: number): Promise<number> {
    const rows = await this.inventoryRepository.find({
      where: { playerId },
      relations: { item: true },
    });

    return 1 + rows.reduce(
      (total, row) => total + row.item.attack * row.quantity,
      0,
    );
  }
  async buy(playerId: number, itemId: number) {
    const player = await this.playerRepository.findOneBy({ id: playerId });
    if (!player) {
      throw new NotFoundException('Player not found');
    }

    const item = await this.itemRepository.findOneBy({ id: itemId });
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (player.gold < item.price) {
      throw new BadRequestException('Not enough gold');
    }

    player.gold -= item.price;
    const savedPlayer = await this.playerRepository.save(player);

    let inventoryItem = await this.inventoryRepository.findOneBy({
      playerId,
      itemId,
    });

    if (inventoryItem) {
      inventoryItem.quantity += 1;
    } else {
      inventoryItem = this.inventoryRepository.create({
        playerId,
        itemId,
        quantity: 1,
      });
    }

    await this.inventoryRepository.save(inventoryItem);

    return {
      item,
      player: this.toPlayerView(savedPlayer, await this.attackOf(playerId)),
    };
  }
  async leaderboard({ page, limit }: PageQueryDto) {
  const [players, total] = await this.playerRepository.findAndCount({
    order: { xp: 'DESC', id: 'ASC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const ids = players.map((player) => player.id);
  const inventoryRows = ids.length
    ? await this.inventoryRepository.find({
        where: { playerId: In(ids) },
        relations: { item: true },
      })
    : [];

  const attacks = new Map<number, number>();
  for (const player of players) {
    attacks.set(player.id, 1);
  }
  for (const row of inventoryRows) {
    attacks.set(
      row.playerId,
      (attacks.get(row.playerId) ?? 1) + row.item.attack * row.quantity,
    );
  }

  const data = players.map((player, index) => ({
    rank: (page - 1) * limit + index + 1,
    id: player.id,
    name: player.name,
    level: 1 + Math.floor(player.xp / 100),
    xp: player.xp,
    gold: player.gold,
    attack: attacks.get(player.id) ?? 1,
  }));

  return { data, page, limit, total };
}
}
