"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const recipes_service_1 = require("./recipes.service");
const recipes_controller_1 = require("./recipes.controller");
const recipe_entity_1 = require("./entities/recipe.entity");
const comment_entity_1 = require("./entities/comment.entity");
const auth_module_1 = require("../auth/auth.module");
const recipe_owner_guard_1 = require("../security/recipe-owner.guard");
let RecipesModule = class RecipesModule {
};
exports.RecipesModule = RecipesModule;
exports.RecipesModule = RecipesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([recipe_entity_1.Recipe, comment_entity_1.Comment]),
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
        ],
        controllers: [recipes_controller_1.RecipesController],
        providers: [recipes_service_1.RecipesService, recipe_owner_guard_1.RecipeOwnerGuard],
        exports: [recipes_service_1.RecipesService],
    })
], RecipesModule);
//# sourceMappingURL=recipes.module.js.map