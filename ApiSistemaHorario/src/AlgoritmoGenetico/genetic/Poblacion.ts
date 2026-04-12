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
   * Crea un individuo aleatorio seleccionando como máximo `maxCursos` cursos
   * del pool disponible (orden aleatorio para diversidad en la población).
   */
  static seedAleatorio(estudiante: EstudianteGA, maxCursos: number): GenGA[] {
    // Mezcla aleatoria del pool para garantizar diversidad entre individuos
    const pool = [...estudiante.cursosDisponibles];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const seleccionados = pool.slice(0, Math.min(maxCursos, pool.length));

    return seleccionados.map(curso => ({
      codigoCurso: curso.codigo,
      seccionIdx: Math.floor(Math.random() * Math.max(1, curso.secciones.length)),
    }));
  }
}
