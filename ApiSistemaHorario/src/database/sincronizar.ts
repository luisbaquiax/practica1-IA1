import sequelize from './connection';

import '../models/Carrera';
import '../models/CarreraCursos';
import '../models/ContactoEstudiante';
import '../models/Curso';
import '../models/Departamento';
import '../models/Estudiante';
import '../models/Historial';
import '../models/Horario';
import '../models/Pais';
import '../models/Prerequisito';
import '../models/TipoEstudiante';


// Sincronizar para crear tablas si no existen
sequelize
  .sync({ alter: false })
  .then(() => console.log('✅ Modelos sincronizados con la base de datos.'))
  .catch((err) => console.error('❌ Error al sincronizar modelos:', err));

export default sequelize;