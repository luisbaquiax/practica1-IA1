// Días tal como los manda el Proyecto 1
export type DiaHorario = "LXV" | "LM" | "MJ" | "L" | "M" | "X" | "J" | "V" | "S";

export type TipoAsignacion = "CLASE" | "LABORATORIO";

export interface DiaHora {
  dia: DiaHorario;
  horaInicio: string;    // "07:00"
  horaFin: string;       // "08:00"
}

export interface SeccionDisponible {
  seccion: string;              // Calendario.seccion
  docente: string;              // Calendario.docente
  registroDocente: string;      // Calendario.registro_docente
  salon: string;                // Calendario.salon
  tipo: TipoAsignacion;         // Calendario.tipo_asignacion
  laboratorio: string | null;   // Calendario.laboratorio
  diasHora: DiaHora[];         // puede tener varios bloques
}

export interface CursoDisponible {
  codigo: string;               // Calendario.codigo_curso
  nombre: string;               // Calendario.curso
  semestre: number;             // Calendario.semestre
  carrera: string;              // Calendario.carrera
  esObligatorio: boolean;       // se define según pensum de la BD local
  creditos: number;             // se sca de la tabla Curso en BD local
  secciones: SeccionDisponible[];
  prerequisitos: number[];      // (tabla Prerequisito)
  cursosQueDesbloquea: number[]; // calculado desde BD local
}