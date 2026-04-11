import { DataTypes, Model, Optional } from 'sequelize';
import  sequelize from '../database/connection';
import Departamento from './Departamento';

interface MunicipioAttributes {
  id: number;
  departamento_id: number;
  nombre: string;
}

interface MunicipioCreationAttributes extends Optional<MunicipioAttributes, 'id'> {}

class Municipio extends Model<MunicipioAttributes, MunicipioCreationAttributes> implements MunicipioAttributes {
  public id!: number;
  public departamento_id!: number;
  public nombre!: string;
}

Municipio.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    departamento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Departamento,
        key: 'id',
      },
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  }, 
    {
    sequelize,
    modelName: 'municipio',
    tableName: 'municipio',
    timestamps: false,
  }
);

export default Municipio;