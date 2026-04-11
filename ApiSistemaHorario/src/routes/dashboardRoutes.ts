import { Router } from 'express';
import * as DashboardController from '../controllers/DashboardController';

const router = Router();

// GET /api/dashboard?carnet=202030556
router.get('/', DashboardController.getDashboardByCarnet);

export default router;
