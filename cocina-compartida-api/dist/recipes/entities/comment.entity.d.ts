import { User } from 'src/user/entities/user.entity';
import { Recipe } from './recipe.entity';
export declare class Comment {
    id: string;
    message: string;
    user: User;
    recipe: Recipe;
    createdAt: Date;
    updatedAt: Date;
}
