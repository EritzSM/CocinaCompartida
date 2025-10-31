import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Comment } from './comment.entity';
import { User } from 'src/user/entities/user.entity';

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column('simple-array')
  ingredients: string[];

  @Column('simple-array')
  steps: string[];

  @Column('simple-array', { nullable: true })
  images?: string[];

  // 🔹 Relación con el usuario (autor)
  @ManyToOne(() => User, (user) => user.recipes, { eager: true, onDelete: 'CASCADE' })
  user: User;

  // 🔹 Likes y usuarios que dieron like
  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column('simple-array', { nullable: true })
  likedBy?: string[];

  // 🔹 Relación con los comentarios
  @OneToMany(() => Comment, (comment) => comment.recipe, { cascade: true })
  comments?: Comment[];

  // 🔹 Fechas de creación y actualización
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
