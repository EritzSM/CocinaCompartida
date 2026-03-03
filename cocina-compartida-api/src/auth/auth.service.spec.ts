import { NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  const mockUserService: any = { findByEmail: jest.fn() };
  const mockJwtService: any = { sign: jest.fn() };

  beforeEach(() => {
    mockUserService.findByEmail.mockReset();
    mockJwtService.sign.mockReset();
    authService = new AuthService(mockUserService, mockJwtService);
  });

  it('returns success and token when credentials are valid', async () => {
    const user = {
      id: '1',
      email: 'a@b.com',
      role: 'user',
      username: 'tester',
      avatar: 'http://img.test/1.png',
      password: 'hashed',
    } as any;

    mockUserService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockJwtService.sign.mockReturnValue('signed-token');

    const result = await authService.login({ email: 'a@b.com', password: 'plain' } as any);

    expect(result).toEqual({ success: true, token: 'signed-token' });
    expect(mockJwtService.sign).toHaveBeenCalled();
  });

  it('throws NotFoundException when user not found', async () => {
    mockUserService.findByEmail.mockResolvedValue(null);

    await expect(authService.login({ email: 'no@user', password: 'x' } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws NotFoundException when password does not match', async () => {
    const user = { id: '1', email: 'a@b.com', password: 'hashed' } as any;
    mockUserService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(authService.login({ email: 'a@b.com', password: 'wrong' } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('calls bcrypt.compare with provided password and stored hash', async () => {
    const user = { id: '1', email: 'a@b.com', password: 'storedhash' } as any;
    mockUserService.findByEmail.mockResolvedValue(user);
    const spy = (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockJwtService.sign.mockReturnValue('t');

    await authService.login({ email: 'a@b.com', password: 'mypw' } as any);

    expect(spy).toHaveBeenCalledWith('mypw', 'storedhash');
  });

  it('includes avatar as url in jwt payload', async () => {
    const user = {
      id: '2',
      email: 'z@z.com',
      role: 'admin',
      username: 'me',
      avatar: 'avatar.png',
      password: 'h',
    } as any;
    mockUserService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    let capturedPayload: any = null;
    mockJwtService.sign.mockImplementation((p) => {
      capturedPayload = p;
      return 'tok';
    });

    await authService.login({ email: 'z@z.com', password: 'p' } as any);

    expect(capturedPayload.url).toBe('avatar.png');
    expect(capturedPayload.username).toBe('me');
    expect(capturedPayload.role).toBe('admin');
  });

  it('propagates errors from jwtService.sign', async () => {
    const user = { id: '3', email: 'x@x.com', password: 'h', role: 'u', username: 'u', avatar: null } as any;
    mockUserService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockJwtService.sign.mockImplementation(() => {
      throw new Error('sign-fail');
    });

    await expect(authService.login({ email: 'x@x.com', password: 'p' } as any)).rejects.toThrow('sign-fail');
  });

  it('works when avatar is null and includes null url in payload', async () => {
    const user = { id: '4', email: 'n@n.com', password: 'h', role: 'u', username: 'nu', avatar: null } as any;
    mockUserService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    let payload: any = null;
    mockJwtService.sign.mockImplementation((p) => {
      payload = p;
      return 't2';
    });

    const res = await authService.login({ email: 'n@n.com', password: 'p' } as any);
    expect(res).toEqual({ success: true, token: 't2' });
    expect(payload.url).toBeNull();
  });
});
