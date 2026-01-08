import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as sedeController from '../controllers/sedeController';
import * as personaController from '../controllers/personaController';
import * as comidaController from '../controllers/comidaController';
import * as juntadaController from '../controllers/juntadaController';
import authRouter from './auth';
import { identifyUser, requireAuth, verifyGroup } from '../middleware/auth';

const router = Router();

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Public/Auth Routes (No group restriction yet, specific middleware inside)
router.use('/auth', authRouter);

// Protected Data Routes
// 1. Identify User (sets req.usuario if token present)
// 2. Verify Group (Checks req.usuario or x-group-code, sets req.grupoId)
// Only apply verifyGroup to endpoints that NEED group context.
// Authentication routes don't need it.

router.use(identifyUser); // Always try to identify
// router.use(verifyGroup); // Applying globally? 
// No, auth routes should NOT use verifyGroup.
// But we mounted authRouter before verifyGroup could be applied if we used router.use().
// But we want verifyGroup for all data routes below.

// Filter middleware for paths below
const globalMiddleware = [identifyUser, verifyGroup];

// Sedes
router.get('/sedes', ...globalMiddleware, sedeController.getSedes);
router.post('/sedes', ...globalMiddleware, requireAuth, sedeController.createSede);
router.put('/sedes/:id', ...globalMiddleware, requireAuth, sedeController.updateSede);
router.delete('/sedes/:id', ...globalMiddleware, requireAuth, sedeController.deleteSede);

// Personas
router.get('/personas', ...globalMiddleware, personaController.getPersonas);
router.post('/personas', ...globalMiddleware, requireAuth, personaController.createPersona);
router.put('/personas/:id', ...globalMiddleware, requireAuth, personaController.updatePersona);
router.delete('/personas/:id', ...globalMiddleware, requireAuth, personaController.deletePersona);

// Comidas
router.get('/comidas', ...globalMiddleware, comidaController.getComidas);
router.post('/comidas', ...globalMiddleware, requireAuth, comidaController.createComida);
router.put('/comidas/:id', ...globalMiddleware, requireAuth, comidaController.updateComida);
router.delete('/comidas/:id', ...globalMiddleware, requireAuth, comidaController.deleteComida);

// Juntadas
router.get('/juntadas', ...globalMiddleware, juntadaController.getJuntadas);
router.get('/juntadas/:id', ...globalMiddleware, juntadaController.getJuntadaById);
router.post('/juntadas', ...globalMiddleware, requireAuth, juntadaController.createJuntada);
router.put('/juntadas/:id', ...globalMiddleware, requireAuth, juntadaController.updateJuntada);
router.delete('/juntadas/:id', ...globalMiddleware, requireAuth, juntadaController.deleteJuntada);

export default router;
