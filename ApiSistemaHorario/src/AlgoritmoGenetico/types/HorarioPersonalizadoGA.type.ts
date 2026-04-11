import { Gen } from "./Individuo.types";

export interface HorarioPersonalizado {
  id?: number;
  carnetEstudiante: number;
  semestre: string;            // ej: "2025-1"
  cursosAsignados: Gen[];
  scoreAptitud: number;
  generadoEn: Date;
  vigenteHasta?: Date;
  fueModificado: boolean;      // alerta de sync con Proyecto 1
}