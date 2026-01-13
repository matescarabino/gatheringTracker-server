import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import sequelize from './config/database';
import { Sede, Comida, Persona, Juntada, Asistencia } from './models';

import apiRouter from './routes/api';

const app = express();
const port = process.env.PORT || 2404;

// Security: Trust Proxy (Required for Rate Limiter behind proxies like Render)
app.set('trust proxy', 1);

// Security: Helmet
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow loading images from different origins/this origin if needed for client
}));

// Security: Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Limit each IP to 300 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all requests (or just API)
// Ideally static files (images) shouldn't be strictly limited or should have higher limits
app.use('/api', limiter);

const allowedOrigins = [
    'http://localhost:2403',
    'http://localhost:3000',
    ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [])
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', apiRouter);

app.get('/', (req, res) => {
    res.json({
        message: 'LaJuntada Backend Running',
        status: 'online',
        environment: process.env.NODE_ENV || 'development',
        time: new Date().toISOString(),
        allowedOrigins: allowedOrigins
    });
});

// Sync Database and Start Server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync models (alter: true only for dev, or manual migrations for prod)
        // For safety, we disable alter in production or if explicitly disabled
        const isDev = process.env.NODE_ENV === 'development';
        await sequelize.sync({ alter: isDev });
        console.log(`Database synced (alter: ${isDev}).`);

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
