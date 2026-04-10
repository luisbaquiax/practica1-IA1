import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../database/connection';

class Prerequisito extends Model<InferAttributes<Prerequisito>, InferCreationAttributes<Prerequisito>> {
  declare id: CreationOptional<number>;
  declare codigo_curso_id: number;
  declare codigo_curso_prre: number;
}

Prerequisito.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    codigo_curso_id: { type: DataTypes.INTEGER, allowNull: false },
    codigo_curso_prre: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: 'prerequisito', timestamps: false },
);

export default Prerequisito;