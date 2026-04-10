import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../database/connection';

class Historial extends Model<InferAttributes<Historial>, InferCreationAttributes<Historial>> {
  declare id: CreationOptional<number>;
  declare carnet_estudiante_id: number;
  declare codigo_curso_id: number;
  declare nota: number;
  declare aprobado: boolean;
  declare es_semestre: string;
  declare fecha_registro: Date;
}

Historial.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    carnet_estudiante_id: { type: DataTypes.INTEGER, allowNull: false },
    codigo_curso_id: { type: DataTypes.INTEGER, allowNull: false },
    nota: { type: DataTypes.INTEGER, allowNull: false },
    aprobado: { type: DataTypes.BOOLEAN, allowNull: false },
    es_semestre: { type: DataTypes.STRING(20), allowNull: false },
    fecha_registro: { type: DataTypes.DATEONLY, allowNull: false },
  },
  { sequelize, tableName: 'historial', timestamps: false },
);

export default Historial;