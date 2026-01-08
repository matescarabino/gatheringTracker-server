import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Persona extends Model {
    public id!: number;
    public nombre!: string;
    public apodo!: string;
    public fechaNacimiento!: Date | null;
    public grupoId!: number;
    public isDeleted!: boolean;
}

Persona.init(
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
        apodo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fechaNacimiento: {
            type: DataTypes.DATEONLY,
            allowNull: true,
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
        tableName: 'Personas',
    }
);

export default Persona;
