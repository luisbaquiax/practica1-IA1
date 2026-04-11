export interface ConfigGA {
  tamanioPoblacion: number;    // ej: 100
  maxGeneraciones: number;     // ej: 200
  tasaMutacion: number;        // 0.0 – 1.0
  tasaCruce: number;           // 0.0 – 1.0
  elitismo: number;            // numero de individuos élite que pasan directo
  maxCursosPorHorario: number; // límite de cursos a asignar
}