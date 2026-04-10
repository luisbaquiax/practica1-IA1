import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../database/connection';

class Carrera extends Model<InferAttributes<Carrera>, InferCreationAttributes<Carrera>> {
  declare id: CreationOptional<number>;
  declare nombre: string;
  declare pensum: string;
  declare credito_obligatorios: number;
  declare credito_opcionales: number;
}

Carrera.init(
  {
    id:     { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    pensum: { type: DataTypes.STRING(50), allowNull: true },
    credito_obligatorios: { type: DataTypes.INTEGER, allowNull: true },
    credito_opcionales: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, tableName: 'carrera', timestamps: false },
);

export default Carrera;    
