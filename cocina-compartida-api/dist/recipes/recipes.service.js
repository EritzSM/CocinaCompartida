"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const recipe_entity_1 = require("./entities/recipe.entity");
const comment_entity_1 = require("./entities/comment.entity");
let RecipesService = class RecipesService {
    recipeRepository;
    commentRepository;
    constructor(recipeRepository, commentRepository) {
        this.recipeRepository = recipeRepository;
        this.commentRepository = commentRepository;
    }
    async create(createRecipeDto, user) {
        const recipe = this.recipeRepository.create({
            ...createRecipeDto,
            user,
            likes: 0,
            likedBy: [],
        });
        return await this.recipeRepository.save(recipe);
    }
    async findAll() {
        return await this.recipeRepository.find({
            relations: ['user', 'comments', 'comments.user'],
            order: { createdAt: 'DESC' },
        });
    }
    async findTopLiked(limit = 3) {
        return await this.recipeRepository.find({
            relations: ['user', 'comments', 'comments.user'],
            order: { likes: 'DESC', createdAt: 'DESC' },
            take: limit,
        });
    }
    async findOne(id) {
        const recipe = await this.recipeRepository.findOne({
            where: { id },
            relations: ['user', 'comments', 'comments.user'],
        });
        if (!recipe) {
            throw new common_1.NotFoundException(`Recipe with ID "${id}" not found`);
        }
        return recipe;
    }
    async update(id, updateRecipeDto, user) {
        const recipe = await this.findOne(id);
        if (recipe.user.id !== user.id) {
            throw new common_1.ForbiddenException('You can only update your own recipes');
        }
        Object.assign(recipe, updateRecipeDto);
        return await this.recipeRepository.save(recipe);
    }
    async remove(id, user) {
        const recipe = await this.findOne(id);
        if (recipe.user.id !== user.id) {
            throw new common_1.ForbiddenException('You can only delete your own recipes');
        }
        await this.recipeRepository.remove(recipe);
    }
    async toggleLike(id, user) {
        const recipe = await this.findOne(id);
        if (!Array.isArray(recipe.likedBy)) {
            recipe.likedBy = [];
        }
        const hasLiked = recipe.likedBy.includes(user.id);
        if (hasLiked) {
            recipe.likedBy = recipe.likedBy.filter((u) => u !== user.id);
        }
        else {
            recipe.likedBy.push(user.id);
        }
        recipe.likes = recipe.likedBy.length;
        await this.recipeRepository.save(recipe);
        return { likes: recipe.likes, likedBy: recipe.likedBy };
    }
    async createComment(recipeId, createCommentDto, user) {
        const recipe = await this.findOne(recipeId);
        const comment = this.commentRepository.create({
            ...createCommentDto,
            user,
            recipe,
        });
        return await this.commentRepository.save(comment);
    }
    async findCommentsByRecipe(recipeId) {
        await this.findOne(recipeId);
        return await this.commentRepository.find({
            where: { recipe: { id: recipeId } },
            relations: ['user'],
            order: { createdAt: 'ASC' },
        });
    }
    async removeComment(commentId, user) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
            relations: ['user'],
        });
        if (!comment) {
            throw new common_1.NotFoundException(`Comment with ID "${commentId}" not found`);
        }
        if (comment.user.id !== user.id) {
            throw new common_1.ForbiddenException('You can only delete your own comments');
        }
        await this.commentRepository.remove(comment);
    }
};
exports.RecipesService = RecipesService;
exports.RecipesService = RecipesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(recipe_entity_1.Recipe)),
    __param(1, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RecipesService);
//# sourceMappingURL=recipes.service.js.map