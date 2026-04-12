import { EstudianteGA } from "../types/EstudianteGA.type";
import { IndividuoInterno } from "./Poblacion";
import { FuncionAptitud } from "./FuncionAptitud";

export class Mutacion {

  /**
   * Mutación por intercambio: cambia la sección de un curso aleatorio
   * por otra sección diferente del mismo curso.
   */
  static intercambio(
    individuo: IndividuoInterno,
    estudiante: EstudianteGA,
    tasa: number,
  ): IndividuoInterno {
    const genes = individuo.genes.map(g => ({ ...g }));
    const cursoMap = new Map(estudiante.cursosDisponibles.map(c => [c.codigo, c]));

    for (let i = 0; i < genes.length; i++) {
      if (Math.random() < tasa) {
        const curso = cursoMap.get(genes[i].codigoCurso);
        if (!curso || curso.secciones.length <= 1) continue;
        // Elige una sección diferente a la actual
        let nuevoIdx: number;
        do {
          nuevoIdx = Math.floor(Math.random() * curso.secciones.length);
        } while (nuevoIdx === genes[i].seccionIdx);
        genes[i].seccionIdx = nuevoIdx;
      }
    }

    return { genes, fitness: FuncionAptitud.calcular(genes, estudiante) };
  }

  /**
   * Mutación random resetting: reasigna una sección completamente aleatoria.
   */
  static randomResetting(
    individuo: IndividuoInterno,
    estudiante: EstudianteGA,
    tasa: number,
  ): IndividuoInterno {
    const genes = individuo.genes.map(g => ({ ...g }));
    const cursoMap = new Map(estudiante.cursosDisponibles.map(c => [c.codigo, c]));

    for (let i = 0; i < genes.length; i++) {
      if (Math.random() < tasa) {
        const curso = cursoMap.get(genes[i].codigoCurso);
        if (!curso) continue;
        genes[i].seccionIdx = Math.floor(Math.random() * Math.max(1, curso.secciones.length));
      }
    }

    return { genes, fitness: FuncionAptitud.calcular(genes, estudiante) };
  }
}
