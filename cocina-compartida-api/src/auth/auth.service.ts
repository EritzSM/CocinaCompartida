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
    const user = await this.userService.findByUsername(request.username);

    if (!user) {
      throw new NotFoundException('Usuario o contraseña incorrectos');
    }

    const isMatch = await bcrypt.compare(request.password, user.password);

    if (!isMatch) {
      throw new NotFoundException('Usuario o contraseña incorrectos');
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      url: user.avatar,
    };

    return {
      success: true,
      token: this.jwtService.sign(payload),
    };
  }
}
