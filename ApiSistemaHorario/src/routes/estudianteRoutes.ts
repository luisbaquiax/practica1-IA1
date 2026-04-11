import { Router } from 'express';
import * as EstudianteController from '../controllers/EstudianteController';

const router = Router();

// GET  /api/estudiantes/:carnet
router.get('/:carnet', EstudianteController.getByCarnet);

// PUT  /api/estudiantes/:carnet         → actualizar datos personales
router.put('/:carnet', EstudianteController.updateEstudiante);

// PUT  /api/estudiantes/:carnet/contacto → actualizar información de contacto
router.put('/:carnet/contacto', EstudianteController.updateContacto);

export default router;
