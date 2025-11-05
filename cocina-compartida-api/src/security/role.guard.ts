import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RecipesService } from 'src/recipes/recipes.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private jwtService: JwtService, private recipesService: RecipesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const params = request.params;
    const authorization = request.header('authorization');
    if (!authorization) {
      throw new ForbiddenException('Acceso no autorizado');
    }
    const token = this.getToken(authorization);
    try {
      const payload = this.jwtService.verify(token);
      console.log(payload);


      if (params.id) {
        const recipe = await this.recipesService.findOne(params.id);
        if (recipe.user.id !== payload['id']) {
          throw new ForbiddenException('Solo puedes editar o eliminar tus propias recetas');
        }
      } else {

        const body = request.body;
        if (payload['id'] !== body['userId']) {
          throw new ForbiddenException('Acción no autorizada');
        }
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Receta no encontrada');
      }
      console.log(error.message);
      throw new ForbiddenException(error.message || 'Token no valido');
    }
    return true;
  }

  private getToken(authorization: string) {
    let token = authorization.split(' ');
    if (token.length > 1) {
      return token[1];
    }
    return token[0];
  }
}