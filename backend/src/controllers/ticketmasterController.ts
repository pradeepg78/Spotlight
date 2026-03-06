import { Request, Response } from 'express';
import { cacheService } from '../config/upstash';
import ticketmasterService from '../services/ticketmasterService';

export const ticketmasterController = {
    async searchByLocation(req: Request, res: Response) {
        try {
            const latitude = parseFloat(req.query.latitude as string);
            const longitude = parseFloat(req.query.longitude as string);
            const radius = parseFloat(req.query.radius as string) || 25;
            const keyword = req.query.keyword as string | undefined;
            // dates come in as "YYYY-MM-DD", convert to ISO for Ticketmaster API
            const startDate = req.query.startDate as string | undefined;
            const endDate = req.query.endDate as string | undefined;
            const startDateTime = startDate ? `${startDate}T00:00:00Z` : undefined;
            const endDateTime = endDate ? `${endDate}T23:59:59Z` : undefined;

            console.log(`[TM] lat=${latitude} lng=${longitude} radius=${radius} start=${startDateTime} end=${endDateTime}`);

            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({
                    success: false,
                    message: 'latitude and longitude are required',
                });
            }

            const cacheKey = `tm:${latitude}:${longitude}:${radius}:${keyword || ''}:${startDate || ''}:${endDate || ''}`;
            const cached = await cacheService.getCache<any[]>(cacheKey);

            if (cached) {
                return res.json({ success: true, count: cached.length, data: cached, source: 'cache' });
            }

            const events = await ticketmasterService.searchByLocation(latitude, longitude, radius, keyword, startDateTime, endDateTime);
            await cacheService.setCache(cacheKey, events, 3600);

            return res.json({ success: true, count: events.length, data: events, source: 'ticketmaster' });
        } catch (error) {
            console.error('Ticketmaster search error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch events' });
        }
    },

    async getEventsForVenues(req: Request, res: Response) {
        try {
            const body = req.body as {
                places?: Array<{ name: string; latitude: number; longitude: number }>;
                startDate?: string;
                endDate?: string;
            };
            const places = body?.places ?? [];
            const startDate = body?.startDate as string | undefined;
            const endDate = body?.endDate as string | undefined;
            const startDateTime = startDate ? `${startDate}T00:00:00Z` : undefined;
            const endDateTime = endDate ? `${endDate}T23:59:59Z` : undefined;

            if (places.length === 0) {
                return res.json({ success: true, data: [] });
            }

            const data = await ticketmasterService.getEventsForPlaces(places, startDateTime, endDateTime);
            return res.json({ success: true, data });
        } catch (error) {
            console.error('Ticketmaster getEventsForVenues error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch events for venues' });
        }
    },
};
