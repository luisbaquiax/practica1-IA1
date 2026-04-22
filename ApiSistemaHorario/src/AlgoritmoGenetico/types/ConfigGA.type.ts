export interface ConfigGA {
    tamanioPoblacion: number;      // ej: 100
    maxGeneraciones: number;       // ej: 200
    tasaMutacion: number;          // 0.0 – 1.0
    tasaCruce: number;             // 0.0 – 1.0
    porcentajeSeleccion: number;   // 0.0 – 1.0 · fracción de la población que se selecciona para cruzar
                                   // el resto (1 - porcentajeSeleccion) pasa como élite
    umbralFitness: number;         // detener si el mejor fitness alcanza este valor
    maxCursosPorHorario: number;   // límite de cursos a asignar

    // Métodos elegidos por el usuario
    metodoSeleccion: "torneo" | "ruleta";
    metodoCruce: "un_punto" | "multipunto";
    metodoMutacion: "intercambio" | "random_resetting";
}