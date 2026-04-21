import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Recipe } from '../recipes/entities/recipe.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Recipe, User])],
  providers: [SeederService],
})
export class SeederModule {}
