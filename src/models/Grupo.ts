import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface GrupoAttributes {
    id: number;
    nombre: string;
    codigo: string;
    adminId: string; // UUID of the creator/admin
}

interface GrupoCreationAttributes extends Optional<GrupoAttributes, 'id'> { }

class Grupo extends Model<GrupoAttributes, GrupoCreationAttributes> implements GrupoAttributes {
    public id!: number;
    public nombre!: string;
    public codigo!: string;
    public adminId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Grupo.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        codigo: {
            type: DataTypes.STRING(6),
            allowNull: false,
            unique: true,
        },
        adminId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'Grupos',
    }
);

export default Grupo;
