import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

// Define la ruta base para este controlador: /recipes
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post() // Maneja peticiones POST a /recipes
  create(@Body() createRecipeDto: CreateRecipeDto) {
    return this.recipesService.create(createRecipeDto);
  }

  @Get() // Maneja peticiones GET a /recipes
  findAll() {
    return this.recipesService.findAll();
  }

  @Get(':id') // Maneja peticiones GET a /recipes/:id
  findOne(@Param('id') id: string) {
    return this.recipesService.findOne(id);
  }

  @Patch(':id') // Maneja peticiones PATCH a /recipes/:id
  update(@Param('id') id: string, @Body() updateRecipeDto: UpdateRecipeDto) {
    return this.recipesService.update(id, updateRecipeDto);
  }

  @Delete(':id') // Maneja peticiones DELETE a /recipes/:id
  @HttpCode(HttpStatus.NO_CONTENT) // Devuelve un código 204 en lugar de 200 por defecto
  remove(@Param('id') id: string) {
    return this.recipesService.remove(id);
  }
}
