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
  Res,
  Query,
} from '@nestjs/common';
import { join } from 'path';
import type { Response } from 'express';
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

  @UseGuards(AuthGuard)
  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Query('format') format: string = 'pdf',
    @Req() req,
    @Res() res: Response,
  ) {
    const recipe = await this.recipesService.findOne(id);

    // Si piden imagen y la receta tiene imágenes, enviar la primera imagen
    if (format === 'image') {
      if (Array.isArray(recipe.images) && recipe.images.length > 0) {
        const imgUrl = recipe.images[0];
        const filename = imgUrl.split('/').pop();
        if (!filename) {
          return res.status(404).json({ error: 'Image filename not found' });
        }
        const root = join(process.cwd(), 'uploads', 'recipes', id);
        return res.sendFile(filename, { root }, (err) => {
          if (err) {
            res.status(404).json({ error: 'Image not found' });
          }
        });
      }
      // Si no hay imagen, caemos a generar PDF
    }

    // Generar PDF simple con pdfkit
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
      recipe.ingredients.forEach((ing: string, i: number) => doc.text(`${i + 1}. ${ing}`));
      doc.moveDown();
    }

    if (Array.isArray(recipe.steps) && recipe.steps.length) {
      doc.fontSize(14).text('Pasos:');
      doc.fontSize(12);
      recipe.steps.forEach((step: string, i: number) => {
        doc.text(`${i + 1}. ${step}`);
        doc.moveDown(0.2);
      });
    }

    doc.end();
  }
}
