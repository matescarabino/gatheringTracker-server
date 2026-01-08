import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UsuarioAttributes {
    id: string; // UUID from Supabase
    email: string;
    nombre?: string;
    avatarUrl?: string;
}

interface UsuarioCreationAttributes extends Optional<UsuarioAttributes, 'nombre' | 'avatarUrl'> { }

class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes> implements UsuarioAttributes {
    public id!: string;
    public email!: string;
    public nombre?: string;
    public avatarUrl?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Usuario.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        avatarUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'Usuarios',
    }
);

export default Usuario;
