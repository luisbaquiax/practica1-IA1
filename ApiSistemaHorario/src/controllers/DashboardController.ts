import asyncHandler from 'express-async-handler';
import { BadRequestError } from '../exceptions/ApiExceptions';
import { DashboardService } from '../services/DashboardService';

export const getDashboardByCarnet = asyncHandler(async (req, res) => {
  const carnet = Number(req.query.carnet);
  if (!carnet) throw new BadRequestError('El parámetro carnet es requerido');
  const dashboard = await DashboardService.getDashboardByCarnet(carnet);
  res.json(dashboard);
});
