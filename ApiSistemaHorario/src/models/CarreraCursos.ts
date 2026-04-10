import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../database/connection';

class CarreraCursos extends Model<InferAttributes<CarreraCursos>, InferCreationAttributes<CarreraCursos>> {
  declare id: CreationOptional<number>;
  declare carrera_id: number;
  declare codigo_curso_id: number;
}

CarreraCursos.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    carrera_id: { type: DataTypes.INTEGER, allowNull: false },
    codigo_curso_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: 'carrera_cursos', timestamps: false },
);

export default CarreraCursos;