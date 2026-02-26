import { Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { Comment } from './entities/comment.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from 'src/user/entities/user.entity';
export declare class RecipesService {
    private readonly recipeRepository;
    private readonly commentRepository;
    constructor(recipeRepository: Repository<Recipe>, commentRepository: Repository<Comment>);
    create(createRecipeDto: CreateRecipeDto, user: User): Promise<Recipe>;
    findAll(): Promise<Recipe[]>;
    findTopLiked(limit?: number): Promise<Recipe[]>;
    findOne(id: string): Promise<Recipe>;
    update(id: string, updateRecipeDto: UpdateRecipeDto, user: User): Promise<Recipe>;
    remove(id: string, user: User): Promise<void>;
    toggleLike(id: string, user: User): Promise<{
        likes: number;
        likedBy: string[];
    }>;
    createComment(recipeId: string, createCommentDto: CreateCommentDto, user: User): Promise<Comment>;
    findCommentsByRecipe(recipeId: string): Promise<Comment[]>;
    removeComment(commentId: string, user: User): Promise<void>;
}
