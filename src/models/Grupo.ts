import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface GrupoAttributes {
    id: number;
    nombre: string;
    codigo: string;
    adminId: string; // UUID of the creator/admin
    minAsistenciasNuevaJuntada: number;
    maxPersonasCocina: number;
    maxPersonasCompras: number;
}

interface GrupoCreationAttributes extends Optional<GrupoAttributes, 'id' | 'minAsistenciasNuevaJuntada' | 'maxPersonasCocina' | 'maxPersonasCompras'> { }

class Grupo extends Model<GrupoAttributes, GrupoCreationAttributes> implements GrupoAttributes {
    public id!: number;
    public nombre!: string;
    public codigo!: string;
    public adminId!: string;
    public minAsistenciasNuevaJuntada!: number;
    public maxPersonasCocina!: number;
    public maxPersonasCompras!: number;

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
        minAsistenciasNuevaJuntada: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        maxPersonasCocina: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2
        },
        maxPersonasCompras: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2
        },
    },
    {
        sequelize,
        tableName: 'Grupos',
    }
);

export default Grupo;
