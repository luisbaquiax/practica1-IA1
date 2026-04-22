import { ConfigGA } from "../types/ConfigGA.type";
import { EstudianteGA } from "../types/EstudianteGA.type";
import { Alternativa, ResultadoGA } from "../types/ResultadoGA.type";
import { ValidadorRestricciones } from "../utils/ValidadorRestricciones";
import { FuncionAptitud, GenGA } from "./FuncionAptitud";
import { IndividuoInterno, Poblacion } from "./Poblacion";
import { Seleccion } from "./Seleccion";
import { Cruce } from "./Cruce";
import { Mutacion } from "./Mutacion";
import { CursoDisponible } from "../types/CursoDisponible.type";

export class AlgoritmoGenetico {

  ejecutar(estudiante: EstudianteGA, config: ConfigGA): ResultadoGA {
    const inicio = Date.now();
    const evolucionFitness: number[] = [];

    // Fase 1: población inicial completamente aleatoria, sin validación.
    let poblacion = Poblacion.generar(estudiante, config);
    this.ordenar(poblacion);

    let mejorGlobal = { ...poblacion[0], genes: poblacion[0].genes.map(g => ({ ...g })) };

    const N = config.tamanioPoblacion;

    for (let gen = 0; gen < config.maxGeneraciones; gen++) {

      // Fase 2: élite — los (100% - %selección) mejores pasan directo.
      let nSeleccionados = Math.floor(config.porcentajeSeleccion * N);
      if (nSeleccionados % 2 !== 0) nSeleccionados--; // mantener par; el descartado suma a élite

      const nElite = N - nSeleccionados;

      const elite: IndividuoInterno[] = poblacion
        .slice(0, nElite)
        .map(ind => ({ ...ind, genes: ind.genes.map(g => ({ ...g })) }));

      // Fase 3: selección — torneo o ruleta sobre la población completa.
      const seleccionados = Seleccion.seleccionarN(poblacion, nSeleccionados, config.metodoSeleccion);

      // Fase 4: cruce — mezcla aleatoria y cada pareja genera 2 hijos.
      for (let i = seleccionados.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [seleccionados[i], seleccionados[j]] = [seleccionados[j], seleccionados[i]];
      }

      const hijos: IndividuoInterno[] = [];
      for (let i = 0; i < seleccionados.length; i += 2) {
        const [h1, h2] = this.cruzar(seleccionados[i], seleccionados[i + 1], estudiante, config);
        hijos.push(h1, h2);
      }

      // Fase 5: mutación — un random decide si muta; si sí, 1 gen de 1 hijo cambia.
      if (Math.random() < config.tasaMutacion) {
        Mutacion.mutarPoblacion(hijos, estudiante, config.metodoMutacion);
      }

      // Nueva generación = élite + hijos.
      poblacion = [...elite, ...hijos];
      this.ordenar(poblacion);

      const mejorGen = poblacion[0];
      evolucionFitness.push(mejorGen.fitness);

      if (mejorGen.fitness > mejorGlobal.fitness) {
        mejorGlobal = { ...mejorGen, genes: mejorGen.genes.map(g => ({ ...g })) };
      }

      // Fase 6: parada por generaciones (for) o por umbral de fitness.
      if (mejorGlobal.fitness >= config.umbralFitness) break;
    }

    const cursoMap = new Map(estudiante.cursosDisponibles.map(c => [c.codigo, c]));
    const genesFinales = mejorGlobal.genes;

    const MAX_CURSOS_RESULTADO = config.maxCursosPorHorario;

    const genesUnicos = genesFinales.filter(
      (g, idx, arr) => arr.findIndex(x => x.codigoCurso === g.codigoCurso) === idx,
    ).slice(0, MAX_CURSOS_RESULTADO);

    const convertirGenes = (genes: GenGA[]) =>
      genes
        .map(gen => {
          const curso = cursoMap.get(gen.codigoCurso);
          if (!curso) return null;
          const seccion = curso.secciones[gen.seccionIdx];
          if (!seccion) return null;
          return {
            codigoCurso: Number(gen.codigoCurso),
            seccion: seccion.seccion,
            horario: seccion.diasHora.map(d => `${d.dia} ${d.horaInicio}-${d.horaFin}`).join(", "),
            salon: seccion.salon,
            docente: seccion.docente,
          };
        })
        .filter((g): g is NonNullable<typeof g> => g !== null);

    const genesConvertidos = convertirGenes(genesUnicos);

    const conflictos = ValidadorRestricciones.validarGenes(genesFinales, estudiante.cursosDisponibles);

    // Generar alternativas sin conflictos cuando el mejor resultado tiene traslapes
    const alternativas: Alternativa[] = [];
    if (conflictos.length > 0) {
      const generadas = this.generarAlternativas(genesUnicos, cursoMap, convertirGenes);
      alternativas.push(...generadas);
    }

    return {
      mejorIndividuo: {
        genes: genesConvertidos,
        fitness: mejorGlobal.fitness,
        esValido: conflictos.length === 0,
      },
      generaciones: evolucionFitness.length,
      evolucionFitness,
      tiempoCómputoMs: Date.now() - inicio,
      conflictos: conflictos.map(d => ({ tipo: 'TRASLAPE', descripcion: d, cursosInvolucrados: [] })),
      alternativas,
    };
  }

