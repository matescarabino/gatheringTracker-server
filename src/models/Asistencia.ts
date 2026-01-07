import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Asistencia extends Model {
    public id!: number;
    public idJuntada!: number;
    public idPersona!: number;
    public lavo!: boolean;
    public cocino!: boolean;
    public compras!: boolean;
    public postre!: boolean;
}

Asistencia.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        idJuntada: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Juntadas',
                key: 'id'
            }
        },
        idPersona: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Personas',
                key: 'id'
            }
        },
        lavo: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        cocino: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        compras: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        postre: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'Asistencias',
    }
);

export default Asistencia;
