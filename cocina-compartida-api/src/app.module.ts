import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RecipesModule } from './recipes/recipes.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [RecipesModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
