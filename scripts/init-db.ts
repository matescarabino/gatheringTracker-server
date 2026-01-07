
import sequelize from '../src/config/database';

const checkDatabaseConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión exitosa a la base de datos PostgreSQL.');

        // Opcional: Sincronizar modelos si se desea (cuidado en producción con alter: true)
        // await sequelize.sync({ alter: true });
        // console.log('Tablas sincronizadas.');

    } catch (error) {
        console.error('❌ No se pudo conectar a la base de datos:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
};

checkDatabaseConnection();
