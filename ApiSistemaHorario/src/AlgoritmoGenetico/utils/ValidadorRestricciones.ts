import { DiaHora, DiaHorario, SeccionDisponible } from "../types/CursoDisponible.type";
import { GenGA } from "../genetic/FuncionAptitud";
import { CursoDisponible } from "../types/CursoDisponible.type";

// Expande un código de día a sus días individuales
const DIAS_EXPANDIDOS: Record<DiaHorario, string[]> = {
  LXV: ["L", "X", "V"],
  LM:  ["L", "M"],
  MJ:  ["M", "J"],
  L:   ["L"],
  M:   ["M"],
  X:   ["X"],
  J:   ["J"],
  V:   ["V"],
  S:   ["S"],
};

// Solo se verifican conflictos en días de curso (L, X, V).
// Los laboratorios (M, J) no participan en la detección de traslapes.
const DIAS_CURSO = new Set(["L", "X", "V"]);

export class ValidadorRestricciones {

  /** Convierte "HH:MM" a minutos desde medianoche para comparación */
  static horaAMinutos(hora: string): number {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
  }

  /** Devuelve true si dos bloques DiaHora se superponen en días de curso (L, X, V).
   *  Bloques de laboratorio (M, J) no generan conflicto. */
  static hayTraslapeBloque(a: DiaHora, b: DiaHora): boolean {
    const diasA = (DIAS_EXPANDIDOS[a.dia] ?? [a.dia]).filter(d => DIAS_CURSO.has(d));
    const diasB = (DIAS_EXPANDIDOS[b.dia] ?? [b.dia]).filter(d => DIAS_CURSO.has(d));

    // Si alguno de los bloques no tiene días de curso, no hay conflicto
    if (diasA.length === 0 || diasB.length === 0) return false;

    const compartenDia = diasA.some(d => diasB.includes(d));
    if (!compartenDia) return false;

    const inicioA = this.horaAMinutos(a.horaInicio);
    const finA    = this.horaAMinutos(a.horaFin);
    const inicioB = this.horaAMinutos(b.horaInicio);
    const finB    = this.horaAMinutos(b.horaFin);

    return Math.max(inicioA, inicioB) < Math.min(finA, finB);
  }

  /** Devuelve true si dos SeccionDisponible tienen al menos un bloque que se traslapa */
  static hayTraslape(s1: SeccionDisponible, s2: SeccionDisponible): boolean {
    for (const dh1 of s1.diasHora) {
      for (const dh2 of s2.diasHora) {
        if (this.hayTraslapeBloque(dh1, dh2)) return true;
      }
    }
    return false;
  }

  /**
   * Valida un conjunto de genes (representación interna del GA).
   * Devuelve la lista de conflictos de traslape encontrados.
   */
  static validarGenes(
    genes: GenGA[],
    cursos: CursoDisponible[],
  ): string[] {
    const conflictos: string[] = [];
    const cursoMap = new Map(cursos.map(c => [c.codigo, c]));

    const seccionesElegidas: Array<{ nombre: string; seccion: SeccionDisponible }> = [];

    for (const gen of genes) {
      const curso = cursoMap.get(gen.codigoCurso);
      if (!curso) continue;
      const seccion = curso.secciones[gen.seccionIdx];
      if (!seccion) continue;
      seccionesElegidas.push({ nombre: curso.nombre, seccion });
    }

    for (let i = 0; i < seccionesElegidas.length; i++) {
      for (let j = i + 1; j < seccionesElegidas.length; j++) {
        const a = seccionesElegidas[i];
        const b = seccionesElegidas[j];
        if (this.hayTraslape(a.seccion, b.seccion)) {
          conflictos.push(`Traslape entre "${a.nombre}" (${a.seccion.seccion}) y "${b.nombre}" (${b.seccion.seccion})`);
        }
      }
    }

    return conflictos;
  }

  /** Cuenta traslapes numérico para la función de aptitud */
  static contarTraslapes(genes: GenGA[], cursos: CursoDisponible[]): number {
    return this.validarGenes(genes, cursos).length;
  }
}
