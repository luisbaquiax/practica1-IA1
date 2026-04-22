import axios from "axios";
import { EstudianteGA } from "../types/EstudianteGA.type";
import { ConfigGA } from "../types/ConfigGA.type";
import { ResultadoGA } from "../types/ResultadoGA.type";
import { HorarioGeneral } from "../types/HorarioGeneral.type";
import { mapCalendarioACursos } from "../mappers/MapperFromHorarioGeneral";
import { AlgoritmoGenetico } from "../genetic/AlgoritmoGenetico";
import Estudiante from "../../models/Estudiante";
import Historial from "../../models/Historial";
import Prerequisito from "../../models/Prerequisito";
import CarreraCursos from "../../models/CarreraCursos";
import { Op } from "sequelize";

const GA_API_URL = process.env.GA_API_URL ?? "http://localhost:3000";

const CONFIG_DEFAULT: ConfigGA = {
  tamanioPoblacion:    60,
  maxGeneraciones:     150,
  tasaMutacion:        0.05,
  tasaCruce:           0.8,
  porcentajeSeleccion: 0.4,   // 40 % selección → 60 % élite
  umbralFitness:       Infinity,
  maxCursosPorHorario: 20,
  metodoSeleccion:     "torneo",
  metodoCruce:         "un_punto",
  metodoMutacion:      "intercambio",
};

export interface SeleccionEstudiante {
  carnet: number;
  obligatorios: { codigo: number; nombre: string; creditos: number }[];
  opcionales:   { codigo: number; nombre: string; creditos: number }[];
}

export class GaService {

  async generarHorarioPersonalizado(
    seleccion: SeleccionEstudiante,
    configOverride?: ConfigGA,
  ): Promise<ResultadoGA> {
    const config: ConfigGA = { ...CONFIG_DEFAULT, ...configOverride };

    const estudiante = await Estudiante.findByPk(seleccion.carnet);
    if (!estudiante) throw new Error(`Estudiante con carnet ${seleccion.carnet} no encontrado`);

    // Repitencias por curso
    const historial = await Historial.findAll({
      where: { carnet_estudiante_id: seleccion.carnet },
    });

    const repitenciasPorCurso: Record<number, number> = {};
    for (const h of historial) {
      const cod = h.codigo_curso_id;
      repitenciasPorCurso[cod] = (repitenciasPorCurso[cod] ?? 0) + 1;
    }

    const cursosAprobados = historial
      .filter(h => h.aprobado === true || (h.aprobado as unknown as string) === 'SI')
      .map(h => h.codigo_curso_id);

    const cursosReprobados = historial
      .filter(h => h.aprobado === false || (h.aprobado as unknown as string) === 'NO')
      .map(h => h.codigo_curso_id);

    // Prerequisitos y cursos que desbloquea cada uno
    const todosLosCodigos = [...seleccion.obligatorios, ...seleccion.opcionales].map(c => c.codigo);
    const prerequisitos = await Prerequisito.findAll({
      where: { codigo_curso_id: { [Op.in]: todosLosCodigos } },
    });

    const desbloquea: Record<number, number[]> = {};
    for (const prq of prerequisitos) {
      if (!desbloquea[prq.codigo_curso_prre]) desbloquea[prq.codigo_curso_prre] = [];
      desbloquea[prq.codigo_curso_prre].push(prq.codigo_curso_id);
    }

    // Obtener el horario general publicado por el GA externo.
    let horarioGeneral: HorarioGeneral;
    try {
      const resp = await axios.get<HorarioGeneral>(`${GA_API_URL}/api/ga/ultima-solucion`);
      horarioGeneral = resp.data;
    } catch {
      throw new Error("No se pudo obtener el horario general del servidor GA. Asegúrate de que esté corriendo en el puerto correcto.");
    }

    if (!horarioGeneral?.calendario?.length) {
      throw new Error("El horario general está vacío. El administrador debe ejecutar el algoritmo primero.");
    }

    // Filtrar el calendario a los cursos seleccionados por el estudiante.
    const codigosSeleccionados = new Set(todosLosCodigos.map(String));
    const obligatoriosCodigos  = new Set(seleccion.obligatorios.map(c => String(c.codigo)));

    const calendarioFiltrado = horarioGeneral.calendario.filter(
      e => codigosSeleccionados.has(String(e.codigo_curso)),
    );

    if (calendarioFiltrado.length === 0) {
      throw new Error("Ninguno de los cursos seleccionados aparece en el horario general vigente.");
    }

    // Mapa de metadata (créditos, prereqs, obligatorio) por código de curso.
    const seleccionMap = new Map(
      [...seleccion.obligatorios, ...seleccion.opcionales].map(c => [
        String(c.codigo),
        {
          creditos:            c.creditos,
          esObligatorio:       obligatoriosCodigos.has(String(c.codigo)),
          prerequisitos:       prerequisitos
            .filter(p => p.codigo_curso_id === c.codigo)
            .map(p => p.codigo_curso_prre),
          cursosQueDesbloquea: desbloquea[c.codigo] ?? [],
        },
      ]),
    );

    const cursosDisponibles = mapCalendarioACursos(calendarioFiltrado, seleccionMap);

    if (cursosDisponibles.length === 0) {
      throw new Error("No se pudieron construir cursos disponibles a partir del horario.");
    }

    const estudianteGA: EstudianteGA = {
      carnet:             seleccion.carnet,
      carreraId:          estudiante.carrera_id,
      creditosAcumulados: 0,
      cursosAprobados,
      cursosReprobados,
      repitenciasPorCurso,
      cursosDisponibles,
    };

    const ag = new AlgoritmoGenetico();
    return ag.ejecutar(estudianteGA, config);
  }
}