import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RecipesService } from 'src/recipes/recipes.service';
export declare class RoleGuard implements CanActivate {
    private jwtService;
    private recipesService;
    constructor(jwtService: JwtService, recipesService: RecipesService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getToken;
}
