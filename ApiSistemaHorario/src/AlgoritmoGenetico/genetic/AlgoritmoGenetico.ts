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

const GENERACIONES_SIN_MEJORA_MAX = 30; // criterio de convergencia

export class AlgoritmoGenetico {

  ejecutar(estudiante: EstudianteGA, config: ConfigGA): ResultadoGA {
    const inicio = Date.now();
    const evolucionFitness: number[] = [];

    // 1. Población inicial
    let poblacion = Poblacion.generar(estudiante, config);
    this.ordenar(poblacion);

    let mejorGlobal = poblacion[0];
    let sinMejora = 0;

    for (let gen = 0; gen < config.maxGeneraciones; gen++) {
      const nuevaPoblacion: IndividuoInterno[] = [];

      // Elitismo: los N mejores pasan directamente
      for (let e = 0; e < config.elitismo && e < poblacion.length; e++) {
        nuevaPoblacion.push({ ...poblacion[e], genes: poblacion[e].genes.map(g => ({ ...g })) });
      }

      // Llenamos el resto de la población
      while (nuevaPoblacion.length < config.tamanioPoblacion) {
        const padre1 = this.seleccionar(poblacion, config);
        const padre2 = this.seleccionar(poblacion, config);

        let hijos: [IndividuoInterno, IndividuoInterno];

        if (Math.random() < config.tasaCruce) {
          hijos = this.cruzar(padre1, padre2, estudiante, config);
        } else {
          hijos = [
            { ...padre1, genes: padre1.genes.map(g => ({ ...g })) },
            { ...padre2, genes: padre2.genes.map(g => ({ ...g })) },
          ];
        }

        for (const hijo of hijos) {
          const mutado = this.mutar(hijo, estudiante, config);
          nuevaPoblacion.push(mutado);
          if (nuevaPoblacion.length >= config.tamanioPoblacion) break;
        }
      }

      poblacion = nuevaPoblacion;
      this.ordenar(poblacion);

      const mejorGen = poblacion[0];
      evolucionFitness.push(mejorGen.fitness);

      // Actualizar mejor global y revisar convergencia
      if (mejorGen.fitness > mejorGlobal.fitness) {
        mejorGlobal = { ...mejorGen, genes: mejorGen.genes.map(g => ({ ...g })) };
        sinMejora = 0;
      } else {
        sinMejora++;
        if (sinMejora >= GENERACIONES_SIN_MEJORA_MAX) break;
      }
    }

    // Construir resultado
    const cursoMap = new Map(estudiante.cursosDisponibles.map(c => [c.codigo, c]));
    const genesFinales = mejorGlobal.genes;

    const MAX_CURSOS_RESULTADO = 9;

    // Deduplicar por codigoCurso antes de construir el resultado final
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
    if (pares.length > 8) return [];

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

    return resultado;
  }

  private ordenar(poblacion: IndividuoInterno[]): void {
    poblacion.sort((a, b) => b.fitness - a.fitness);
  }

  private seleccionar(poblacion: IndividuoInterno[], config: ConfigGA): IndividuoInterno {
    return config.metodoSeleccion === 'ruleta'
      ? Seleccion.ruleta(poblacion)
      : Seleccion.torneo(poblacion);
  }

  private cruzar(
    p1: IndividuoInterno,
    p2: IndividuoInterno,
    estudiante: EstudianteGA,
    config: ConfigGA,
  ): [IndividuoInterno, IndividuoInterno] {
    if (config.metodoCruce === 'multipunto' || config.metodoCruce === 'mascara_aleatoria') {
      return Cruce.multipunto(p1, p2, estudiante);
    }
    return Cruce.unPunto(p1, p2, estudiante);
  }

  private mutar(
    individuo: IndividuoInterno,
    estudiante: EstudianteGA,
    config: ConfigGA,
  ): IndividuoInterno {
    if (config.metodoMutacion === 'random_resetting') {
      return Mutacion.randomResetting(individuo, estudiante, config.tasaMutacion, config.maxCursosPorHorario);
    }
    return Mutacion.intercambio(individuo, estudiante, config.tasaMutacion, config.maxCursosPorHorario);
  }
}