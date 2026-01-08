import { Router } from 'express';
import { syncUser, createGroup, validateGroupCode } from '../controllers/authController';
import { requireAuth, identifyUser } from '../middleware/auth';

const router = Router();

router.post('/sync', syncUser); // syncUser handles token verification manually 
// Actually syncUser used manual verification because user might not be in DB yet.
// So identifyUser might fail to set req.usuario.
// Only createGroup needs requireAuth (DB user must exist).

router.post('/groups', identifyUser, requireAuth, createGroup);
router.post('/groups/validate', validateGroupCode);

export default router;
