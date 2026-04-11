import asyncHandler from 'express-async-handler';
import { BadRequestError } from '../exceptions/ApiExceptions';
import { PensumService } from '../services/PensumService';

export const getPensumByCarnet = asyncHandler(async (req, res) => {
  const carnet = Number(req.query.carnet);
  if (!carnet) throw new BadRequestError('El parámetro carnet es requerido');
  const pensum = await PensumService.getPensumByCarnet(carnet);
  res.json(pensum);
});
