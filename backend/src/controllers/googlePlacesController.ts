import { Request, Response } from 'express';
import { cacheService } from '../config/cache';
import googlePlacesService from '../services/googlePlacesService';

export const googlePlacesController = {
    async searchPlaces(req: Request, res: Response) {
        try {
            const latitude = parseFloat(req.query.latitude as string);
            const longitude = parseFloat(req.query.longitude as string);
            const radius = parseFloat(req.query.radius as string) || 1000;
            const type = req.query.type as string | undefined;
            const keyword = req.query.keyword as string | undefined;

            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({
                    success: false,
                    message: 'latitude and longitude are required',
                });
            }

            const cacheKey = `places:${latitude}:${longitude}:${radius}:${type || ''}:${keyword || ''}`;
            const cached = await cacheService.getCache<any[]>(cacheKey);

            if (cached) {
                return res.json({ success: true, count: cached.length, data: cached, source: 'cache' });
            }

            const places = await googlePlacesService.searchNearby(latitude, longitude, radius, type, keyword);
            await cacheService.setCache(cacheKey, places, 3600);

            return res.json({ success: true, count: places.length, data: places, source: 'googlePlaces' });
        } catch (error) {
            console.error('Google Places search error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch places' });
        }
    },

    /**
     * Look up a single named venue near a coordinate.
     *
     * The map popup previously called the generic nearby search and displayed
     * the first result, which meant it showed the rating of an arbitrary
     * neighbouring business. This resolves the actual venue, or nothing.
     */
    async getVenue(req: Request, res: Response) {
        try {
            const name = req.query.name as string | undefined;
            const latitude = parseFloat(req.query.latitude as string);
            const longitude = parseFloat(req.query.longitude as string);
            const radius = parseFloat(req.query.radius as string) || 800;

            if (!name) {
                return res.status(400).json({ success: false, message: 'name is required' });
            }

            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({
                    success: false,
                    message: 'latitude and longitude are required',
                });
            }

            const cacheKey = `venue:${name}:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${radius}`;
            const cached = await cacheService.getCache<any>(cacheKey);

            if (cached) {
                return res.json({ success: true, data: cached, source: 'cache' });
            }

            const venue = await googlePlacesService.findVenue(name, latitude, longitude, radius);
            // Cache misses too - a venue Google does not know about will not
            // start existing on the next click.
            await cacheService.setCache(cacheKey, venue, 3600);

            return res.json({ success: true, data: venue, source: 'googlePlaces' });
        } catch (error) {
            console.error('Google Places venue lookup error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch venue' });
        }
    },
};
