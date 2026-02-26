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
exports.RecipesController = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const recipes_service_1 = require("./recipes.service");
const create_recipe_dto_1 = require("./dto/create-recipe.dto");
const update_recipe_dto_1 = require("./dto/update-recipe.dto");
const create_comment_dto_1 = require("./dto/create-comment.dto");
const auth_guard_1 = require("../security/auth.guard");
const recipe_owner_guard_1 = require("../security/recipe-owner.guard");
let RecipesController = class RecipesController {
    recipesService;
    constructor(recipesService) {
        this.recipesService = recipesService;
    }
    create(dto, req) {
        return this.recipesService.create(dto, req.user);
    }
    findAll() {
        return this.recipesService.findAll();
    }
    findTopLiked() {
        return this.recipesService.findTopLiked();
    }
    findOne(id) {
        return this.recipesService.findOne(id);
    }
    update(id, dto, req) {
        return this.recipesService.update(id, dto, req.user);
    }
    remove(id, req) {
        return this.recipesService.remove(id, req.user);
    }
    addComment(id, dto, req) {
        return this.recipesService.createComment(id, dto, req.user);
    }
    listComments(id) {
        return this.recipesService.findCommentsByRecipe(id);
    }
    deleteComment(commentId, req) {
        return this.recipesService.removeComment(commentId, req.user);
    }
    toggleLike(id, req) {
        return this.recipesService.toggleLike(id, req.user);
    }
    async download(id, format = 'pdf', req, res) {
        const recipe = await this.recipesService.findOne(id);
        if (format === 'image') {
            if (Array.isArray(recipe.images) && recipe.images.length > 0) {
                const imgUrl = recipe.images[0];
                const filename = imgUrl.split('/').pop();
                if (!filename) {
                    return res.status(404).json({ error: 'Image filename not found' });
                }
                const root = (0, path_1.join)(process.cwd(), 'uploads', 'recipes', id);
                return res.sendFile(filename, { root }, (err) => {
                    if (err) {
                        res.status(404).json({ error: 'Image not found' });
                    }
                });
            }
        }
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        const safeName = (recipe.name || 'recipe').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        res.setHeader('Content-Disposition', `attachment; filename=\"${safeName}.pdf\"`);
        doc.pipe(res);
        doc.fontSize(20).text(recipe.name || 'Receta', { underline: true });
        doc.moveDown();
        if (recipe.descripcion) {
            doc.fontSize(12).text(recipe.descripcion);
            doc.moveDown();
        }
        if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
            doc.fontSize(14).text('Ingredientes:');
            doc.fontSize(12);
            recipe.ingredients.forEach((ing, i) => doc.text(`${i + 1}. ${ing}`));
            doc.moveDown();
        }
        if (Array.isArray(recipe.steps) && recipe.steps.length) {
            doc.fontSize(14).text('Pasos:');
            doc.fontSize(12);
            recipe.steps.forEach((step, i) => {
                doc.text(`${i + 1}. ${step}`);
                doc.moveDown(0.2);
            });
        }
        doc.end();
    }
};
exports.RecipesController = RecipesController;
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_recipe_dto_1.CreateRecipeDto, Object]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('top-liked'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "findTopLiked", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, recipe_owner_guard_1.RecipeOwnerGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_recipe_dto_1.UpdateRecipeDto, Object]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, recipe_owner_guard_1.RecipeOwnerGuard),
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "remove", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)(':id/comments'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_comment_dto_1.CreateCommentDto, Object]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "addComment", null);
__decorate([
    (0, common_1.Get)(':id/comments'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "listComments", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Delete)('comments/:commentId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('commentId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "deleteComment", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)(':id/like'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "toggleLike", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)(':id/download'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('format')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], RecipesController.prototype, "download", null);
exports.RecipesController = RecipesController = __decorate([
    (0, common_1.Controller)('recipes'),
    __metadata("design:paramtypes", [recipes_service_1.RecipesService])
], RecipesController);
//# sourceMappingURL=recipes.controller.js.map