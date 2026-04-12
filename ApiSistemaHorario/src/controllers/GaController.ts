import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { GaService, SeleccionEstudiante } from '../AlgoritmoGenetico/services/GaService';

const gaService = new GaService();

/**
 * POST /api/ga/generar-horario
 * Body: { carnet, obligatorios: [{codigo, nombre, creditos}], opcionales: [{codigo, nombre, creditos}] }
 */
export const generarHorarioPersonalizado = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { carnet, obligatorios, opcionales } = req.body as SeleccionEstudiante;

  if (!carnet || !Array.isArray(obligatorios) || !Array.isArray(opcionales)) {
    res.status(400).json({ error: 'Cuerpo inválido. Se requiere carnet, obligatorios[] y opcionales[].' });
    return;
  }

  if (obligatorios.length === 0 && opcionales.length === 0) {
    res.status(400).json({ error: 'Debes enviar al menos un curso (obligatorio u opcional).' });
    return;
  }

  const resultado = await gaService.generarHorarioPersonalizado({ carnet, obligatorios, opcionales });
  res.json(resultado);
});
