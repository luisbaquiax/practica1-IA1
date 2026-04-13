import { EstudianteGA } from "../types/EstudianteGA.type";
import { IndividuoInterno } from "./Poblacion";
import { FuncionAptitud } from "./FuncionAptitud";
import { GenGA } from "./FuncionAptitud";

/** Rellena hasta `maxCursos` genes con cursos no presentes en el cromosoma. */
function rellenarHastMax(genes: GenGA[], maxCursos: number, estudiante: EstudianteGA): void {
  if (genes.length >= maxCursos) return;
  const codigosActuales = new Set(genes.map(g => g.codigoCurso));
  const disponibles = estudiante.cursosDisponibles.filter(c => !codigosActuales.has(c.codigo));
  for (let i = disponibles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [disponibles[i], disponibles[j]] = [disponibles[j], disponibles[i]];
  }
  let idx = 0;
  while (genes.length < maxCursos && idx < disponibles.length) {
    const nuevo = disponibles[idx++];
    genes.push({
      codigoCurso: nuevo.codigo,
      seccionIdx: Math.floor(Math.random() * Math.max(1, nuevo.secciones.length)),
    });
  }
}

export class Mutacion {

  /**
   * Mutación por intercambio: cambia la sección de un curso aleatorio
   * por otra sección diferente del mismo curso.
   */
  static intercambio(
    individuo: IndividuoInterno,
    estudiante: EstudianteGA,
    tasa: number,
    maxCursos?: number,
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

    if (maxCursos !== undefined) rellenarHastMax(genes, maxCursos, estudiante);
    return { genes, fitness: FuncionAptitud.calcular(genes, estudiante) };
  }

  /**
   * Mutación random resetting: reasigna una sección completamente aleatoria.
   */
  static randomResetting(
    individuo: IndividuoInterno,
    estudiante: EstudianteGA,
    tasa: number,
    maxCursos?: number,
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

    if (maxCursos !== undefined) rellenarHastMax(genes, maxCursos, estudiante);
    return { genes, fitness: FuncionAptitud.calcular(genes, estudiante) };
  }
}
