import { EstudianteGA } from "../types/EstudianteGA.type";
import { ConfigGA } from "../types/ConfigGA.type";
import { GenGA } from "./FuncionAptitud";
import { FuncionAptitud } from "./FuncionAptitud";

export interface IndividuoInterno {
  genes: GenGA[];
  fitness: number;
}

export class Poblacion {

  /** Genera la población inicial de forma aleatoria */
  static generar(estudiante: EstudianteGA, config: ConfigGA): IndividuoInterno[] {
    const poblacion: IndividuoInterno[] = [];
    for (let i = 0; i < config.tamanioPoblacion; i++) {
      const genes = this.seedAleatorio(estudiante, config.maxCursosPorHorario);
      const fitness = FuncionAptitud.calcular(genes, estudiante);
      poblacion.push({ genes, fitness });
    }
    return poblacion;
  }

  /**
   * Crea un individuo aleatorio seleccionando como máximo `maxCursos` cursos.
   * Los obligatorios siempre van primero para garantizar que estén en el individuo.
   * Los opcionales se mezclan aleatoriamente para diversidad entre individuos.
   */
  static seedAleatorio(estudiante: EstudianteGA, maxCursos: number): GenGA[] {
    const obligatorios = estudiante.cursosDisponibles.filter(c => c.esObligatorio);
    const opcionales = estudiante.cursosDisponibles.filter(c => !c.esObligatorio);

    // Mezcla aleatoria de opcionales para diversidad entre individuos
    for (let i = opcionales.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opcionales[i], opcionales[j]] = [opcionales[j], opcionales[i]];
    }

    // Obligatorios siempre primero; se completa con opcionales hasta el límite
    const seleccionados = [...obligatorios, ...opcionales].slice(0, Math.min(maxCursos, estudiante.cursosDisponibles.length));

    return seleccionados.map(curso => ({
      codigoCurso: curso.codigo,
      seccionIdx: Math.floor(Math.random() * Math.max(1, curso.secciones.length)),
    }));
  }
}
