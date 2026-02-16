// src/recipes/dto/create-recipe.dto.ts
import { IsString, IsArray, IsOptional, ArrayMinSize } from 'class-validator';

export class CreateRecipeDto {
  @IsString()
  name: string;

  @IsString()
  descripcion: string;

  @IsArray() @ArrayMinSize(1)
  @IsString({ each: true })
  ingredients: string[];

  @IsArray() @ArrayMinSize(1)
  @IsString({ each: true })
  steps: string[];

  @IsArray() @IsOptional()
  @IsString({ each: true })
  images?: string[];
}
