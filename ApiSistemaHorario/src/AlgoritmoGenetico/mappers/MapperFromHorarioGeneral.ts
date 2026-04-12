import { Calendario } from "../types/HorarioGeneral.type";
import { CursoDisponible, SeccionDisponible } from "../types/CursoDisponible.type";
import { TipoAsignacion } from "../types/HorarioGeneral.type";

export function mapCalendarioACursos(
  calendario: Calendario[],
  cursosDB: Map<string, { creditos: number; esObligatorio: boolean; prerequisitos: number[]; cursosQueDesbloquea: number[] }>
): CursoDisponible[] {

  // Agrupamos por codigo_curso
  const mapa = new Map<string, CursoDisponible>();

  for (const entrada of calendario) {
    const codigo = entrada.codigo_curso;

    if (!mapa.has(codigo)) {
      const infoDB = cursosDB.get(codigo);
      mapa.set(codigo, {
        codigo,
        nombre:              entrada.curso,
        semestre:            entrada.semestre,
        carrera:             entrada.carrera,
        esObligatorio:       infoDB?.esObligatorio ?? false,
        creditos:            infoDB?.creditos ?? 0,
        secciones:           [],
        prerequisitos:       infoDB?.prerequisitos ?? [],
        cursosQueDesbloquea: infoDB?.cursosQueDesbloquea ?? [],
      });
    }

    const curso = mapa.get(codigo)!;

    // Buscamos si ya existe esa sección para agregar otro bloque de hora
    let seccion = curso.secciones.find(s => s.seccion === entrada.seccion && s.tipo === entrada.tipo_asignacion);

    if (!seccion) {
      seccion = {
        seccion:         entrada.seccion,
        docente:         entrada.docente,
        registroDocente: entrada.registro_docente,
        salon:           entrada.salon,
        tipo:            entrada.tipo_asignacion as TipoAsignacion,
        laboratorio:     entrada.laboratorio,
        diasHora:        [],
      };
      curso.secciones.push(seccion);
    }

    seccion.diasHora.push({
      dia:        entrada.dia,
      horaInicio: entrada.hora_inicio,
      horaFin:    entrada.hora_fin,
    });
  }

  // Solo se ofrecen secciones de tipo CLASE al GA.
  // Las secciones de LABORATORIO (días M, J) no son seleccionables:
  // no se pueden asignar como horario de curso y causarían resultados inválidos.
  // Un curso sin ninguna sección CLASE se descarta del pool disponible.
  const resultado: CursoDisponible[] = [];
  for (const curso of mapa.values()) {
    const seccionesClase = curso.secciones.filter(s => s.tipo === 'CLASE');
    if (seccionesClase.length === 0) continue;
    resultado.push({ ...curso, secciones: seccionesClase });
  }

  return resultado;
}