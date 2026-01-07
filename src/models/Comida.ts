import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Comida extends Model {
    public id!: number;
    public nombre!: string;
    public idCategoria!: number;
    public isDeleted!: boolean;
}

Comida.init(
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
        idCategoria: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Categorias',
                key: 'id'
            }
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
    },
    {
        sequelize,
        tableName: 'Comidas',
    }
);

export default Comida;
