import express from 'express';
import { Express, Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import eventRoutes from './routes/events';

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({
        message: 'Spotlight is running!'
    });
});

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

app.use('/api/events', eventRoutes);

export default app;