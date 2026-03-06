import { Request, Response } from 'express';
import { cacheService } from '../config/upstash';
import googlePlacesService from '../services/googlePlacesService';

export const googlePlacesController = {
    async searchPlaces(req: Request, res: Response) {
        try {
            const latitude = parseFloat(req.query.latitude as string);
            const longitude = parseFloat(req.query.longitude as string);
            const radius = parseFloat(req.query.radius as string) || 1000;
            const type = req.query.type as string | undefined;

            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({
                    success: false,
                    message: 'latitude and longitude are required',
                });
            }

            const cacheKey = `places:${latitude}:${longitude}:${radius}:${type || ''}`;
            const cached = await cacheService.getCache<any[]>(cacheKey);

            if (cached) {
                return res.json({ success: true, count: cached.length, data: cached, source: 'cache' });
            }

            const places = await googlePlacesService.searchNearby(latitude, longitude, radius, type);
            await cacheService.setCache(cacheKey, places, 3600);

            return res.json({ success: true, count: places.length, data: places, source: 'googlePlaces' });
        } catch (error) {
            console.error('Google Places search error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch places' });
        }
    },
};
