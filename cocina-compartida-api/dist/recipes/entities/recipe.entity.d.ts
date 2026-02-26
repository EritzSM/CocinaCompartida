import { User } from 'src/user/entities/user.entity';
import { Comment } from './comment.entity';
export declare class Recipe {
    id: string;
    name: string;
    descripcion: string;
    ingredients: string[];
    steps: string[];
    images: string[];
    user: User;
    comments: Comment[];
    likes: number;
    likedBy: string[];
    createdAt: Date;
    updatedAt: Date;
}
