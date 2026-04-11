import { Router } from 'express';
import { uploadCSV } from '../middlewares/upload';
import * as CargaDatosController from '../controllers/CargaDatosController';

const router = Router();

// POST /api/carga-datos/pensum-prerequisito
// multipart/form-data: pensum (CSV) + prerequisito (CSV)
router.post(
  '/pensum-prerequisito',
  uploadCSV.fields([
    { name: 'pensum',      maxCount: 1 },
    { name: 'prerequisito', maxCount: 1 },
  ]),
  CargaDatosController.importarPensumPrerequisito,
);

// POST /api/carga-datos/extras
// multipart/form-data: estudiante (CSV) + historial (CSV) + contacto (CSV)
router.post(
  '/extras',
  uploadCSV.fields([
    { name: 'estudiante', maxCount: 1 },
    { name: 'historial',  maxCount: 1 },
    { name: 'contacto',   maxCount: 1 },
  ]),
  CargaDatosController.importarExtras,
);

export default router;
