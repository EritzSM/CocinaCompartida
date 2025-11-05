import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Comment } from './comment.entity';

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  descripcion: string;

  @Column('text', { array: true, nullable: false, default: [] })
  ingredients: string[];

  @Column('text', { array: true, nullable: false, default: [] })
  steps: string[];

  @Column('text', { array: true, nullable: false, default: [] })
  images: string[];

  @ManyToOne(() => User, (u) => u.recipes, { onDelete: 'CASCADE', eager: false })
  user: User;

  @OneToMany(() => Comment, (c) => c.recipe, { cascade: true })
  comments: Comment[];

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column('text', { array: true, nullable: false, default: [] })
  likedBy: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
