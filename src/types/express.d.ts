import { Usuario } from '../models';

declare global {
    namespace Express {
        interface Request {
            usuario?: Usuario;
            grupoId?: number;
        }
    }
}
