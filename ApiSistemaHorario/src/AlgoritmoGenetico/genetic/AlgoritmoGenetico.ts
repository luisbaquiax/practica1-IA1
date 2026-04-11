import { ConfigGA } from "../types/ConfigGA.type";
import { EstudianteGA } from "../types/EstudianteGA.type";
import { Individuo } from "../types/Individuo.types";
import { ResultadoGA } from "../types/ResultadoGA.type";
import { ValidadorRestricciones } from "../utils/ValidadorRestricciones";
import { FuncionAptitud } from "./FuncionAptitud";
import { Poblacion } from "./Poblacion";

export class AlgoritmoGenetico {
  private config: ConfigGA;
  private poblacion: Poblacion;
  private validador: ValidadorRestricciones;
  private aptitud: FuncionAptitud;

  constructor(config: ConfigGA) { 
    this.config = config;
    this.validador = new ValidadorRestricciones(config);
    this.aptitud = new FuncionAptitud(config);
    this.poblacion = new Poblacion();
   }

  public ejecutar(estudiante: EstudianteGA): ResultadoGA {
    this.inicializarPoblacion(estudiante);
    for (let g = 0; g < this.config.maxGeneraciones; g++) {
      this.evaluar();
      this.seleccionar();
      this.cruzar();
      this.mutar();
    }
    return this.construirResultado();
  }

  private construirResultado(): ResultadoGA {
    return {} as ResultadoGA;
  }

  private inicializarPoblacion(e: EstudianteGA): void {
    this.poblacion = new Poblacion();

   }
  private evaluar(): void {  }
  private seleccionar(): Individuo[] { 
    return [];
   }
     // torneo o ruleta
  private cruzar(): void { }               // un punto o dos puntos
  private mutar(): void {  }                // swap de sección/horario
}