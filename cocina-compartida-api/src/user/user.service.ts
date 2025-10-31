import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>
  ) {}

  private omitPassword(user: User) {
    if (!user) return null;
    const { password, ...data } = user;
    return data;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.userRepo.findOne({ where: { username: dto.username } });
    if (exists) throw new ConflictException('Username exists');

    const hash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({ ...dto, password: hash });
    await this.userRepo.save(user);

    return this.omitPassword(user);
  }

  async findAll() {
    const users = await this.userRepo.find();
    return users.map(u => this.omitPassword(u));
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException();
    return this.omitPassword(user);
  }

  
  async findByUsername(username: string) {
    const user = await this.userRepo.findOne({
      where: { username },
      select: ['id', 'username', 'password', 'email', 'avatar'] // 👈 Mostrar password intencionalmente
    });
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.userRepo.update(id, dto);
    const updated = await this.userRepo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException();
    return this.omitPassword(updated);
  }

  async remove(id: string) {
    const result = await this.userRepo.softDelete(id); // ✅ Mejor soft delete
    if (!result.affected) throw new NotFoundException();
    return { success: true, message: 'User removed' };
  }
}
