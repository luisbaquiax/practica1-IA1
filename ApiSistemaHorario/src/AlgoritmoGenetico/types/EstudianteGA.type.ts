import { CursoDisponible } from "./CursoDisponible";

export interface EstudianteGA {
  carnet: number;
  carreraId: number;
  creditosAcumulados: number;
  cursosAprobados: number[];
  cursosReprobados: number[];
  repitenciasPorCurso: Record<number, number>; // codigo -> numero de intentos
  cursosDisponibles: CursoDisponible[];        // ya validados
}