import asyncHandler from 'express-async-handler';
import { EstudianteService } from '../services/EstudianteService';

export const login = asyncHandler(async (req, res) => {
  const { carnet, contrasenia } = req.body;
  const estudiante = await EstudianteService.login({ carnet: Number(carnet), contrasenia });
  res.json(estudiante);
});
