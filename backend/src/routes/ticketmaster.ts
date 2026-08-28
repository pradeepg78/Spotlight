import { Router } from 'express';
import { ticketmasterController } from '../controllers/ticketmasterController';

const router = Router();

router.get('/search', ticketmasterController.searchByLocation);
router.post('/events-for-venues', ticketmasterController.getEventsForVenues);

export default router;
