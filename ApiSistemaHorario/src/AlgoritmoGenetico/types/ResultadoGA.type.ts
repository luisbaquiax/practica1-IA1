import { Individuo } from "./Individuo.types";
import { Gen } from "./Individuo.types";

export interface ResultadoGA {
  mejorIndividuo: Individuo;
  generaciones: number;
  evolucionFitness: number[];  // fitness del mejor por generación (para la gráfica)
  tiempoCómputoMs: number;
  conflictos: Conflicto[];
  /** Variantes libres de conflictos para que el estudiante elija.
   *  Solo aparecen cuando `mejorIndividuo.esValido === false`. */
  alternativas: Alternativa[];
}

export interface Conflicto {
  tipo: 'TRASLAPE' | 'PREREQ' | 'CREDITO' | 'REPITENCIA';
  descripcion: string;
  cursosInvolucrados: number[]; // códigos de cursos relacionados al conflicto
}

export interface Alternativa {
  /** Etiqueta descriptiva, p.ej. "Sin Cálculo 1 (3002)" */
  etiqueta: string;
  genes: Gen[];
}