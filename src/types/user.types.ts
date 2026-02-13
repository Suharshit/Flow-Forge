export interface User {
    id: string;
    email: string;
    password_hash: string;
    name?: string;
    is_verified: boolean;
    verification_token?: string;
    verification_token_expiry?: Date;
    reset_token?: string;
    reset_token_expiry?: Date;
    created_at: Date;
    updated_at: Date;
    last_login_at?: Date;
}

export interface CreateUserDTO {
    email: string;
    password: string;
    name?: string;
}

export interface UpdateUserDTO {
    name?: string;
    email?: string;
}

export interface ChangePasswordDTO {
    currentPassword: string;
    newPassword: string;
}

export interface UserSession {
    id: string;
    user_id: string;
    refresh_token: string;
    expires_at: Date;
    created_at: Date;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface JWTPayload {
    userId: string;
    email: string;
}

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        name?: string;
        is_verified: boolean;
    };
    tokens: AuthTokens;
}
