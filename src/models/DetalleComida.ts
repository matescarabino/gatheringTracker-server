import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class DetalleComida extends Model {
    public id!: number;
    public idJuntada!: number;
    public idComida!: number;
    public categoria!: 'Almuerzo' | 'Merienda' | 'Cena';
}

DetalleComida.init(
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
        idComida: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Comidas',
                key: 'id'
            }
        },
        categoria: {
            type: DataTypes.ENUM('Almuerzo', 'Merienda', 'Cena', 'Postre'),
            allowNull: false,
            defaultValue: 'Cena'
        },
    },
    {
        sequelize,
        tableName: 'DetalleComidas',
        timestamps: false,
        indexes: [
            { fields: ['idJuntada'] }
        ]
    }
);

export default DetalleComida;
