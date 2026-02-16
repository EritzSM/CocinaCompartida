export interface LoginResponse {
    success: boolean;
    message?: string;
    token?: string;
    user?: {
        id: string;
        username: string;
        email: string;
        avatar?: string;
        bio?: string;
    };
}