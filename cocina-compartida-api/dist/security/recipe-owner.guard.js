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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeOwnerGuard = void 0;
const common_1 = require("@nestjs/common");
const recipes_service_1 = require("../recipes/recipes.service");
let RecipeOwnerGuard = class RecipeOwnerGuard {
    recipes;
    constructor(recipes) {
        this.recipes = recipes;
    }
    async canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const userId = req.user?.id;
        const recipeId = req.params?.id;
        if (!userId)
            throw new common_1.ForbiddenException('No autenticado');
        if (!recipeId)
            throw new common_1.NotFoundException('Receta no encontrada');
        const recipe = await this.recipes.findOne(recipeId);
        if (!recipe)
            throw new common_1.NotFoundException('Receta no encontrada');
        if (recipe.user?.id !== userId) {
            throw new common_1.ForbiddenException('Solo el dueño puede realizar esta acción');
        }
        return true;
    }
};
exports.RecipeOwnerGuard = RecipeOwnerGuard;
exports.RecipeOwnerGuard = RecipeOwnerGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [recipes_service_1.RecipesService])
], RecipeOwnerGuard);
//# sourceMappingURL=recipe-owner.guard.js.map