import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../database/connection';

class Horario extends Model<InferAttributes<Horario>, InferCreationAttributes<Horario>> {
  declare id: CreationOptional<number>;
  declare carnet_estudiante_id: number;
  declare codigo_curso_id: number;
  declare seccion: string;
  declare docente: string;
  declare horario: string;
  declare salon: string;
}

Horario.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    carnet_estudiante_id: { type: DataTypes.INTEGER, allowNull: false },
    codigo_curso_id: { type: DataTypes.INTEGER, allowNull: false },
    seccion: { type: DataTypes.STRING(5), allowNull: false },
    docente: { type: DataTypes.STRING(100), allowNull: false },
    horario: { type: DataTypes.STRING(50), allowNull: false },
    salon: { type: DataTypes.STRING(20), allowNull: false },
  },
  { sequelize, tableName: 'horario', timestamps: false },
);

export default Horario;