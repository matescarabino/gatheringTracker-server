import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class DetalleComida extends Model {
    public id!: number;
    public idJuntada!: number;
    public idComida!: number;
    public idCategoria!: number;
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
        idCategoria: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Categorias',
                key: 'id'
            }
        },
    },
    {
        sequelize,
        tableName: 'DetalleComidas',
        timestamps: false
    }
);

export default DetalleComida;
