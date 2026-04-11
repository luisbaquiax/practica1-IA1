import Estudiante from "./Estudiante";
import Carrera from "./Carrera";
import CarreraCursos from "./CarreraCursos";
import ContactoEstudiante from "./ContactoEstudiante";
import Curso from "./Curso";
import Departamento from "./Departamento";
import Historial from "./Historial";
import Horario from "./Horario";
import Pais from "./Pais";
import Prerequisito from "./Prerequisito";
import TipoEstudiante from "./TipoEstudiante";

// Estudiante ↔ Carrera
Estudiante.belongsTo(Carrera, { foreignKey: "carrera_id" });
Carrera.hasMany(Estudiante, { foreignKey: "carrera_id" });

// Carrera ↔ Curso (tabla intermedia carrera_cursos)
Carrera.belongsToMany(Curso, { through: CarreraCursos, foreignKey: "carrera_id", otherKey: "codigo_curso_id" });
Curso.belongsToMany(Carrera, { through: CarreraCursos, foreignKey: "codigo_curso_id", otherKey: "carrera_id" });

// ContactoEstudiante ↔ Estudiante
ContactoEstudiante.belongsTo(Estudiante, { foreignKey: "carnet_estudiante_id" });
Estudiante.hasOne(ContactoEstudiante, { foreignKey: "carnet_estudiante_id" });

// Historial ↔ Estudiante
Historial.belongsTo(Estudiante, { foreignKey: "carnet_estudiante_id" });
Estudiante.hasMany(Historial, { foreignKey: "carnet_estudiante_id" });

// Horario ↔ Curso  /  Horario ↔ Estudiante
Horario.belongsTo(Curso, { foreignKey: "codigo_curso_id" });
Curso.hasMany(Horario, { foreignKey: "codigo_curso_id" });
Horario.belongsTo(Estudiante, { foreignKey: "carnet_estudiante_id" });
Estudiante.hasMany(Horario, { foreignKey: "carnet_estudiante_id" });

// Prerequisito ↔ Curso
Prerequisito.belongsTo(Curso, { foreignKey: "codigo_curso_id" });
Curso.hasMany(Prerequisito, { foreignKey: "codigo_curso_id" });

// Departamento ↔ Pais
Departamento.belongsTo(Pais, { foreignKey: "pais_id" });
Pais.hasMany(Departamento, { foreignKey: "pais_id" });

// Estudiante ↔ TipoEstudiante
Estudiante.belongsTo(TipoEstudiante, { foreignKey: "tipo_estudiante" });
TipoEstudiante.hasMany(Estudiante, { foreignKey: "tipo_estudiante" });

export {
  Estudiante,
  Carrera,
  CarreraCursos,
  ContactoEstudiante,
  Curso,
  Departamento,
  Historial,
  Horario,
  Pais,
  Prerequisito,
  TipoEstudiante
};