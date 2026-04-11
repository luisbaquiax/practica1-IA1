import { Request, Response, NextFunction } from 'express';
import { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';
import { NotFoundError, ConflictError, UnauthorizedError, BadRequestError } from '../exceptions/ApiExceptions';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({ error: err.message });
  }
  if (err instanceof BadRequestError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof ConflictError) {
    return res.status(409).json({ error: err.message });
  }
  if (err instanceof ValidationError) {
    const mensajes = err.errors.map(e => e.message);
    return res.status(400).json({ error: 'Datos inválidos', detalles: mensajes });
  }
  if (err instanceof UniqueConstraintError) {
    const campos = err.errors.map(e => e.path).join(', ');
    return res.status(400).json({ error: `Ya existe un registro con el mismo valor en: ${campos}` });
  }
  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({ error: 'El registro referenciado no existe' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
};