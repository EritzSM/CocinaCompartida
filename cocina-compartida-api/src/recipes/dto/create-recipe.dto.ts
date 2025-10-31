import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsArray()
  @IsString({ each: true })
  ingredients: string[];

  @IsArray()
  @IsString({ each: true })
  steps: string[];

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsString()
  @IsNotEmpty()
  author: string;
}
