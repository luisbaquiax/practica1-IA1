-- ============================================================
-- SCRIPT: Eliminar columnas duplicadas creadas por Sequelize
-- Causa: asociaciones con foreignKey en camelCase ("carreraId")
--        mientras las columnas reales son snake_case ("carrera_id")
-- ============================================================

-- ---- tabla: estudiante ----
-- Columna extra: "carreraId" (debe usarse "carrera_id")
ALTER TABLE estudiante DROP COLUMN IF EXISTS "carreraId";

-- ---- tabla: carrera_cursos ----
-- Columnas extra: "carreraId" y "cursoId"
ALTER TABLE carrera_cursos DROP COLUMN IF EXISTS "carreraId";
ALTER TABLE carrera_cursos DROP COLUMN IF EXISTS "cursoId";

-- ---- tabla: informacion_contacto_est ----
-- Columna extra: "estudianteId" (debe usarse "carnet_estudiante_id")
ALTER TABLE informacion_contacto_est DROP COLUMN IF EXISTS "estudianteId";

-- ---- tabla: historial ----
-- Columna extra: "estudianteId"
ALTER TABLE historial DROP COLUMN IF EXISTS "estudianteId";
-- Si es_semestre fue creado como BOOLEAN en lugar de VARCHAR, hay que recrearla
-- Solo ejecutar si el tipo actual en la BD es BOOLEAN:
-- ALTER TABLE historial ALTER COLUMN es_semestre TYPE VARCHAR(20) USING es_semestre::text;

-- ---- tabla: horario ----
-- Columna extra: "cursoId"
ALTER TABLE horario DROP COLUMN IF EXISTS "cursoId";

-- ---- tabla: prerequisito ----
-- Columna extra: "cursoId"
ALTER TABLE prerequisito DROP COLUMN IF EXISTS "cursoId";

-- ---- tabla: curso ----
-- Columna extra: "departamentoId" (la asociación Curso->Departamento fue incorrecta,
--                Curso no tiene FK a departamento en el modelo)
ALTER TABLE curso DROP COLUMN IF EXISTS "departamentoId";
