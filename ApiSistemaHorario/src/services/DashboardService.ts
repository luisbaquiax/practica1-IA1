import { Op } from 'sequelize';
import Estudiante from '../models/Estudiante';
import Carrera from '../models/Carrera';
import CarreraCursos from '../models/CarreraCursos';
import Curso from '../models/Curso';
import Historial from '../models/Historial';
import { NotFoundError } from '../exceptions/ApiExceptions';
import type { DashboardResponse, RegistroHistorial } from '../types';

const getDashboardByCarnet = async (carnet: number): Promise<DashboardResponse> => {
  // 1. Validar estudiante
  const estudiante = await Estudiante.findByPk(carnet);
  if (!estudiante) throw new NotFoundError('Estudiante', carnet);

  // 2. Carrera
  const carrera = await Carrera.findByPk(estudiante.carrera_id);

  // 3. Cursos de la carrera (para créditos y avance)
  const carreraCursos = await CarreraCursos.findAll({
    where: { carrera_id: estudiante.carrera_id },
  });
  const codigosCursos = carreraCursos.map(cc => cc.codigo_curso_id);

  const cursosDeLaCarrera = codigosCursos.length > 0
    ? await Curso.findAll({ where: { codigo: { [Op.in]: codigosCursos } } })
    : [];

  const totalCreditos = cursosDeLaCarrera.reduce((s, c) => s + (c.creditos ?? 0), 0);
  const totalCursos = cursosDeLaCarrera.length;
  const cursoMap = new Map(cursosDeLaCarrera.map(c => [c.codigo, c]));

  // Mapa codigo → semestre de la carrera (viene de CarreraCursos, no de Curso)
  const ccSemestreMap = new Map(carreraCursos.map(cc => [cc.codigo_curso_id, cc.semestre]));

  // 4. Historial completo del estudiante
  const historial = await Historial.findAll({
    where: { carnet_estudiante_id: carnet },
    order: [['fecha_registro', 'ASC']],
  });

  const emptyResponse: DashboardResponse = {
    carrera: carrera?.nombre ?? 'Desconocida',
    ultimoSemestre: null,
    cursosGanadosUltimoSemestre: 0,
    cursosPerdidosUltimoSemestre: 0,
    cursosGanadosTotal: 0,
    cursosPerdidosTotal: 0,
    cursosCursadosTotal: 0,
    porcentajeAprobacion: 0,
    porcentajeAvance: 0,
    creditosAcumulados: 0,
    creditosFaltantes: totalCreditos,
    totalCreditos,
    totalCursos,
    topCursosDificiles: [],
    promedioGeneral: 0,
    promedioLimpio: 0,
    registrosHistorial: [],
  };

  if (historial.length === 0) return emptyResponse;

  // 5. Último semestre basado en el número de semestre del pensum (no en es_semestre)
  // Se obtiene el semestre más alto que tenga al menos un curso en el historial
  const numsSemEnHistorial = [
    ...new Set(
      historial
        .map(h => ccSemestreMap.get(h.codigo_curso_id))
        .filter((s): s is number => s != null && s > 0),
    ),
  ];
  const maxSemestre = numsSemEnHistorial.length > 0 ? Math.max(...numsSemEnHistorial) : null;
  const ultimoSemestre = maxSemestre !== null ? `Semestre ${maxSemestre}` : null;

  // Todos los cursos de la carrera que pertenecen a ese semestre
  const codigosDelMaxSem = new Set(
    [...ccSemestreMap.entries()]
      .filter(([, sem]) => sem === maxSemestre)
      .map(([codigo]) => codigo),
  );

  // Registros del historial del estudiante que corresponden a ese semestre
  const histMaxSem = historial.filter(h => codigosDelMaxSem.has(h.codigo_curso_id));
  const ganadosUltSet = new Set(
    histMaxSem.filter(h => h.aprobado).map(h => h.codigo_curso_id),
  );
  const perdidosUltSet = new Set(
    histMaxSem.filter(h => !h.aprobado).map(h => h.codigo_curso_id),
  );
  // Un curso se cuenta como perdido solo si nunca fue aprobado en el historial de ese semestre
  const cursosGanadosUltimoSemestre = ganadosUltSet.size;
  const cursosPerdidosUltimoSemestre = [...perdidosUltSet].filter(id => !ganadosUltSet.has(id)).length;

  // 6. Agrupar historial por curso (todos los intentos)
  const porCurso = new Map<number, typeof historial>();
  for (const h of historial) {
    if (!porCurso.has(h.codigo_curso_id)) porCurso.set(h.codigo_curso_id, []);
    porCurso.get(h.codigo_curso_id)!.push(h);
  }

  // 7. Métricas históricas
  let cursosGanadosTotal = 0;
  let cursosPerdidosTotal = 0;
  let creditosAcumulados = 0;

  for (const [codigo, registros] of porCurso.entries()) {
    const ganado = registros.some(r => r.aprobado);
    if (ganado) {
      cursosGanadosTotal++;
      const curso = cursoMap.get(codigo);
      if (curso) creditosAcumulados += curso.creditos ?? 0;
    } else {
      cursosPerdidosTotal++;
    }
  }

  const cursosCursadosTotal = porCurso.size;
  const porcentajeAprobacion = cursosCursadosTotal > 0
    ? Math.round((cursosGanadosTotal / cursosCursadosTotal) * 100)
    : 0;

  const creditosFaltantes = Math.max(0, totalCreditos - creditosAcumulados);
  const porcentajeAvance = totalCreditos > 0
    ? Math.round((creditosAcumulados / totalCreditos) * 100)
    : 0;

  // 8. Top cursos difíciles: más intentos primero, luego menor mejor-nota
  const topCursosDificiles = [...porCurso.entries()]
    .map(([codigo, registros]) => ({
      codigo,
      nombre: cursoMap.get(codigo)?.nombre ?? `Cód. ${codigo}`,
      intentos: registros.length,
      ganado: registros.some(r => r.aprobado),
      mejorNota: Math.max(...registros.map(r => r.nota)),
    }))
    .sort((a, b) => b.intentos - a.intentos || a.mejorNota - b.mejorNota)
    .slice(0, 10);

  // 9. Promedios
  const todasNotas = historial.map(h => h.nota);
  const promedioGeneral = todasNotas.length > 0
    ? Math.round((todasNotas.reduce((s, n) => s + n, 0) / todasNotas.length) * 100) / 100
    : 0;

  const notasAprobadas = historial.filter(h => h.aprobado).map(h => h.nota);
  const promedioLimpio = notasAprobadas.length > 0
    ? Math.round((notasAprobadas.reduce((s, n) => s + n, 0) / notasAprobadas.length) * 100) / 100
    : 0;

  // 10. Detalle plano del historial con nombre de curso
  const registrosHistorial: RegistroHistorial[] = historial.map(h => ({
    id: h.id,
    codigo: h.codigo_curso_id,
    nombre: cursoMap.get(h.codigo_curso_id)?.nombre ?? `Cód. ${h.codigo_curso_id}`,
    semestre: h.es_semestre,
    nota: h.nota,
    aprobado: h.aprobado,
  }));

  return {
    carrera: carrera?.nombre ?? 'Desconocida',
    ultimoSemestre,
    cursosGanadosUltimoSemestre,
    cursosPerdidosUltimoSemestre,
    cursosGanadosTotal,
    cursosPerdidosTotal,
    cursosCursadosTotal,
    porcentajeAprobacion,
    porcentajeAvance,
    creditosAcumulados,
    creditosFaltantes,
    totalCreditos,
    totalCursos,
    topCursosDificiles,
    promedioGeneral,
    promedioLimpio,
    registrosHistorial,
  };
};

export const DashboardService = { getDashboardByCarnet };
