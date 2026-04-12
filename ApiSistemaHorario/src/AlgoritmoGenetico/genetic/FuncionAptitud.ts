import { CursoDisponible } from "../types/CursoDisponible.type";
import { EstudianteGA } from "../types/EstudianteGA.type";
import { ValidadorRestricciones } from "../utils/ValidadorRestricciones";

// Representación interna de un gen usado durante la evolución
export type GenGA = { codigoCurso: string; seccionIdx: number };

const PESO_CUELLO_BOTELLA = 15;
const PESO_OBLIGATORIO    = 20;
const PESO_SEMESTRE_BAJO  = 5;
const PENALIZACION_TRASLAPE = 300;

export class FuncionAptitud {

  static calcular(genes: GenGA[], estudiante: EstudianteGA): number {
    const cursos = estudiante.cursosDisponibles;
    const cursoMap = new Map(cursos.map(c => [c.codigo, c]));
    let score = 0;

    for (const gen of genes) {
      const curso = cursoMap.get(gen.codigoCurso);
      if (!curso) continue;

      const seccion = curso.secciones[gen.seccionIdx];
      if (!seccion) continue;

      // Cursos cuello de botella: desbloquean más cursos futuros
      score += (curso.cursosQueDesbloquea?.length ?? 0) * PESO_CUELLO_BOTELLA;

      // Cursos obligatorios tienen prioridad
      if (curso.esObligatorio) score += PESO_OBLIGATORIO;

      // Priorizar semestres más bajos (avance de carrera)
      score += Math.max(0, 10 - curso.semestre) * PESO_SEMESTRE_BAJO;
    }

    // Penalización fuerte por traslapes
    const traslapes = ValidadorRestricciones.contarTraslapes(genes, cursos);
    score -= traslapes * PENALIZACION_TRASLAPE;

    return score;
  }
}