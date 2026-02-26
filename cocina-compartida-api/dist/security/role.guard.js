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
exports.RoleGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const recipes_service_1 = require("../recipes/recipes.service");
let RoleGuard = class RoleGuard {
    jwtService;
    recipesService;
    constructor(jwtService, recipesService) {
        this.jwtService = jwtService;
        this.recipesService = recipesService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const params = request.params;
        const authorization = request.header('authorization');
        if (!authorization) {
            throw new common_1.ForbiddenException('Acceso no autorizado');
        }
        const token = this.getToken(authorization);
        try {
            const payload = this.jwtService.verify(token);
            console.log(payload);
            if (params.id) {
                const recipe = await this.recipesService.findOne(params.id);
                if (recipe.user.id !== payload['id']) {
                    throw new common_1.ForbiddenException('Solo puedes editar o eliminar tus propias recetas');
                }
            }
            else {
                const body = request.body;
                if (payload['id'] !== body['userId']) {
                    throw new common_1.ForbiddenException('Acción no autorizada');
                }
            }
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw new common_1.NotFoundException('Receta no encontrada');
            }
            console.log(error.message);
            throw new common_1.ForbiddenException(error.message || 'Token no valido');
        }
        return true;
    }
    getToken(authorization) {
        let token = authorization.split(' ');
        if (token.length > 1) {
            return token[1];
        }
        return token[0];
    }
};
exports.RoleGuard = RoleGuard;
exports.RoleGuard = RoleGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService, recipes_service_1.RecipesService])
], RoleGuard);
//# sourceMappingURL=role.guard.js.map