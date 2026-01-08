import express from 'express';
import cors from 'cors';
import path from 'path';
import sequelize from './config/database';
import { Sede, Categoria, Comida, Persona, Juntada, Asistencia } from './models';

import apiRouter from './routes/api';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', apiRouter);

app.get('/', (req, res) => {
    res.send('Rushtadas Backend Running');
});

// Sync Database and Start Server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync models (alter: true updates schema if changed, force: false keeps data)
        await sequelize.sync({ alter: true });
        console.log('Database synced.');

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
