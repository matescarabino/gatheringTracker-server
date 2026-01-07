import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Categoria extends Model {
    public id!: number;
    public nombre!: string;
    public isDeleted!: boolean;
}

Categoria.init(
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
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
    },
    {
        sequelize,
        tableName: 'Categorias',
    }
);

export default Categoria;
