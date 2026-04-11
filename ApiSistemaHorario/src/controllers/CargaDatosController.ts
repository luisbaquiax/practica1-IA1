import asyncHandler from 'express-async-handler';
import { BadRequestError } from '../exceptions/ApiExceptions';
import { CargaDatosService } from '../services/CargaDatosService';

export const importarPensumPrerequisito = asyncHandler(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const pensumFile      = files?.['pensum']?.[0];
  const prerequisitoFile = files?.['prerequisito']?.[0];

  if (!pensumFile || !prerequisitoFile) {
    throw new BadRequestError('Se requieren dos archivos CSV: "pensum" y "prerequisito"');
  }

  const result = await CargaDatosService.importarPensumPrerequisito(
    pensumFile.buffer.toString('utf-8'),
    prerequisitoFile.buffer.toString('utf-8'),
  );
  res.json(result);
});

export const importarExtras = asyncHandler(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const estudianteFile = files?.['estudiante']?.[0];
  const historialFile  = files?.['historial']?.[0];
  const contactoFile   = files?.['contacto']?.[0];

  if (!estudianteFile || !historialFile || !contactoFile) {
    throw new BadRequestError('Se requieren tres archivos CSV: "estudiante", "historial" y "contacto"');
  }

  const result = await CargaDatosService.importarExtras(
    estudianteFile.buffer.toString('utf-8'),
    historialFile.buffer.toString('utf-8'),
    contactoFile.buffer.toString('utf-8'),
  );
  res.json(result);
});
