import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Comida extends Model {
    public id!: number;
    public nombre!: string;
    public tipo!: 'Pedido' | 'Cocinado';
    public grupoId!: number;
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
        tipo: {
            type: DataTypes.ENUM('Pedido', 'Cocinado'),
            allowNull: false,
            defaultValue: 'Cocinado'
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
        tableName: 'Comidas',
    }
);

export default Comida;
