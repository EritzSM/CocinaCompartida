import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(request: LoginDto): Promise<{
        success: boolean;
        token: string;
    }>;
}
