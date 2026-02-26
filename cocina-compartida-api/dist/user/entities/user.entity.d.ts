import { Comment } from 'src/recipes/entities/comment.entity';
import { Recipe } from 'src/recipes/entities/recipe.entity';
export declare class User {
    id: string;
    username: string;
    password: string;
    email?: string;
    avatar?: string;
    bio?: string;
    recipes?: Recipe[];
    comments?: Comment[];
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    role: string;
}
