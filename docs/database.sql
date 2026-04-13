-- 1. Tablas de Ubicación Geográfica
CREATE TABLE Pais (
    id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE Departamento (
    id INT PRIMARY KEY,
    pais_id INT,
    nombre VARCHAR(100) NOT NULL,
    FOREIGN KEY (pais_id) REFERENCES Pais(id)
);

CREATE TABLE Municipio (
    id INT PRIMARY KEY,
    departamento_id INT,
    nombre VARCHAR(100) NOT NULL,
    FOREIGN KEY (departamento_id) REFERENCES Departamento(id)
);

-- 2. Tablas Maestras de Carrera y Estudiante
CREATE TABLE Carrera (
    id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    pensum VARCHAR(50),
    credito_obligatorios INT,
    credito_opcionales INT
);

CREATE TABLE Tipo_Estudiante (
    id INT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE Estudiante (
    carnet INT PRIMARY KEY,
    carrera_id INT,
    tipo_estudiante INT,
    dpi VARCHAR(20),
    nombres VARCHAR(100),
    apellidos VARCHAR(100),
    fecha_nacimiento DATE,
    contrasenia VARCHAR(255),
    FOREIGN KEY (carrera_id) REFERENCES Carrera(id),
    FOREIGN KEY (tipo_estudiante) REFERENCES Tipo_Estudiante(id)
);

-- 3. Información de Contacto
CREATE TABLE Informacion_Contacto_Est (
    id INT PRIMARY KEY,
    carnet_estudiante_id INT,
    municipio_vivienda_id INT,
    direccion VARCHAR(255),
    correo_institucional VARCHAR(100),
    telefono VARCHAR(20),
    FOREIGN KEY (carnet_estudiante_id) REFERENCES Estudiante(carnet),
    FOREIGN KEY (municipio_vivienda_id) REFERENCES Municipio(id)
);

-- 4. Tablas de Cursos y Estructura Académica
CREATE TABLE Curso (
    codigo INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    creditos INT,
    semestre INT,
    es_obligatorio BOOLEAN
);

CREATE TABLE Carrera_Cursos (
    id INT PRIMARY KEY,
    carrera_id INT,
    codigo_curso_id INT,
    FOREIGN KEY (carrera_id) REFERENCES Carrera(id),
    FOREIGN KEY (codigo_curso_id) REFERENCES Curso(codigo)
);

CREATE TABLE Prerequisito (
    id INT PRIMARY KEY,
    codigo_curso_id INT,
    codigo_curso_prre INT,
    FOREIGN KEY (codigo_curso_id) REFERENCES Curso(codigo),
    FOREIGN KEY (codigo_curso_prre) REFERENCES Curso(codigo)
);

-- 5. Tablas de Registro y Control
CREATE TABLE Historial (
    id INT PRIMARY KEY,
    carnet_estudiante_id INT,
    codigo_curso_id INT,
    nota INT,
    aprobado BOOLEAN,
    es_semestre VARCHAR(20),
    fecha_registro DATE,
    FOREIGN KEY (carnet_estudiante_id) REFERENCES Estudiante(carnet),
    FOREIGN KEY (codigo_curso_id) REFERENCES Curso(codigo)
);

CREATE TABLE Horario (
    id INT PRIMARY KEY,
    carnet_estudiante_id INT,
    codigo_curso_id INT,
    seccion VARCHAR(5),
    docente VARCHAR(100),
    horario VARCHAR(50),
    salon VARCHAR(20),
    FOREIGN KEY (carnet_estudiante_id) REFERENCES Estudiante(carnet),
    FOREIGN KEY (codigo_curso_id) REFERENCES Curso(codigo)
);