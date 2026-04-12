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

export class Cruce {

  /** Cruce de un punto entre dos padres */
  static unPunto(
    p1: IndividuoInterno,
    p2: IndividuoInterno,
    estudiante: EstudianteGA,
  ): [IndividuoInterno, IndividuoInterno] {
    const len = p1.genes.length;
    const punto = 1 + Math.floor(Math.random() * (len - 1));

    const h1genes: GenGA[] = deduplicate([
      ...p1.genes.slice(0, punto).map(g => ({ ...g })),
      ...p2.genes.slice(punto).map(g => ({ ...g })),
    ]);
    const h2genes: GenGA[] = deduplicate([
      ...p2.genes.slice(0, punto).map(g => ({ ...g })),
      ...p1.genes.slice(punto).map(g => ({ ...g })),
    ]);

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

    const h1genes: GenGA[] = deduplicate(p1.genes.map((g, i) => (
      (i >= pt1 && i <= pt2) ? { ...p2.genes[i] } : { ...g }
    )));
    const h2genes: GenGA[] = deduplicate(p2.genes.map((g, i) => (
      (i >= pt1 && i <= pt2) ? { ...p1.genes[i] } : { ...g }
    )));

    return [
      { genes: h1genes, fitness: FuncionAptitud.calcular(h1genes, estudiante) },
      { genes: h2genes, fitness: FuncionAptitud.calcular(h2genes, estudiante) },
    ];
  }
}
