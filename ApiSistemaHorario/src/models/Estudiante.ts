//Estudainte.ts
import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../database/connection';

class Estudiante extends Model<InferAttributes<Estudiante>, InferCreationAttributes<Estudiante>> {
  declare carnet: CreationOptional<number>;
  declare carrera_id: number;
  declare tipo_estudiante: number;
  declare dpi: string;
  declare nombres: string;
  declare apellidos: string;
  declare fecha_nacimiento: Date;
  declare contrasenia: string;
}

Estudiante.init(
  {
    carnet: { type: DataTypes.INTEGER, primaryKey: true },
    carrera_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo_estudiante: { type: DataTypes.INTEGER, allowNull: false },
    dpi: { type: DataTypes.STRING(20), allowNull: false },
    nombres: { type: DataTypes.STRING(100), allowNull: false },
    apellidos: { type: DataTypes.STRING(100), allowNull: false },
    fecha_nacimiento: { type: DataTypes.DATEONLY, allowNull: false },
    contrasenia: { type: DataTypes.STRING(255), allowNull: false },
  },
  { sequelize, tableName: 'estudiante', timestamps: false },
);

export default Estudiante;  