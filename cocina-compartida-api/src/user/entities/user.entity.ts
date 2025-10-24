import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Comment } from 'src/recipes/entities/comment.entity';

@Entity('users')
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', unique: true })
    username: string;

    @Column({ type: 'varchar' })
    password: string;
    
    @Column({ type: 'varchar', nullable: true })
    email?: string;

    @Column({ type: 'varchar', nullable: true })
    avatar?: string;

    @Column({ type: 'text', nullable: true })
    bio?: string;

    @OneToMany(()=>Comment, comment=>comment.user)
    comments:Comment[];
}
