import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.warn('Advertencia: DATABASE_URL no está definida. Asegúrete de tenerla en tu archivo .env para producción.');
}

// Configuración por defecto para desarrollo local si no hay URL (aunque para Supabase idealmente usaremos la URL)
const dbName = process.env.DB_NAME || 'GeniusDB';
const dbUser = process.env.DB_USER || 'postgres';
const dbPass = process.env.DB_PASS || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';

const sequelize = databaseUrl
    ? new Sequelize(databaseUrl, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Necesario para conexiones SSL de Supabase/Render en modo gratuito a veces
            }
        }
    })
    : new Sequelize(dbName, dbUser, dbPass, {
        host: dbHost,
        dialect: 'postgres',
        logging: false,
    });

export default sequelize;
