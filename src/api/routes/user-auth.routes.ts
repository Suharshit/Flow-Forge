import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { UserAuthService } from '../../services/user-auth.service';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';

const router = Router();
const authService = new UserAuthService();

/**
 * POST /api/auth/user/register
 * Register new user
 */
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Invalid email address'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        body('name').optional().trim(),
        validate,
    ],
    async (req: Request, res: Response) => {
        try {
            const result = await authService.register(req.body);
            res.status(201).json({ success: true, ...result });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Registration failed';
            res.status(400).json({ success: false, error: message });
        }
    }
);

/**
 * POST /api/auth/user/login
 * Login user
 */
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Invalid email address'),
        body('password').notEmpty().withMessage('Password is required'),
        validate,
    ],
    async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.json({ success: true, ...result });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Login failed';
            res.status(401).json({ success: false, error: message });
        }
    }
);

/**
 * GET /api/auth/user/verify-email
 * Verify email with token
 */
router.get('/verify-email', async (req: Request, res: Response) => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            return res.status(400).send('<h1>Invalid verification link</h1>');
        }

        const result = await authService.verifyEmail(token);

        res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>✅ Email Verified Successfully!</h1>
          <p>${result.message}</p>
          <p>You can now close this window and log in to your account.</p>
        </body>
      </html>
    `);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Verification failed';
        res.status(400).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>❌ Verification Failed</h1>
          <p>${message}</p>
        </body>
      </html>
    `);
    }
});

/**
 * POST /api/auth/user/resend-verification
 * Resend verification email
 */
router.post(
    '/resend-verification',
    [body('email').isEmail().withMessage('Invalid email address'), validate],
    async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            const result = await authService.resendVerification(email);
            res.json({ success: true, ...result });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to resend verification';
            res.status(400).json({ success: false, error: message });
        }
    }
);

/**
 * POST /api/auth/user/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ success: false, error: 'Refresh token required' });
        }

        const tokens = await authService.refreshToken(refreshToken);
        res.json({ success: true, tokens });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Token refresh failed';
        res.status(401).json({ success: false, error: message });
    }
});

/**
 * POST /api/auth/user/logout
 * Logout user
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await authService.logout(refreshToken);
        }

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Logout failed' });
    }
});

/**
 * POST /api/auth/user/forgot-password
 * Request password reset
 */
router.post(
    '/forgot-password',
    [body('email').isEmail().withMessage('Invalid email address'), validate],
    async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            const result = await authService.forgotPassword(email);
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to process request' });
        }
    }
);

/**
 * POST /api/auth/user/reset-password
 * Reset password with token
 */
router.post(
    '/reset-password',
    [
        body('token').notEmpty().withMessage('Reset token required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        validate,
    ],
    async (req: Request, res: Response) => {
        try {
            const { token, password } = req.body;
            const result = await authService.resetPassword(token, password);
            res.json({ success: true, ...result });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Password reset failed';
            res.status(400).json({ success: false, error: message });
        }
    }
);

/**
 * GET /api/auth/user/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const profile = await authService.getProfile(userId);
        res.json({ success: true, user: profile });
    } catch (error) {
        res.status(404).json({ success: false, error: 'User not found' });
    }
});

/**
 * PUT /api/auth/user/me
 * Update user profile
 */
router.put(
    '/me',
    [authenticateToken, body('name').optional().trim(), validate],
    async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const user = await authService.updateProfile(userId, req.body);
            res.json({ success: true, user });
        } catch (error) {
            res.status(400).json({ success: false, error: 'Update failed' });
        }
    }
);

/**
 * PUT /api/auth/user/password
 * Change password
 */
router.put(
    '/password',
    [
        authenticateToken,
        body('currentPassword').notEmpty().withMessage('Current password required'),
        body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
        validate,
    ],
    async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const { currentPassword, newPassword } = req.body;
            const result = await authService.changePassword(userId, currentPassword, newPassword);
            res.json({ success: true, ...result });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Password change failed';
            res.status(400).json({ success: false, error: message });
        }
    }
);

/**
 * DELETE /api/auth/user/account
 * Delete user account
 */
router.delete(
    '/account',
    [
        authenticateToken,
        body('password').notEmpty().withMessage('Password required'),
        validate,
    ],
    async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const { password } = req.body;
            const result = await authService.deleteAccount(userId, password);
            res.json({ success: true, ...result });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Account deletion failed';
            res.status(400).json({ success: false, error: message });
        }
    }
);

export default router;
