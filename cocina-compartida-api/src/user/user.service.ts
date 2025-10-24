// src/users/users.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  // Array en memoria para simular la base de datos de usuarios.
  private users: User[] = [];

  /**
   * Método privado para omitir la contraseña de un objeto de usuario.
   * ¡NUNCA devuelvas la contraseña en una respuesta de la API!
   * @param user - El objeto de usuario completo.
   * @returns Un objeto de usuario sin la propiedad 'password'.
   */
  private omitPassword(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  findAll() {
    // Devuelve todos los usuarios, pero sin sus contraseñas.
    return this.users.map(this.omitPassword);
  }

  findOne(id: string) {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    // Devuelve el usuario encontrado, pero sin su contraseña.
    return this.omitPassword(user);
  }

  create(createUserDto: CreateUserDto) {
    // Comprobar si el username ya existe
    const existingUser = this.users.find(
      (u) => u.username === createUserDto.username,
    );
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // En un proyecto real, aquí deberías "hashear" la contraseña antes de guardarla.
    // Ejemplo con una librería como bcrypt:
    // const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser: User = {
      id: uuidv4(),
      ...createUserDto,
      // password: hashedPassword, // <- Así se guardaría en un caso real
    };

    this.users.push(newUser);

    // Devuelve el nuevo usuario creado, pero sin su contraseña.
    return this.omitPassword(newUser);
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    // Busca el usuario por su ID
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Si se está intentando cambiar el username, verificar que no exista ya
    if (
      updateUserDto.username &&
      this.users.some(
        (u) => u.username === updateUserDto.username && u.id !== id,
      )
    ) {
      throw new ConflictException('Username already exists');
    }

    // Actualiza el objeto de usuario
    this.users[userIndex] = { ...this.users[userIndex], ...updateUserDto };
    
    // Devuelve el usuario actualizado, pero sin su contraseña.
    return this.omitPassword(this.users[userIndex]);
  }

  remove(id: string) {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    this.users.splice(userIndex, 1);
  }
}
