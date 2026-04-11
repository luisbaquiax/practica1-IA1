import { parse } from 'csv-parse/sync';
import Carrera from '../models/Carrera';
import Curso from '../models/Curso';
import CarreraCursos from '../models/CarreraCursos';
import Prerequisito from '../models/Prerequisito';
import Estudiante from '../models/Estudiante';
import Historial from '../models/Historial';
import ContactoEstudiante from '../models/ContactoEstudiante';
import TipoEstudiante from '../models/TipoEstudiante';
import type { ImportPensumResult, ImportExtrasResult } from '../types';

// ===== Mapa de nombre corto (en CSV) → nombre completo de carrera =====
const CARRERA_NOMBRE: Record<string, string> = {
  sistemas:   'Ingeniería en Sistemas',
  civil:      'Ingeniería Civil',
  industrial: 'Ingeniería Industrial',
  mecanica:   'Ingeniería Mecánica',
};

// ===== Convierte DD-MM-YYYY → YYYY-MM-DD si aplica =====
function parseDate(valor: string): string {
  if (/^\d{2}-\d{2}-\d{4}$/.test(valor)) {
    const [d, m, y] = valor.split('-');
    return `${y}-${m}-${d}`;
  }
  return valor;
}

// ===== Importar Pensum + Prerequisito =====
const importarPensumPrerequisito = async (
  pensumContent: string,
  prerequisitoContent: string,
): Promise<ImportPensumResult> => {
  const result: ImportPensumResult = {
    cursosCreados: 0,
    cursosExistentes: 0,
    prerequisitosCreados: 0,
    errores: [],
  };

  // 1. Determinar carrera desde el CSV de prerequisitos
  const prereqRows = parse(prerequisitoContent, { columns: true, skip_empty_lines: true, trim: true }) as any[];

  const carreraKeyRaw: string = prereqRows[0]?.carrera ?? 'sistemas';
  const carreraKey = carreraKeyRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const carreraNombre = CARRERA_NOMBRE[carreraKey] ?? carreraKeyRaw;

  // 2. FindOrCreate la carrera
  const [carrera] = await Carrera.findOrCreate({
    where: { nombre: carreraNombre },
    defaults: { nombre: carreraNombre, pensum: 'default', credito_obligatorios: 0, credito_opcionales: 0 },
  });

  // 3. Procesar cursos del pensum
  // Se leen como arrays para tolerar nombres con comas (ej: "Costos, Presupuestos y Avalúos")
  // Estructura esperada: codigo, ...nombre, creditos, semestre, obligatorio
  const pensumRaw = parse(pensumContent, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as string[][];

  // Saltar la fila de encabezado si la primera celda no es numérica
  const pensumRows = isNaN(Number(pensumRaw[0]?.[0])) ? pensumRaw.slice(1) : pensumRaw;

  for (const cols of pensumRows) {
    try {
      if (cols.length < 5) continue;
      const codigo   = Number(cols[0]);
      // Las últimas 3 columnas son creditos, semestre, obligatorio; el resto del medio es el nombre
      const nombre      = cols.slice(1, cols.length - 3).join(', ');
      const creditos    = Number(cols[cols.length - 3]);
      const semestre    = Number(cols[cols.length - 2]);
      const obligatorio = (cols[cols.length - 1] ?? '').toUpperCase() === 'SI';

      const [, created] = await Curso.findOrCreate({
        where: { codigo },
        defaults: { nombre, creditos },
      });
      created ? result.cursosCreados++ : result.cursosExistentes++;

      await CarreraCursos.findOrCreate({
        where: { carrera_id: carrera.id, codigo_curso_id: codigo },
        defaults: { carrera_id: carrera.id, codigo_curso_id: codigo, semestre, es_obligatorio: obligatorio },
      });
    } catch (e: any) {
      result.errores.push(`Curso ${cols[0]}: ${e.message}`);
    }
  }

  // 4. Procesar prerequisitos
  for (const row of prereqRows) {
    try {
      await Prerequisito.findOrCreate({
        where: {
          codigo_curso_id:  Number(row.curso),
          codigo_curso_prre: Number(row.prerequisito),
        },
        defaults: {
          codigo_curso_id:  Number(row.curso),
          codigo_curso_prre: Number(row.prerequisito),
        },
      });
      result.prerequisitosCreados++;
    } catch (e: any) {
      result.errores.push(`Prerequisito ${row.curso}→${row.prerequisito}: ${e.message}`);
    }
  }

  return result;
};

// ===== Importar Extras (estudiante + historial + contacto) =====
const importarExtras = async (
  estudianteContent: string,
  historialContent: string,
  contactoContent: string,
): Promise<ImportExtrasResult> => {
  const result: ImportExtrasResult = {
    estudiantesCreados: 0,
    estudiantesExistentes: 0,
    historialCreados: 0,
    contactosCreados: 0,
    errores: [],
  };

  const estudianteRows = parse(estudianteContent, { columns: true, skip_empty_lines: true, trim: true }) as any[];
  const historialRows  = parse(historialContent,  { columns: true, skip_empty_lines: true, trim: true }) as any[];
  const contactoRows   = parse(contactoContent,   { columns: true, skip_empty_lines: true, trim: true }) as any[];

  // 1. Seed TipoEstudiante para no romper FK
  const tipoIds = [...new Set(estudianteRows.map(r => Number(r.tipo_estudiante_id)).filter(Boolean))];
  for (const id of tipoIds) {
    await TipoEstudiante.findOrCreate({
      where: { id },
      defaults: { nombre: `Tipo ${id}` },
    });
  }

  // 2. Seed Carrera para no romper FK
  const carreraIds = [...new Set(estudianteRows.map(r => Number(r.carrera_id)).filter(Boolean))];
  for (const id of carreraIds) {
    await Carrera.findOrCreate({
      where: { id },
      defaults: { nombre: `Carrera ${id}`, pensum: 'default', credito_obligatorios: 0, credito_opcionales: 0 },
    });
  }

  // 3. Importar estudiantes
  for (const row of estudianteRows) {
    try {
      const [, created] = await Estudiante.findOrCreate({
        where: { carnet: Number(row.carnet) },
        defaults: {
          carnet:           Number(row.carnet),
          carrera_id:       Number(row.carrera_id),
          tipo_estudiante:  Number(row.tipo_estudiante_id),
          dpi:              String(row.dpi),
          nombres:          row.nombres,
          apellidos:        row.apellidos,
          fecha_nacimiento: parseDate(row.fecha_nacimiento) as unknown as Date,
          contrasenia:      row.contrasenia,
        },
      });
      created ? result.estudiantesCreados++ : result.estudiantesExistentes++;
    } catch (e: any) {
      result.errores.push(`Estudiante ${row.carnet}: ${e.message}`);
    }
  }

  // 4. Importar historial
  for (const row of historialRows) {
    try {
      await Historial.findOrCreate({
        where: {
          carnet_estudiante_id: Number(row.carnet_estudiante_id),
          codigo_curso_id:      Number(row.codigo_curso_id),
          es_semestre:          row.es_semestre,
        },
        defaults: {
          carnet_estudiante_id: Number(row.carnet_estudiante_id),
          codigo_curso_id:      Number(row.codigo_curso_id),
          nota:                 Number(row.nota) || 0,
          aprobado:             ['true', '1', 'TRUE', 'si', 'SI'].includes(String(row.aprobado)),
          es_semestre:          row.es_semestre,
          fecha_registro:       parseDate(row.fecha_registro) as unknown as Date,
        },
      });
      result.historialCreados++;
    } catch (e: any) {
      result.errores.push(`Historial ${row.carnet_estudiante_id}/${row.codigo_curso_id}: ${e.message}`);
    }
  }

  // 5. Importar información de contacto
  for (const row of contactoRows) {
    try {
      await ContactoEstudiante.findOrCreate({
        where: { carnet_estudiante_id: Number(row.carnet_estudiante_id) },
        defaults: {
          carnet_estudiante_id: Number(row.carnet_estudiante_id),
          municipio_vivienda_id: Number(row.municipio_id) || 1,
          direccion:            row.direccion,
          correo_institucional: row.correo_institucional,
          telefono:             String(row.telefono),
        },
      });
      result.contactosCreados++;
    } catch (e: any) {
      result.errores.push(`Contacto ${row.carnet_estudiante_id}: ${e.message}`);
    }
  }

  return result;
};

export const CargaDatosService = { importarPensumPrerequisito, importarExtras };
