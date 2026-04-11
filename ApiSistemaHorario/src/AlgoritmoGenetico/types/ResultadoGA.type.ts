import { Individuo } from "./Individuo.types";

export interface ResultadoGA {
  mejorIndividuo: Individuo;
  generaciones: number;
  evolucionFitness: number[];  // fitness del mejor por generación (para la gráfica)
  tiempoCómputoMs: number;
  conflictos: Conflicto[];
}

export interface Conflicto {
  tipo: 'TRASLAPE' | 'PREREQ' | 'CREDITO' | 'REPITENCIA';
  descripcion: string;
  cursosInvolucrados: number[]; // códigos de cursos relacionados al conflicto
}