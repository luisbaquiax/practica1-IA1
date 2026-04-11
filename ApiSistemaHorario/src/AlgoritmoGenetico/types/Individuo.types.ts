export interface Gen {
  codigoCurso: number;
  seccion: string;
  horario: string;   // ej: "L-M-V 07:00-08:00"
  salon: string;
  docente: string;
}

export interface Individuo {
  genes: Gen[]; // Cada gen representa un curso asignado
  fitness: number;
  esValido: boolean;
}