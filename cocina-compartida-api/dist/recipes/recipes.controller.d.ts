import type { Response } from 'express';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
export declare class RecipesController {
    private readonly recipesService;
    constructor(recipesService: RecipesService);
    create(dto: CreateRecipeDto, req: any): Promise<import("./entities/recipe.entity").Recipe>;
    findAll(): Promise<import("./entities/recipe.entity").Recipe[]>;
    findTopLiked(): Promise<import("./entities/recipe.entity").Recipe[]>;
    findOne(id: string): Promise<import("./entities/recipe.entity").Recipe>;
    update(id: string, dto: UpdateRecipeDto, req: any): Promise<import("./entities/recipe.entity").Recipe>;
    remove(id: string, req: any): Promise<void>;
    addComment(id: string, dto: CreateCommentDto, req: any): Promise<import("./entities/comment.entity").Comment>;
    listComments(id: string): Promise<import("./entities/comment.entity").Comment[]>;
    deleteComment(commentId: string, req: any): Promise<void>;
    toggleLike(id: string, req: any): Promise<{
        likes: number;
        likedBy: string[];
    }>;
    download(id: string, format: string | undefined, req: any, res: Response): Promise<void | Response<any, Record<string, any>>>;
}
