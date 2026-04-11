import { ConfigGA } from "../types/ConfigGA.type";
import { CursoDisponible, SeccionDisponible } from "../types/CursoDisponible.type";
import { EstudianteGA } from "../types/EstudianteGA.type";
import { ValidadorRestricciones } from "../utils/ValidadorRestricciones";

// El individuo en genetic-js es simplemente el array de genes
// cada gen = { codigoCurso, seccionIdx }
export type GenGA = { codigoCurso: string; seccionIdx: number };

export class FuncionAptitud {
  private validador: ValidadorRestricciones;

  constructor(private config: ConfigGA) {
    this.validador = new ValidadorRestricciones(config);
  }

  calcular(individuo: GenGA[], estudiante: EstudianteGA): number {
    let score = 0;

    const seccionesElegidas: SeccionDisponible[] = [];

    for (const gen of individuo) {
      const curso = estudiante.cursosDisponibles.find(c => c.codigo === gen.codigoCurso);
      if (!curso) continue;

      const seccion = curso.secciones[gen.seccionIdx];
      if (!seccion) continue;

      /*
      // Penalización fuerte si el curso no cumple restricciones básicas
      if (!this.validador.esCursoValido(curso, seccion.seccion, estudiante)) {
        score -= 500;
        continue;
      }
        */

      // Premio 1: cursos cuello de botella (más cursos desbloquea = más valioso)
      score += curso.cursosQueDesbloquea.length * 15;

      // Premio 2: cursos obligatorios tienen prioridad
      if (curso.esObligatorio) score += 20;

      // Premio 3: cursos de semestres más bajos primero
      score += (10 - curso.semestre) * 5;

      seccionesElegidas.push(seccion);
    }

    // Penalización por cada par de secciones que se traslapen
    score -= this.contarTraslapes(seccionesElegidas) * 200;

    return score;
  }

  private contarTraslapes(secciones: SeccionDisponible[]): number {
    let traslapes = 0;
    for (let i = 0; i < secciones.length; i++) {
      for (let j = i + 1; j < secciones.length; j++) {
        /*
        if (this.validador.hayTraslape(secciones[i], secciones[j])) {
          traslapes++;
        }
          */
      }
    }
    return traslapes;
  }
}