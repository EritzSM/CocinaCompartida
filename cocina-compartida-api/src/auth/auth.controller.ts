import {Controller,Post,Body,BadRequestException} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @Post('login')
  login(@Body() request: LoginDto) {
    if (request.password && request.username) {
      return this.authService.login(request);
    }
    throw new BadRequestException('username y password son obligatorios');
  }
}