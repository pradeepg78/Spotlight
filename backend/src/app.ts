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

// Before this change neither route was mounted, so both requests 404'd
// and because the frontend catches errors and returns [], the map rendered
// empty instead of failing loudly.
app.use('/api/ticketmaster', ticketmasterRoutes);
app.use('/api/googlePlace', googlePlacesRoutes);

// Keyword + city search, nothing in the app calls it now
app.use('/api/events', eventRoutes);

app.use('/api/ticketmaster', ticketmasterRoutes);
app.use('/api/googlePlace', googlePlacesRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

export default app;
