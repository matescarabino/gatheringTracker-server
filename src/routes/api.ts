import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as sedeController from '../controllers/sedeController';
import * as personaController from '../controllers/personaController';
import * as comidaController from '../controllers/comidaController';
import * as categoriaController from '../controllers/categoriaController';
import * as juntadaController from '../controllers/juntadaController';

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

// Sedes
router.get('/sedes', sedeController.getSedes);
router.post('/sedes', sedeController.createSede);
router.put('/sedes/:id', sedeController.updateSede);
router.delete('/sedes/:id', sedeController.deleteSede);

// Personas
router.get('/personas', personaController.getPersonas);
router.post('/personas', personaController.createPersona);
router.put('/personas/:id', personaController.updatePersona);
router.delete('/personas/:id', personaController.deletePersona);

// Categorias
router.get('/categorias', categoriaController.getCategorias);
router.post('/categorias', categoriaController.createCategoria);

// Comidas
router.get('/comidas', comidaController.getComidas);
router.post('/comidas', comidaController.createComida);
router.put('/comidas/:id', comidaController.updateComida);
router.delete('/comidas/:id', comidaController.deleteComida);

// Juntadas
router.get('/juntadas', juntadaController.getJuntadas);
router.get('/juntadas/:id', juntadaController.getJuntadaById);
router.post('/juntadas', upload.single('fotoJuntada'), juntadaController.createJuntada);
router.put('/juntadas/:id', upload.single('fotoJuntada'), juntadaController.updateJuntada);
router.delete('/juntadas/:id', juntadaController.deleteJuntada);

export default router;
