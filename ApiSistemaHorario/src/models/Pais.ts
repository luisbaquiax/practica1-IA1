import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../database/connection';

class Pais extends Model<InferAttributes<Pais>, InferCreationAttributes<Pais>> {
  declare id: CreationOptional<number>;
  declare nombre: string;
}

Pais.init(
  {
    id:     { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
  },
  { sequelize, tableName: 'pais', timestamps: false },
);

export default Pais;    
