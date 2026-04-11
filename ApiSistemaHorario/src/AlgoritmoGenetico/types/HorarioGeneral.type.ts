export interface HorarioGeneral {
    solucion:    Solucion;
    total:       number;
    calendario:  Calendario[];
    estadistica: Estadistica;
    conflictos:  Conflicto[];
}

export interface Calendario {
    id:               number;
    tipo_asignacion:  TipoAsignacion;
    dia:              Dia;
    curso:            string;
    codigo_curso:     string;
    carrera:          Carrera;
    semestre:         number;
    seccion:          Seccion;
    laboratorio:      null;
    docente:          string;
    registro_docente: string;
    salon:            string;
    hora_inicio:      string;
    hora_fin:         string;
}

export enum Carrera {
    AreaComun = "AREA COMUN",
    IngCivil = "ING. CIVIL",
    IngIndustrial = "ING. INDUSTRIAL",
    IngMecanica = "ING. MECANICA",
    IngMecanicaIndustrial = "ING. MECANICA INDUSTRIAL",
    IngSistemas = "ING. SISTEMAS",
}

export enum Dia {
    Lxv = "LXV",
}

export enum Seccion {
    A = "A",
}

export enum TipoAsignacion {
    Clase = "CLASE",
}

export interface Conflicto {
    tipo:        Tipo;
    descripcion: string;
}

export enum Tipo {
    DocenteDoble = "docente_doble",
    DocenteFueraHorario = "docente_fuera_horario",
    SalonDoble = "salon_doble",
}

export interface Estadistica {
    tiempo_ejecucion:            string;
    generaciones_ejecutadas:     number;
    cantidad_conflictos:         number;
    memoria_usada_bytes:         string;
    porcentaje_cursos_continuos: string;
}

export interface Solucion {
    id:             number;
    generacion:     number;
    aptitud:        string;
    fecha_creacion: Date;
}
