import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  const mockAuthService: any = { login: jest.fn() };

  beforeEach(() => {
    mockAuthService.login.mockReset();
    controller = new AuthController(mockAuthService);
  });

  it('calls authService.login when email and password are present', () => {
    const dto = { email: 'a@b.com', password: 'p' };
    mockAuthService.login.mockReturnValue({ success: true });

    const res = controller.login(dto as any);
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ success: true });
  });

  it('throws BadRequestException when email is missing', () => {
    const dto = { password: 'p' } as any;
    expect(() => controller.login(dto)).toThrow(BadRequestException);
  });

  it('throws BadRequestException when password is missing', () => {
    const dto = { email: 'a@b.com' } as any;
    expect(() => controller.login(dto)).toThrow(BadRequestException);
  });

  it('propagates errors from authService.login', () => {
    const dto = { email: 'x@x.com', password: 'p' } as any;
    mockAuthService.login.mockImplementation(() => {
      throw new NotFoundException('bad');
    });

    expect(() => controller.login(dto)).toThrow(NotFoundException);
  });

  it('returns whatever authService.login returns', () => {
    const dto = { email: 'ok@ok.com', password: 'p' } as any;
    const out = { success: true, token: 't' };
    mockAuthService.login.mockReturnValue(out);

    expect(controller.login(dto)).toBe(out);
  });

  it('forwards the exact object passed to authService.login (extra fields allowed)', () => {
    const dto: any = { email: 'e@e', password: 'p', extra: 'v' };
    mockAuthService.login.mockReturnValue({ success: true });

    controller.login(dto);
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
  });
});
