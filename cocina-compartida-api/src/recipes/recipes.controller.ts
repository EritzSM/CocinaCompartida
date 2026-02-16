import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthGuard } from 'src/security/auth.guard';
import { RecipeOwnerGuard } from 'src/security/recipe-owner.guard';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  // Crear receta (autenticado)
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() dto: CreateRecipeDto, @Req() req) {
    return this.recipesService.create(dto, req.user);
  }

  // Listar (público)
  @Get()
  findAll() {
    return this.recipesService.findAll();
  }

  // Listar top liked (público)
  @Get('top-liked')
  findTopLiked() {
    return this.recipesService.findTopLiked();
  }

  // Ver una (público)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recipesService.findOne(id);
  }

  // Actualizar (solo dueño)
  @UseGuards(AuthGuard, RecipeOwnerGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRecipeDto, @Req() req) {
    return this.recipesService.update(id, dto, req.user);
  }

  // Eliminar (solo dueño)
  @UseGuards(AuthGuard, RecipeOwnerGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req) {
    return this.recipesService.remove(id, req.user);
  }

  // Comentarios (autenticado)
  @UseGuards(AuthGuard)
  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() dto: CreateCommentDto, @Req() req) {
    return this.recipesService.createComment(id, dto, req.user);
  }

  @Get(':id/comments')
  listComments(@Param('id') id: string) {
    return this.recipesService.findCommentsByRecipe(id);
  }

  @UseGuards(AuthGuard)
  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteComment(@Param('commentId') commentId: string, @Req() req) {
    return this.recipesService.removeComment(commentId, req.user);
  }

  // TOGGLE LIKE (un solo endpoint)
  @UseGuards(AuthGuard)
  @Post(':id/like')
  toggleLike(@Param('id') id: string, @Req() req) {
    return this.recipesService.toggleLike(id, req.user);
  }
}
