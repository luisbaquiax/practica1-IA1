import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../database/connection';

class ContactoEstudiante extends Model<InferAttributes<ContactoEstudiante>, InferCreationAttributes<ContactoEstudiante>> {
  declare id: CreationOptional<number>;
  declare carnet_estudiante_id: number;
  declare municipio_vivienda_id: number;
  declare direccion: string;
  declare correo_institucional: string;
  declare telefono: string;
}

ContactoEstudiante.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    carnet_estudiante_id: { type: DataTypes.INTEGER, allowNull: false },
    municipio_vivienda_id: { type: DataTypes.INTEGER, allowNull: false },
    direccion: { type: DataTypes.STRING(255), allowNull: false },
    correo_institucional: { type: DataTypes.STRING(100), allowNull: false },
    telefono: { type: DataTypes.STRING(20), allowNull: false },
  },
  { sequelize, tableName: 'informacion_contacto_est', timestamps: false },
);

export default ContactoEstudiante;