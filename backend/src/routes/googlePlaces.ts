import { Router } from 'express';
import { googlePlacesController } from '../controllers/googlePlacesController';

const router = Router();

router.get('/search', googlePlacesController.searchPlaces);

export default router;
