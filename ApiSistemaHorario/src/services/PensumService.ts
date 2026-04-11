import { Op } from 'sequelize';
import Estudiante from '../models/Estudiante';
import Carrera from '../models/Carrera';
import CarreraCursos from '../models/CarreraCursos';
import Curso from '../models/Curso';
import Prerequisito from '../models/Prerequisito';
import Historial from '../models/Historial';
import { NotFoundError } from '../exceptions/ApiExceptions';
import type { PensumResponse, CursoConEstado, EstadoCurso } from '../types';

const getPensumByCarnet = async (carnet: number): Promise<PensumResponse> => {
  // 1. Validar que el estudiante existe
  const estudiante = await Estudiante.findByPk(carnet);
  if (!estudiante) throw new NotFoundError('Estudiante', carnet);

  // 2. Obtener la carrera
  const carrera = await Carrera.findByPk(estudiante.carrera_id);

  // 3. Obtener los cursos de la carrera del estudiante
  const carreraCursos = await CarreraCursos.findAll({
    where: { carrera_id: estudiante.carrera_id },
  });
  const codigosCursos = carreraCursos.map(cc => cc.codigo_curso_id);

  // Mapa codigo → semestre y obligatorio propios de esta carrera
  const ccMap = new Map(carreraCursos.map(cc => [cc.codigo_curso_id, cc]));

  if (codigosCursos.length === 0) {
    return { carrera: carrera?.nombre ?? 'Desconocida', cursos: [] };
  }

  // 4. Obtener detalles de los cursos y ordenar por semestre de la carrera
  const cursos = await Curso.findAll({
    where: { codigo: { [Op.in]: codigosCursos } },
  });
  cursos.sort((a, b) => {
    const sa = ccMap.get(a.codigo)?.semestre ?? 0;
    const sb = ccMap.get(b.codigo)?.semestre ?? 0;
    return sa - sb || a.nombre.localeCompare(b.nombre);
  });

  // 5. Obtener prerequisitos de esos cursos (solo los que pertenecen a la misma carrera)
  const prerequisitos = await Prerequisito.findAll({
    where: {
      codigo_curso_id:   { [Op.in]: codigosCursos },
      codigo_curso_prre: { [Op.in]: codigosCursos },
    },
  });

  // 6. Obtener historial aprobado del estudiante
  const historial = await Historial.findAll({
    where: { carnet_estudiante_id: carnet, aprobado: true },
  });
  const aprobados = new Set(historial.map(h => h.codigo_curso_id));

  // 7. Construir mapa de prerequisitos: codigo_curso → [codigos de prereqs]
  const prereqMap = new Map<number, number[]>();
  for (const p of prerequisitos) {
    if (!prereqMap.has(p.codigo_curso_id)) prereqMap.set(p.codigo_curso_id, []);
    prereqMap.get(p.codigo_curso_id)!.push(p.codigo_curso_prre);
  }

  // 8. Determinar estado de cada curso
  const cursosConEstado: CursoConEstado[] = cursos.map(c => {
    const prereqs = prereqMap.get(c.codigo) ?? [];
    let estado: EstadoCurso;

    const prereqsCompletos = prereqs.every(p => aprobados.has(p));

    if (aprobados.has(c.codigo)) {
      // Si el estudiante ya aprobó el curso → siempre GANADO
      estado = 'GANADO';
    } else if (prereqsCompletos) {
      // No lo ha aprobado aún pero todos los prerrequisitos están cumplidos
      estado = 'DISPONIBLE';
    } else {
      estado = 'BLOQUEADO';
    }

    return {
      codigo: c.codigo,
      nombre: c.nombre,
      creditos: c.creditos ?? 0,
      semestre: ccMap.get(c.codigo)?.semestre ?? 0,
      obligatorio: ccMap.get(c.codigo)?.es_obligatorio ?? false,
      estado,
      prerequisitos: prereqs,
    };
  });

  return {
    carrera: carrera?.nombre ?? 'Desconocida',
    cursos: cursosConEstado,
  };
};

export const PensumService = { getPensumByCarnet };
