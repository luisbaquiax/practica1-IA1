import { ConfigGA } from "../types/ConfigGA.type";
import { EstudianteGA } from "../types/EstudianteGA.type";
import { ResultadoGA } from "../types/ResultadoGA.type";
import { ValidadorRestricciones } from "../utils/ValidadorRestricciones";
import { FuncionAptitud } from "./FuncionAptitud";
import { IndividuoInterno, Poblacion } from "./Poblacion";
import { Seleccion } from "./Seleccion";
import { Cruce } from "./Cruce";
import { Mutacion } from "./Mutacion";

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

    const MAX_CURSOS_RESULTADO = 10;

    // Deduplicar por codigoCurso antes de construir el resultado final
    const genesUnicos = genesFinales.filter(
      (g, idx, arr) => arr.findIndex(x => x.codigoCurso === g.codigoCurso) === idx,
    ).slice(0, MAX_CURSOS_RESULTADO);

    const genesConvertidos = genesUnicos
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

    const conflictos = ValidadorRestricciones.validarGenes(genesFinales, estudiante.cursosDisponibles);

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
    };
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
      return Mutacion.randomResetting(individuo, estudiante, config.tasaMutacion);
    }
    return Mutacion.intercambio(individuo, estudiante, config.tasaMutacion);
  }
}