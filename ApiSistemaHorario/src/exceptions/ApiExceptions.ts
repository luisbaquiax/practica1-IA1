// Se lanza cuando se busca un recurso por id y no existe en la base de datos
export class NotFoundError extends Error {
  constructor(resource: string, id: number | string) {
    super(`${resource} con id ${id} no encontrado`);
    this.name = 'NotFoundError';
  }
}

// Se lanza cuando se intenta crear un recurso que ya existe (tupla duplicada)
export class ConflictError extends Error {
  constructor(resource: string, fields: Record<string, unknown>) {
    const detail = Object.entries(fields)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    super(`${resource} con (${detail}) ya existe`);
    this.name = 'ConflictError';
  }
}

// Se lanza cuando las credenciales son incorrectas
export class UnauthorizedError extends Error {
  constructor(message = 'Credenciales incorrectas') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// Se lanza cuando los datos de entrada son inválidos
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}
