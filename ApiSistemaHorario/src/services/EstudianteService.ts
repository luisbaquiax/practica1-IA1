import Estudiante from '../models/Estudiante';
import ContactoEstudiante from '../models/ContactoEstudiante';
import Carrera from '../models/Carrera';
import TipoEstudiante from '../models/TipoEstudiante';
import { NotFoundError, UnauthorizedError } from '../exceptions/ApiExceptions';
import type { LoginRequest, EstudianteResponse, ContactoResponse } from '../types';

// ===== Helper: busca o lanza 404 =====
const findByCarnet = async (carnet: number): Promise<Estudiante> => {
  const est = await Estudiante.findByPk(carnet);
  if (!est) throw new NotFoundError('Estudiante', carnet);
  return est;
};

// ===== Helper: construye la respuesta completa del perfil =====
const buildPerfil = async (est: Estudiante): Promise<EstudianteResponse> => {
  const [carrera, tipo, contacto] = await Promise.all([
    Carrera.findByPk(est.carrera_id),
    TipoEstudiante.findByPk(est.tipo_estudiante),
    ContactoEstudiante.findOne({ where: { carnet_estudiante_id: est.carnet } }),
  ]);

  const contactoResp: ContactoResponse | null = contacto
    ? {
        id: contacto.id,
        carnet_estudiante_id: contacto.carnet_estudiante_id,
        municipio_vivienda_id: contacto.municipio_vivienda_id,
        direccion: contacto.direccion,
        correo_institucional: contacto.correo_institucional,
        telefono: contacto.telefono,
      }
    : null;

  return {
    carnet: est.carnet,
    carrera_id: est.carrera_id,
    tipo_estudiante: est.tipo_estudiante,
    dpi: est.dpi,
    nombres: est.nombres,
    apellidos: est.apellidos,
    fecha_nacimiento: est.fecha_nacimiento as unknown as string,
    carrera: carrera?.nombre,
    tipo_nombre: tipo?.nombre,
    contacto: contactoResp,
  };
};

// ===== Login =====
const login = async ({ carnet, contrasenia }: LoginRequest): Promise<EstudianteResponse> => {
  const est = await Estudiante.findByPk(carnet);
  if (!est || est.contrasenia !== contrasenia) {
    throw new UnauthorizedError('Carnet o contraseña incorrectos');
  }
  return buildPerfil(est);
};

// ===== Obtener perfil =====
const getByCarnet = async (carnet: number): Promise<EstudianteResponse> => {
  const est = await findByCarnet(carnet);
  return buildPerfil(est);
};

// ===== Actualizar datos personales =====
const updateEstudiante = async (
  carnet: number,
  data: Partial<{ dpi: string; nombres: string; apellidos: string; fecha_nacimiento: string }>,
): Promise<EstudianteResponse> => {
  const est = await findByCarnet(carnet);
  const { fecha_nacimiento, ...rest } = data;
  await est.update({
    ...rest,
    ...(fecha_nacimiento !== undefined && { fecha_nacimiento: new Date(fecha_nacimiento) }),
  });
  return buildPerfil(est);
};

// ===== Actualizar información de contacto =====
const updateContacto = async (
  carnet: number,
  data: Partial<{
    municipio_vivienda_id: number;
    direccion: string;
    correo_institucional: string;
    telefono: string;
  }>,
): Promise<ContactoResponse> => {
  const contacto = await ContactoEstudiante.findOne({ where: { carnet_estudiante_id: carnet } });
  if (!contacto) throw new NotFoundError('Contacto del Estudiante', carnet);
  await contacto.update(data);
  return {
    id: contacto.id,
    carnet_estudiante_id: contacto.carnet_estudiante_id,
    municipio_vivienda_id: contacto.municipio_vivienda_id,
    direccion: contacto.direccion,
    correo_institucional: contacto.correo_institucional,
    telefono: contacto.telefono,
  };
};

export const EstudianteService = { login, getByCarnet, updateEstudiante, updateContacto };
