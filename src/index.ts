import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import { pool, closeDatabase } from './config/database';
import workflowRoutes from './api/routes/workflow.routes';
import authRoutes from './api/routes/auth.routes';

import { closeRedis } from './config/redis';
import './queue/workflow.worker'; // This starts the worker

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/workflows', workflowRoutes);
app.use('/api/auth', authRoutes);

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
    console.log(`🚀 FlowForge server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 API: http://localhost:${PORT}/api/workflows`);
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        await closeDatabase();
        await closeRedis();
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(async () => {
        await closeDatabase();
        await closeRedis();
        process.exit(0);
    });
});