  /**
   * Genera variantes libres de conflictos resolviendo TODOS los pares simultáneamente.
   *
   * Para N pares conflictivos genera combinaciones (2^N en el peor caso, limitado a N≤8).
   * En cada combinación, por cada par elige desechar el curso i o el j.
   * Si la combinación queda libre de traslapes, se incluye como alternativa.
   */
  private generarAlternativas(
    genes: GenGA[],
    cursoMap: Map<string, CursoDisponible>,
    convertirGenes: (genes: GenGA[]) => Array<{ codigoCurso: number; seccion: string; horario: string; salon: string; docente: string }>,
  ): Alternativa[] {
    // Detectar todos los pares conflictivos
    const pares: [number, number][] = [];
    for (let i = 0; i < genes.length; i++) {
      for (let j = i + 1; j < genes.length; j++) {
        const cursoI = cursoMap.get(genes[i].codigoCurso);
        const cursoJ = cursoMap.get(genes[j].codigoCurso);
        if (!cursoI || !cursoJ) continue;
        const secI = cursoI.secciones[genes[i].seccionIdx];
        const secJ = cursoJ.secciones[genes[j].seccionIdx];
        if (!secI || !secJ) continue;
        if (ValidadorRestricciones.hayTraslape(secI, secJ)) {
          pares.push([i, j]);
        }
      }
    }

    if (pares.length === 0) return [];
    // Evitar explosión combinatoria para casos extremos
    if (pares.length > 20) return [];

    /**
     * Generación recursiva de conjuntos de exclusión.
     * Por cada par pendiente elige excluir el índice i o el j.
     * Si el par ya está resuelto (alguno de los dos ya está excluido), avanza.
     */
    const combinar = (parIdx: number, excluidos: Set<number>): Set<number>[] => {
      if (parIdx >= pares.length) return [new Set(excluidos)];
      const [pi, pj] = pares[parIdx];
      if (excluidos.has(pi) || excluidos.has(pj)) {
        // Par ya resuelto por una elección anterior
        return combinar(parIdx + 1, excluidos);
      }
      const resultados: Set<number>[] = [];
      // Opción A: excluir pi
      const excA = new Set(excluidos); excA.add(pi);
      resultados.push(...combinar(parIdx + 1, excA));
      // Opción B: excluir pj
      const excB = new Set(excluidos); excB.add(pj);
      resultados.push(...combinar(parIdx + 1, excB));
      return resultados;
    };

    const combinaciones = combinar(0, new Set<number>());

    // Deduplicar por clave y generar alternativas válidas
    const vistas = new Set<string>();
    const resultado: Alternativa[] = [];

    for (const excluidos of combinaciones) {
      const clave = [...excluidos].sort((a, b) => a - b).join(',');
      if (vistas.has(clave)) continue;
      vistas.add(clave);

      const genesAlt = genes.filter((_, idx) => !excluidos.has(idx));

      // Verificar que la alternativa realmente no tiene traslapes
      if (ValidadorRestricciones.contarTraslapes(genesAlt, [...cursoMap.values()]) !== 0) continue;

      const nombresEliminados = [...excluidos]
        .sort((a, b) => a - b)
        .map(idx => {
          const c = cursoMap.get(genes[idx].codigoCurso);
          return c ? `"${c.nombre}"` : `(${genes[idx].codigoCurso})`;
        });

      resultado.push({
        etiqueta: `Sin ${nombresEliminados.join(' y ')}`,
        genes: convertirGenes(genesAlt) as Alternativa['genes'],
      });
    }

    // Ordenar por más cursos conservados (mejor alternativa primero) y limitar a 6
    resultado.sort((a, b) => b.genes.length - a.genes.length);
    return resultado.slice(0, 6);
  }

  private ordenar(poblacion: IndividuoInterno[]): void {
    poblacion.sort((a, b) => b.fitness - a.fitness);
  }

  private cruzar(
    p1: IndividuoInterno,
    p2: IndividuoInterno,
    estudiante: EstudianteGA,
    config: ConfigGA,
  ): [IndividuoInterno, IndividuoInterno] {
    if (config.metodoCruce === 'multipunto') {
      return Cruce.multipunto(p1, p2, estudiante);
    }
    return Cruce.unPunto(p1, p2, estudiante);
  }
}