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

Estudiante.belongsTo(Carrera, { foreignKey: "carreraId" });
Carrera.hasMany(Estudiante, { foreignKey: "carreraId" });

Carrera.belongsToMany(Curso, { through: CarreraCursos, foreignKey: "carreraId" });
Curso.belongsToMany(Carrera, { through: CarreraCursos, foreignKey: "cursoId" });

ContactoEstudiante.belongsTo(Estudiante, { foreignKey: "estudianteId" });
Estudiante.hasOne(ContactoEstudiante, { foreignKey: "estudianteId" });

Curso.belongsTo(Departamento, { foreignKey: "departamentoId" });
Departamento.hasMany(Curso, { foreignKey: "departamentoId" });

Historial.belongsTo(Estudiante, { foreignKey: "estudianteId" });
Estudiante.hasMany(Historial, { foreignKey: "estudianteId" });

Horario.belongsTo(Curso, { foreignKey: "cursoId" });
Curso.hasMany(Horario, { foreignKey: "cursoId" });

Prerequisito.belongsTo(Curso, { foreignKey: "cursoId" });
Curso.hasMany(Prerequisito, { foreignKey: "cursoId" });

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