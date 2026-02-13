import bcrypt from 'bcryptjs';
import { UserRepository } from '../db/repositories/user.repository';
import { SessionRepository } from '../db/repositories/session.repository';
import { EmailService } from './email.service';
import { JWTUtils } from '../utils/jwt.utils';
import { ValidationUtils } from '../utils/validation.utils';
import { CreateUserDTO, AuthResponse, AuthTokens } from '../types/user.types';

export class UserAuthService {
    private userRepo: UserRepository;
    private sessionRepo: SessionRepository;
    private emailService: EmailService;

    constructor() {
        this.userRepo = new UserRepository();
        this.sessionRepo = new SessionRepository();
        this.emailService = new EmailService();
    }

    async register(data: CreateUserDTO): Promise<{ message: string }> {
        // Validate email
        if (!ValidationUtils.isValidEmail(data.email)) {
            throw new Error('Invalid email address');
        }

        // Validate password strength
        const passwordCheck = ValidationUtils.isStrongPassword(data.password);
        if (!passwordCheck.valid) {
            throw new Error(passwordCheck.message!);
        }

        // Check if user exists
        const existingUser = await this.userRepo.findByEmail(data.email);
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Hash password
        const password_hash = await bcrypt.hash(data.password, 10);

        // Create user
        const user = await this.userRepo.create({
            ...data,
            password_hash,
        });

        // Generate verification token
        const verificationToken = ValidationUtils.generateRandomToken();
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24); // 24 hour expiry

        await this.userRepo.setVerificationToken(user.id, verificationToken, expiry);

        // Send verification email
        await this.emailService.sendVerificationEmail(
            user.email,
            user.name || 'User',
            verificationToken
        );

        return {
            message: 'Registration successful. Please check your email to verify your account.',
        };
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        // Find user
        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            throw new Error('Invalid email or password');
        }

        // Check if verified
        if (!user.is_verified) {
            throw new Error('Please verify your email before logging in');
        }

        // Generate tokens
        const tokens = JWTUtils.generateTokens(user.id, user.email);

        // Save refresh token
        await this.sessionRepo.create(
            user.id,
            tokens.refreshToken,
            JWTUtils.getRefreshTokenExpiry()
        );

        // Update last login
        await this.userRepo.updateLastLogin(user.id);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                is_verified: user.is_verified,
            },
            tokens,
        };
    }

    async verifyEmail(token: string): Promise<{ message: string }> {
        const user = await this.userRepo.verifyEmail(token);

        if (!user) {
            throw new Error('Invalid or expired verification token');
        }

        // Send welcome email
        await this.emailService.sendWelcomeEmail(user.email, user.name || 'User');

        return { message: 'Email verified successfully. You can now log in.' };
    }

    async resendVerification(email: string): Promise<{ message: string }> {
        const user = await this.userRepo.findByEmail(email);

        if (!user) {
            throw new Error('User not found');
        }

        if (user.is_verified) {
            throw new Error('Email already verified');
        }

        // Generate new token
        const verificationToken = ValidationUtils.generateRandomToken();
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);

        await this.userRepo.setVerificationToken(user.id, verificationToken, expiry);

        // Send email
        await this.emailService.sendVerificationEmail(
            user.email,
            user.name || 'User',
            verificationToken
        );

        return { message: 'Verification email sent' };
    }

    async refreshToken(refreshToken: string): Promise<AuthTokens> {
        // Verify refresh token
        let payload;
        try {
            payload = JWTUtils.verifyRefreshToken(refreshToken);
        } catch (error) {
            throw new Error('Invalid refresh token');
        }

        // Check if session exists
        const session = await this.sessionRepo.findByToken(refreshToken);
        if (!session) {
            throw new Error('Invalid refresh token');
        }

        // Get user
        const user = await this.userRepo.findById(payload.userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Generate new tokens
        const tokens = JWTUtils.generateTokens(user.id, user.email);

        // Delete old session
        await this.sessionRepo.delete(refreshToken);

        // Create new session
        await this.sessionRepo.create(
            user.id,
            tokens.refreshToken,
            JWTUtils.getRefreshTokenExpiry()
        );

        return tokens;
    }

    async logout(refreshToken: string): Promise<void> {
        await this.sessionRepo.delete(refreshToken);
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await this.userRepo.findByEmail(email);

        if (!user) {
            // Don't reveal if user exists
            return { message: 'If that email is registered, a reset link has been sent' };
        }

        // Generate reset token
        const resetToken = ValidationUtils.generateRandomToken();
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1); // 1 hour expiry

        await this.userRepo.setResetToken(email, resetToken, expiry);

        // Send reset email
        await this.emailService.sendPasswordResetEmail(
            user.email,
            user.name || 'User',
            resetToken
        );

        return { message: 'If that email is registered, a reset link has been sent' };
    }

    async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
        // Validate new password
        const passwordCheck = ValidationUtils.isStrongPassword(newPassword);
        if (!passwordCheck.valid) {
            throw new Error(passwordCheck.message!);
        }

        // Hash new password
        const password_hash = await bcrypt.hash(newPassword, 10);

        // Reset password
        const user = await this.userRepo.resetPassword(token, password_hash);

        if (!user) {
            throw new Error('Invalid or expired reset token');
        }

        return { message: 'Password reset successful. You can now log in.' };
    }

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<{ message: string }> {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
            throw new Error('Current password is incorrect');
        }

        // Validate new password
        const passwordCheck = ValidationUtils.isStrongPassword(newPassword);
        if (!passwordCheck.valid) {
            throw new Error(passwordCheck.message!);
        }

        // Hash new password
        const password_hash = await bcrypt.hash(newPassword, 10);

        // Update password
        await this.userRepo.updatePassword(userId, password_hash);

        // Invalidate all sessions
        await this.sessionRepo.deleteUserSessions(userId);

        return { message: 'Password changed successfully. Please log in again.' };
    }

    async getProfile(userId: string) {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            is_verified: user.is_verified,
            created_at: user.created_at,
            last_login_at: user.last_login_at,
        };
    }

    async updateProfile(userId: string, data: { name?: string }) {
        const user = await this.userRepo.update(userId, data);
        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
        };
    }

    async deleteAccount(userId: string, password: string): Promise<{ message: string }> {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            throw new Error('Incorrect password');
        }

        // Delete all sessions
        await this.sessionRepo.deleteUserSessions(userId);

        // Delete user (cascade will delete all related data)
        await this.userRepo.delete(userId);

        return { message: 'Account deleted successfully' };
    }
}
