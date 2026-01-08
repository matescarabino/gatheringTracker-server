import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Juntada extends Model {
    public id!: number;
    public fecha!: Date;
    public fotoJuntada!: string;
    public idSede!: number;
    public grupoId!: number;
    public isDeleted!: boolean;
}

Juntada.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        fecha: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        fotoJuntada: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Base64 image string'
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        idSede: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Sedes',
                key: 'id'
            }
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
        tableName: 'Juntadas',
    }
);

export default Juntada;
