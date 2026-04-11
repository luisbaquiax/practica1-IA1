import Genetic from "genetic-js";
import { EstudianteGA } from "../types/EstudianteGA.type";
import { ConfigGA } from "../types/ConfigGA.type";
import { FuncionAptitud, GenGA } from "../genetic/FuncionAptitud";
import { ResultadoGA } from "../types/ResultadoGA.type";

export class GAService {
  async generarHorario(estudiante: EstudianteGA, config: ConfigGA): Promise<ResultadoGA> {
    const aptitud = new FuncionAptitud(config);
    const evolucionFitness: number[] = [];
    const cursos = estudiante.cursosDisponibles;

    return new Promise((resolve) => {
      const genetic = Genetic.create();

      // Cada individuo = array de genes, uno por curso disponible
      genetic.seed = function(): GenGA[] {
        return cursos.map(curso => ({
          codigoCurso: curso.codigo,
          seccionIdx: Math.floor(Math.random() * curso.secciones.length)
        }));
      };

      genetic.fitness = function(individuo: GenGA[]): number {
        return aptitud.calcular(individuo, estudiante);
      };

      // Mutación: cambia la sección de un curso aleatorio
      genetic.mutate = function(individuo: GenGA[]): GenGA[] {
        const copia = individuo.map(g => ({ ...g }));
        const idx = Math.floor(Math.random() * copia.length);
        const curso = cursos.find(c => c.codigo === copia[idx].codigoCurso)!;
        copia[idx].seccionIdx = Math.floor(Math.random() * curso.secciones.length);
        return copia;
      };

      // Cruce de un punto
      genetic.crossover = function(madre: GenGA[], padre: GenGA[]): [GenGA[], GenGA[]] {
        const punto = Math.floor(Math.random() * madre.length);
        const hijo1 = [...madre.slice(0, punto), ...padre.slice(punto)];
        const hijo2 = [...padre.slice(0, punto), ...madre.slice(punto)];
        return [hijo1, hijo2];
      };

      genetic.optimize = Genetic.Optimize.Maximize;
      genetic.select1 = Genetic.Select1.Tournament3;
      genetic.select2 = Genetic.Select2.Tournament3;

      // Registrar evolución del fitness por generación (para la gráfica)
      genetic.generation = function(_pop: any, _gen: number, stats: any): boolean {
        evolucionFitness.push(stats.maximum);
        return true;
      };

      genetic.notification = function(pop: any, _gen: number, _stats: any, isFinished: boolean) {
        if (isFinished) {
          const mejorGenes: GenGA[] = pop[0].entity;
          resolve({
            mejorIndividuo: {
              genes: mejorGenes.map(g => {
                const curso = cursos.find(c => c.codigo === g.codigoCurso)!;
                const seccion = curso.secciones[g.seccionIdx];
                return {
                  codigoCurso: Number(g.codigoCurso),
                  seccion: seccion.seccion,
                  horario: seccion.diasHora.map(d => `${d.dia} ${d.horaInicio}-${d.horaFin}`).join(", "),
                  salon: seccion.salon,
                  docente: seccion.docente,
                };
              }),
              fitness: pop[0].fitness,
              esValido: pop[0].fitness > 0,
            },
            generaciones: evolucionFitness.length,
            evolucionFitness,
            tiempoCómputoMs: 0,
            conflictos: [],
          });
        }
      };

      genetic.configuration = {
        size: config.tamanioPoblacion,
        crossover: config.tasaCruce,
        mutation: config.tasaMutacion,
        iterations: config.maxGeneraciones,
        fittestAlwaysSurvives: true,
        maxResults: 1,
        webWorkers: false,
      };

      genetic.evolve();
    });
  }
}