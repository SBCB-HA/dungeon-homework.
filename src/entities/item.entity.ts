// STEP 1: Item entity -> "item" table

import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

// Columns: id, name, icon, attack (int), price (int)
@Entity()
export class Item {
@PrimaryGeneratedColumn()
id : number;

@Column()
name : string;

@Column()
icon : string;

@Column({type : 'int'})
attack : number;

@Column({type : 'int'})
price : number;

}