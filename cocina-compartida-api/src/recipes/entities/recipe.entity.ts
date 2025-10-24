import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('recipes')
export class Recipe {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar'})
    name: string;

    @Column({type: 'varchar'})
    descripcion: string;

    @Column('simple-array')
    ingredients: string[];

    @Column('simple-array')
    steps: string[];

    @Column('simple-array')
    images: string[];

    @Column({type: 'varchar'})
    author: string;

    @Column()
    avatar?: string;

    @Column({type: 'varchar'})
    likes?: number;

    @Column({type: 'varchar'})
    likedBy?: string[]; 

    //@OneToMany(() => Comment, comment => comment.recipe, { cascade: true })
    comments?: Comment[];
}
