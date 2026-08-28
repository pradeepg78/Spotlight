import express from 'express';
import { Express, Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import eventRoutes from './routes/events';
import ticketmasterRoutes from './routes/ticketmaster';
import googlePlacesRoutes from './routes/googlePlaces';

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
    res.json({
        message: 'Spotlight is running!'
    });
});

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

app.use('/api/events', eventRoutes);
app.use('/api/ticketmaster', ticketmasterRoutes);
app.use('/api/googlePlace', googlePlacesRoutes);

export default app;
