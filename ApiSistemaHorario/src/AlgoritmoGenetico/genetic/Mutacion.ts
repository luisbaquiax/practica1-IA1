import { EstudianteGA } from "../types/EstudianteGA.type";
import { IndividuoInterno } from "./Poblacion";
import { FuncionAptitud } from "./FuncionAptitud";

export class Mutacion {

  // Muta 1 gen de 1 hijo elegido al azar (el caller decide si se invoca).
  static mutarPoblacion(
    hijos: IndividuoInterno[],
    estudiante: EstudianteGA,
    metodo: 'intercambio' | 'random_resetting',
  ): void {
    if (hijos.length === 0) return;

    const idx    = Math.floor(Math.random() * hijos.length);
    const ind    = hijos[idx];
    if (ind.genes.length === 0) return;

    const genIdx = Math.floor(Math.random() * ind.genes.length);

    if (metodo === 'random_resetting') {
      Mutacion.randomResettingGen(ind, genIdx, estudiante);
    } else {
      Mutacion.intercambioGen(ind, genIdx, estudiante);
    }

    ind.fitness = FuncionAptitud.calcular(ind.genes, estudiante);
  }

  // Cambia la sección del gen por una diferente del mismo curso (o cambia el curso si solo hay 1 sección).
  private static intercambioGen(
    ind: IndividuoInterno,
    genIdx: number,
    estudiante: EstudianteGA,
  ): void {
    const gen   = ind.genes[genIdx];
    const curso = estudiante.cursosDisponibles.find(c => c.codigo === gen.codigoCurso);

    if (curso && curso.secciones.length > 1) {
      let nueva: number;
      do { nueva = Math.floor(Math.random() * curso.secciones.length); }
      while (nueva === gen.seccionIdx);
      ind.genes[genIdx] = { codigoCurso: gen.codigoCurso, seccionIdx: nueva };
    } else {
      const disponibles = estudiante.cursosDisponibles.filter(c => c.codigo !== gen.codigoCurso);
      if (disponibles.length > 0) {
        const nuevo = disponibles[Math.floor(Math.random() * disponibles.length)];
        ind.genes[genIdx] = {
          codigoCurso: nuevo.codigo,
          seccionIdx:  Math.floor(Math.random() * Math.max(1, nuevo.secciones.length)),
        };
      }
    }
  }

  /**
   * Random resetting: asigna una sección completamente aleatoria al gen.
   */
  private static randomResettingGen(
    ind: IndividuoInterno,
    genIdx: number,
    estudiante: EstudianteGA,
  ): void {
    const gen   = ind.genes[genIdx];
    const curso = estudiante.cursosDisponibles.find(c => c.codigo === gen.codigoCurso);
    ind.genes[genIdx] = {
      codigoCurso: gen.codigoCurso,
      seccionIdx:  Math.floor(Math.random() * Math.max(1, curso?.secciones.length ?? 1)),
    };
  }
}

