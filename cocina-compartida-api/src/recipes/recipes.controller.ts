import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

import { AuthGuard } from 'src/security/auth.guard';
import { RecipeOwnerGuard } from 'src/security/recipe-owner.guard';

@Controller('recipes')
@UseGuards(AuthGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  create(@Body() createRecipeDto: CreateRecipeDto, @Req() req) {
    return this.recipesService.create(createRecipeDto, req.user);
  }

  @Get()
  findAll() {
    return this.recipesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recipesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RecipeOwnerGuard)
  update(
    @Param('id') id: string,
    @Body() updateRecipeDto: UpdateRecipeDto,
    @Req() req,
  ) {
    return this.recipesService.update(id, updateRecipeDto, req.user);
  }

  @Delete(':id')
  @UseGuards(RecipeOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req) {
    return this.recipesService.remove(id, req.user);
  }
}
