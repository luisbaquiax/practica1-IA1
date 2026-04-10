import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../database/connection';

class Curso extends Model<InferAttributes<Curso>, InferCreationAttributes<Curso>> {
  declare codigo: CreationOptional<number>;
  declare nombre: string;
  declare creditos: number;
  declare semestre: number;
  declare es_obligatorio: boolean;
}

Curso.init(
  {
    codigo: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    creditos: { type: DataTypes.INTEGER, allowNull: true },
    semestre: { type: DataTypes.INTEGER, allowNull: true },
    es_obligatorio: { type: DataTypes.BOOLEAN, allowNull: true },
  },
  { sequelize, tableName: 'curso', timestamps: false },
);

export default Curso;