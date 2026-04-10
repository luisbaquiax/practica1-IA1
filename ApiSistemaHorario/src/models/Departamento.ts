import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../database/connection';

class Departamento extends Model<InferAttributes<Departamento>, InferCreationAttributes<Departamento>> {
  declare id: CreationOptional<number>;
  declare nombre: string;
  declare pais_id: number;
}

Departamento.init(
  {
    id:     { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    pais_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: 'departamento', timestamps: false },
);

export default Departamento;    
