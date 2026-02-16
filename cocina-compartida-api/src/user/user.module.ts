import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';

import { RecipesModule } from '../recipes/recipes.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),

    forwardRef(() => AuthModule),
    forwardRef(() => RecipesModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [
    UserService,
    TypeOrmModule, 
  ],
})
export class UserModule {}
