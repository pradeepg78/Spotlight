import {Router} from 'express';
import { eventController } from '../controllers/eventController';

const router = Router();

// search events route
router.get('/search', eventController.searchEvents);

export default router;