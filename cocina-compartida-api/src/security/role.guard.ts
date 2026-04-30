import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RecipesService } from 'src/recipes/recipes.service';

interface JwtPayload {
  id?: string;
  sub?: string;
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly recipesService: RecipesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.header('authorization');

    if (!authorization) {
      throw new ForbiddenException('Acceso no autorizado');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(this.getToken(authorization));
      const authenticatedUserId = payload.sub ?? payload.id;

      if (!authenticatedUserId) {
        throw new ForbiddenException('Token sin id');
      }

      if (request.params?.id) {
        const recipe = await this.recipesService.findOne(request.params.id);

        if (recipe.user?.id !== authenticatedUserId) {
          throw new ForbiddenException('Solo puedes editar o eliminar tus propias recetas');
        }

        return true;
      }

      if (authenticatedUserId !== request.body?.userId) {
        throw new ForbiddenException('Accion no autorizada');
      }

      return true;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Receta no encontrada');
      }

      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ForbiddenException(this.getErrorMessage(error));
    }
  }

  private getToken(authorization: string): string {
    const token = authorization.split(' ');
    return token.length > 1 ? token[1] : token[0];
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error && error.message ? error.message : 'Token no valido';
  }
}
