import { EstudianteGA } from "../types/EstudianteGA.type";
import { ConfigGA } from "../types/ConfigGA.type";
import { GenGA } from "./FuncionAptitud";
import { FuncionAptitud } from "./FuncionAptitud";

export interface IndividuoInterno {
  genes: GenGA[];
  fitness: number;
}

export class Poblacion {

  // Genera la población inicial de forma completamente aleatoria.
  static generar(estudiante: EstudianteGA, config: ConfigGA): IndividuoInterno[] {
    const poblacion: IndividuoInterno[] = [];
    for (let i = 0; i < config.tamanioPoblacion; i++) {
      const genes = this.seedAleatorio(estudiante, config.maxCursosPorHorario);
      const fitness = FuncionAptitud.calcular(genes, estudiante);
      poblacion.push({ genes, fitness });
    }
    return poblacion;
  }

  // Individuo aleatorio puro: sin validación, con posibles duplicados.
  static seedAleatorio(estudiante: EstudianteGA, maxCursos: number): GenGA[] {
    const disponibles = estudiante.cursosDisponibles;
    const n = Math.min(maxCursos, disponibles.length);
    const genes: GenGA[] = [];
    for (let i = 0; i < n; i++) {
      const curso = disponibles[Math.floor(Math.random() * disponibles.length)];
      genes.push({
        codigoCurso: curso.codigo,
        seccionIdx: Math.floor(Math.random() * Math.max(1, curso.secciones.length)),
      });
    }
    return genes;
  }
}
