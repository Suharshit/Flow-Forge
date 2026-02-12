import { Router, Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';

const router = Router();
const authService = new AuthService();

// For V1, we use a default user ID
// In production, this would come from authentication middleware
const DEFAULT_USER_ID = 'default-user';

/**
 * GET /api/auth/gmail/connect
 * Start Gmail OAuth flow
 */
router.get('/gmail/connect', (req: Request, res: Response) => {
    try {
        const authUrl = authService.getGmailAuthUrl();
        res.json({ success: true, authUrl });
    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ success: false, error: 'Failed to generate auth URL' });
    }
});

/**
 * GET /api/auth/gmail/callback
 * Handle OAuth callback from Google
 */
router.get('/gmail/callback', async (req: Request, res: Response) => {
    try {
        const { code } = req.query;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ success: false, error: 'Authorization code missing' });
        }

        await authService.handleGmailCallback(code, DEFAULT_USER_ID);

        // Redirect to success page or return JSON
        res.send(`
      <html>
        <body>
          <h1>✅ Gmail Connected Successfully!</h1>
          <p>You can close this window and return to the application.</p>
          <script>window.close();</script>
        </body>
      </html>
    `);
    } catch (error) {
        console.error('Error handling callback:', error);
        res.status(500).send(`
      <html>
        <body>
          <h1>❌ Connection Failed</h1>
          <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        </body>
      </html>
    `);
    }
});

/**
 * GET /api/auth/gmail/status
 * Check if Gmail is connected
 */
router.get('/gmail/status', async (req: Request, res: Response) => {
    try {
        const status = await authService.getGmailStatus(DEFAULT_USER_ID);
        res.json({ success: true, ...status });
    } catch (error) {
        console.error('Error checking status:', error);
        res.status(500).json({ success: false, error: 'Failed to check status' });
    }
});

/**
 * POST /api/auth/gmail/disconnect
 * Disconnect Gmail account
 */
router.post('/gmail/disconnect', async (req: Request, res: Response) => {
    try {
        await authService.disconnectGmail(DEFAULT_USER_ID);
        res.json({ success: true, message: 'Gmail disconnected' });
    } catch (error) {
        console.error('Error disconnecting Gmail:', error);
        res.status(500).json({ success: false, error: 'Failed to disconnect Gmail' });
    }
});

export default router;
