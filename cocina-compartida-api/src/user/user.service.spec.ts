import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findOne: jest.fn(),
      create: jest.fn((u) => u),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    service = new UserService(mockRepo);
  });

  it('debe crear usuario y omitir contraseña', async () => {
    const dto: any = { username: 'u', email: 'e', password: 'p' };
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed');
    mockRepo.findOne.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue({ id: '1', ...dto, password: 'hashed' });

    const result = await service.create(dto);
    expect(result).toEqual({ id: '1', username: 'u', email: 'e' });
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('debe lanzar conflicto si username existe', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 'x' });
    await expect(service.create({ username: 'u', password: 'p' } as any)).rejects.toThrow(ConflictException);
  });

  it('debe lanzar conflicto si email existe', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    mockRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'x' });
    await expect(service.create({ username: 'u', email: 'e', password: 'p' } as any)).rejects.toThrow(ConflictException);
  });

  it('hace hash de la contraseña', async () => {
    const spy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('h');
    mockRepo.findOne.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue({ id: '1', username: 'u', password: 'h' });
    await service.create({ username: 'u', password: 'p' } as any);
    expect(spy).toHaveBeenCalledWith('p', 10);
  });

  it('findAll devuelve usuarios sin contraseña', async () => {
    mockRepo.find.mockResolvedValue([{ id: '1', password: 'x' }]);
    const users = await service.findAll();
    expect(users).toEqual([{ id: '1' }]);
  });

  it('findOne devuelve usuario si existe', async () => {
    mockRepo.findOne.mockResolvedValue({ id: '1', password: 'x' });
    const user = await service.findOne('1');
    expect(user).toEqual({ id: '1' });
  });

  it('findOne lanza NotFoundException si no existe', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
  });

  it('update lanza conflicto si email existente en otro usuario', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 'other', email: 'a' });
    await expect(service.update('1', { email: 'a' } as any)).rejects.toThrow(ConflictException);
  });

  it('update lanza NotFoundException si falta usuario', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    mockRepo.update.mockResolvedValue(undefined);
    await expect(service.update('1', {} as any)).rejects.toThrow(NotFoundException);
  });

  it('remove elimina usuario o lanza NotFoundException', async () => {
    mockRepo.softDelete.mockResolvedValue({ affected: 1 });
    const res = await service.remove('1');
    expect(res).toEqual({ success: true, message: 'User removed' });
    mockRepo.softDelete.mockResolvedValue({ affected: 0 });
    await expect(service.remove('1')).rejects.toThrow(NotFoundException);
  });
});