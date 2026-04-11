import { Router } from 'express';
import * as PensumController from '../controllers/PensumController';

const router = Router();

// GET /api/pensum?carnet=202030556
router.get('/', PensumController.getPensumByCarnet);

export default router;
