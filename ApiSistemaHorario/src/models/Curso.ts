import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../database/connection';

class Curso extends Model<InferAttributes<Curso>, InferCreationAttributes<Curso>> {
  declare codigo: CreationOptional<number>;
  declare nombre: string;
  declare creditos: number;
}

Curso.init(
  {
    codigo: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    creditos: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, tableName: 'curso', timestamps: false },
);

export default Curso;