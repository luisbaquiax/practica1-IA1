import asyncHandler from 'express-async-handler';
import { EstudianteService } from '../services/EstudianteService';

export const getByCarnet = asyncHandler(async (req, res) => {
  const estudiante = await EstudianteService.getByCarnet(Number(req.params.carnet));
  res.json(estudiante);
});

export const updateEstudiante = asyncHandler(async (req, res) => {
  const { dpi, nombres, apellidos, fecha_nacimiento } = req.body;
  const estudiante = await EstudianteService.updateEstudiante(
    Number(req.params.carnet),
    { dpi, nombres, apellidos, fecha_nacimiento },
  );
  res.json(estudiante);
});

export const updateContacto = asyncHandler(async (req, res) => {
  const { municipio_vivienda_id, direccion, correo_institucional, telefono } = req.body;
  const contacto = await EstudianteService.updateContacto(
    Number(req.params.carnet),
    { municipio_vivienda_id, direccion, correo_institucional, telefono },
  );
  res.json(contacto);
});
