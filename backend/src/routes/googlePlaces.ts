import { Router } from 'express';
import { googlePlacesController } from '../controllers/googlePlacesController';

const router = Router();

router.get('/search', googlePlacesController.searchPlaces);
router.get('/venue', googlePlacesController.getVenue);

export default router;
