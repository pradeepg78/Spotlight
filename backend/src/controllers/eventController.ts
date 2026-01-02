import { Request, Response } from 'express';
import { cacheService } from '../config/upstash';
import ticketmasterService from '../services/ticketmasterService';

export const eventController = {
    async searchEvents(req: Request, res: Response) {
        try {
            // 1. Extract inputs from req
            const keyword = req.query.keyword as string;
            const city = req.query.city as string;

            // 2. Validate inputs
            if (!keyword) {
                return res.status(400).json({
                    success: false,
                    message: 'Keyword parameter is required'
                });
            }

            if (!city) {
                return res.status(400).json({
                    success: false,
                    message: 'City parameter is required'
                });
            }

            // 3. Check if cache key exists
            const cacheKey = `events:${keyword}:${city}`;
            const cachedData = await cacheService.getCache<Event[]>(cacheKey);

            if (cachedData) {
                // 3a. If cacheData exists, return data
                console.log(`Cache key exists: ${cacheKey}`);
                return res.json({
                    success: true,
                    count: cachedData.length,
                    data: cachedData,
                    source: 'redisCache'
                });
            } else {
                // 3b. If doesn't exist, call ticketmasterService and then cache the data
                console.log(`Cache key ${cacheKey} not found. Fetching from ticketmasterService...`);

                //! If no events, it will throw an error which will go to the catch block
                //! Or, this could return an empty array 
                const eventData = await ticketmasterService.searchEvents(keyword, city);

                // Set an expiration on the cache: 3600 = 1hr
                await cacheService.setCache(cacheKey, eventData, 3600);

                return res.json({
                    success: true,
                    count: eventData.length,
                    data: eventData,
                    source: 'ticketmasterService'
                });
            }
        } catch (error) {
            console.error('Search Events error: ', error);
            return res.status(500).json({
                success: false,
                message: 'Search Events error'
            });
        }
    }
};