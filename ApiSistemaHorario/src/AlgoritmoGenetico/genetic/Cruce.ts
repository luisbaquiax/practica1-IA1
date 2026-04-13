import { GenGA } from "./FuncionAptitud";
import { IndividuoInterno } from "./Poblacion";
import { FuncionAptitud } from "./FuncionAptitud";
import { EstudianteGA } from "../types/EstudianteGA.type";

/** Elimina genes con codigoCurso duplicado, conservando la primera aparición. */
function deduplicate(genes: GenGA[]): GenGA[] {
  const vistos = new Set<string>();
  return genes.filter(g => {
    if (vistos.has(g.codigoCurso)) return false;
    vistos.add(g.codigoCurso);
    return true;
  });
}

/**
 * Rellena hasta `target` genes con cursos que no estén ya en el cromosoma,
 * seleccionados aleatoriamente del pool disponible. Evita que el cruce encoja los cromosomas.
 */
function rellenar(genes: GenGA[], target: number, estudiante: EstudianteGA): GenGA[] {
  if (genes.length >= target) return genes;
  const codigosActuales = new Set(genes.map(g => g.codigoCurso));
  const disponibles = estudiante.cursosDisponibles.filter(c => !codigosActuales.has(c.codigo));
  // Mezcla aleatoria para diversidad
  for (let i = disponibles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [disponibles[i], disponibles[j]] = [disponibles[j], disponibles[i]];
  }
  let idx = 0;
  while (genes.length < target && idx < disponibles.length) {
    const nuevo = disponibles[idx++];
    genes.push({
      codigoCurso: nuevo.codigo,
      seccionIdx: Math.floor(Math.random() * Math.max(1, nuevo.secciones.length)),
    });
  }
  return genes;
}

export class Cruce {

  /** Cruce de un punto entre dos padres */
  static unPunto(
    p1: IndividuoInterno,
    p2: IndividuoInterno,
    estudiante: EstudianteGA,
  ): [IndividuoInterno, IndividuoInterno] {
    const len = p1.genes.length;
    const punto = 1 + Math.floor(Math.random() * (len - 1));
    const target = Math.max(p1.genes.length, p2.genes.length);

    const h1genes: GenGA[] = rellenar(deduplicate([
      ...p1.genes.slice(0, punto).map(g => ({ ...g })),
      ...p2.genes.slice(punto).map(g => ({ ...g })),
    ]), target, estudiante);
    const h2genes: GenGA[] = rellenar(deduplicate([
      ...p2.genes.slice(0, punto).map(g => ({ ...g })),
      ...p1.genes.slice(punto).map(g => ({ ...g })),
    ]), target, estudiante);

    return [
      { genes: h1genes, fitness: FuncionAptitud.calcular(h1genes, estudiante) },
      { genes: h2genes, fitness: FuncionAptitud.calcular(h2genes, estudiante) },
    ];
  }

  /** Cruce multipunto (2 puntos) */
  static multipunto(
    p1: IndividuoInterno,
    p2: IndividuoInterno,
    estudiante: EstudianteGA,
  ): [IndividuoInterno, IndividuoInterno] {
    const len = p1.genes.length;
    let pt1 = Math.floor(Math.random() * len);
    let pt2 = Math.floor(Math.random() * len);
    if (pt1 > pt2) [pt1, pt2] = [pt2, pt1];
    const target = Math.max(p1.genes.length, p2.genes.length);

    const h1genes: GenGA[] = rellenar(deduplicate(p1.genes.map((g, i) => (
      (i >= pt1 && i <= pt2 && p2.genes[i]) ? { ...p2.genes[i] } : { ...g }
    ))), target, estudiante);
    const h2genes: GenGA[] = rellenar(deduplicate(p2.genes.map((g, i) => (
      (i >= pt1 && i <= pt2 && p1.genes[i]) ? { ...p1.genes[i] } : { ...g }
    ))), target, estudiante);

    return [
      { genes: h1genes, fitness: FuncionAptitud.calcular(h1genes, estudiante) },
      { genes: h2genes, fitness: FuncionAptitud.calcular(h2genes, estudiante) },
    ];
  }
}
