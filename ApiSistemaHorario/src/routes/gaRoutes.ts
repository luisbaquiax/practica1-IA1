import { Router } from 'express';
import * as GaController from '../controllers/GaController';

const router = Router();

// POST /api/ga/generar-horario
router.post('/generar-horario', GaController.generarHorarioPersonalizado);

export default router;
