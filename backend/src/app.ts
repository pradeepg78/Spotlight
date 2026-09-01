import express from 'express';
import { Express, Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import eventRoutes from './routes/events';
import ticketmasterRoutes from './routes/ticketmaster';
import googlePlacesRoutes from './routes/googlePlaces';
import { cacheService } from './config/cache';

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
app.get('/health', async (_req: Request, res: Response) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        cache: await cacheService.getStats()
    });
});

// Ticketmaster: geo event search + batch venue lookup
app.use('/api/ticketmaster', ticketmasterRoutes);

// Google Places: nearby search + single venue resolution
app.use('/api/googlePlace', googlePlacesRoutes);

// Keyword + city event search
app.use('/api/events', eventRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

export default app;
