import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Comida extends Model {
    public id!: number;
    public nombre!: string;
    public idCategoria!: number;
    public tipo!: 'Pedido' | 'Cocinado';
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
        tipo: {
            type: DataTypes.ENUM('Pedido', 'Cocinado'),
            allowNull: false,
            defaultValue: 'Cocinado'
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
