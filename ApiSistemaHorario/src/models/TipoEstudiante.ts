import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../database/connection';

class TipoEstudiante extends Model<InferAttributes<TipoEstudiante>, InferCreationAttributes<TipoEstudiante>> {
  declare id: CreationOptional<number>;
  declare nombre: string;
}

TipoEstudiante  .init(
  {
    id:     { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(50), allowNull: false },
  },
  { sequelize, tableName: 'tipo_estudiante', timestamps: false },
);

export default TipoEstudiante;    