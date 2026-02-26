import { Injectable, NotFoundException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(request: LoginDto) {
    const user = await this.userService.findByEmail(request.email);

    if (!user) {
      throw new NotFoundException('Correo o contraseña incorrectos');
    }

    const isMatch = await bcrypt.compare(request.password, user.password);

    if (!isMatch) {
      throw new NotFoundException('Correo o contraseña incorrectos');
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      url: user.avatar,
    };

    return {
      success: true,
      token: this.jwtService.sign(payload),
    };
  }
}
