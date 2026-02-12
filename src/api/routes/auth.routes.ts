import { Router, Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';

const router = Router();
const authService = new AuthService();

// For V1, we use a default user ID
// In production, this would come from authentication middleware
const DEFAULT_USER_ID = 'default-user';

// ============================================================
// Gmail Routes
// ============================================================

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

// ============================================================
// Notion Routes
// ============================================================

/**
 * GET /api/auth/notion/databases
 * List available Notion databases
 */
router.get('/notion/databases', async (req: Request, res: Response) => {
  try {
    const databases = await authService.getNotionDatabases();
    res.json({ success: true, databases });
  } catch (error) {
    console.error('Error listing databases:', error);
    res.status(500).json({ success: false, error: 'Failed to list databases' });
  }
});

/**
 * GET /api/auth/notion/status
 * Check Notion connection status
 */
router.get('/notion/status', (req: Request, res: Response) => {
  const connected = !!process.env.NOTION_TOKEN;
  res.json({ success: true, connected });
});

// ============================================================
// Google Calendar Routes
// ============================================================

/**
 * GET /api/auth/google-calendar/connect
 * Start Google Calendar OAuth flow
 */
router.get('/google-calendar/connect', (req: Request, res: Response) => {
  try {
    const authUrl = authService.getGoogleCalendarAuthUrl();
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Error generating calendar auth URL:', error);
    res.status(500).json({ success: false, error: 'Failed to generate auth URL' });
  }
});

/**
 * GET /api/auth/google-calendar/callback
 * Handle OAuth callback from Google
 */
router.get('/google-calendar/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Authorization code missing' });
    }

    await authService.handleGoogleCalendarCallback(code, DEFAULT_USER_ID);

    res.send(`
      <html>
        <body>
          <h1>✅ Google Calendar Connected Successfully!</h1>
          <p>You can close this window and return to the application.</p>
          <script>window.close();</script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error handling calendar callback:', error);
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
 * GET /api/auth/google-calendar/status
 * Check if Google Calendar is connected
 */
router.get('/google-calendar/status', async (req: Request, res: Response) => {
  try {
    const status = await authService.getGoogleCalendarStatus(DEFAULT_USER_ID);
    res.json({ success: true, ...status });
  } catch (error) {
    console.error('Error checking calendar status:', error);
    res.status(500).json({ success: false, error: 'Failed to check status' });
  }
});

/**
 * GET /api/auth/google-calendar/list
 * List available calendars
 */
router.get('/google-calendar/list', async (req: Request, res: Response) => {
  try {
    const calendars = await authService.listGoogleCalendars(DEFAULT_USER_ID);
    res.json({ success: true, calendars });
  } catch (error) {
    console.error('Error listing calendars:', error);
    res.status(500).json({ success: false, error: 'Failed to list calendars' });
  }
});

/**
 * POST /api/auth/google-calendar/disconnect
 * Disconnect Google Calendar
 */
router.post('/google-calendar/disconnect', async (req: Request, res: Response) => {
  try {
    await authService.disconnectGoogleCalendar(DEFAULT_USER_ID);
    res.json({ success: true, message: 'Google Calendar disconnected' });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    res.status(500).json({ success: false, error: 'Failed to disconnect' });
  }
});

export default router;
