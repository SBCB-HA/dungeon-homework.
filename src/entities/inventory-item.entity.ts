// STEP 4: InventoryItem entity -> link table Player <-> Item
// Columns: id, playerId, itemId, quantity (default 1)
// Add a ManyToOne relation to Item and a unique constraint on playerId + itemId.
import {Entity,PrimaryGeneratedColumn,Column,ManyToOne,JoinColumn,Unique,
} from 'typeorm';
import { Item } from './item.entity';

@Entity()
@Unique(['playerId', 'itemId'])
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  playerId: number;

  @Column({ type: 'int' })
  itemId: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'itemId' })
  item: Item;


}