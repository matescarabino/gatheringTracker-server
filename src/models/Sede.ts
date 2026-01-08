import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Sede extends Model {
    public id!: number;
    public nombre!: string;
    public direccion!: string;
    public idPersona!: number | null;
    public grupoId!: number;
    public isDeleted!: boolean;
}

Sede.init(
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
        direccion: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        idPersona: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Personas',
                key: 'id'
            }
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        grupoId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Grupos',
                key: 'id'
            }
        },
    },
    {
        sequelize,
        tableName: 'Sedes',
    }
);

export default Sede;
