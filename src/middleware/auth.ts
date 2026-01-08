import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Usuario, Grupo } from '../models';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL/Key missing in Backend ENV. Auth might fail.');
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

// 1. Identify User (Optional Auth)
// Checks token, sets req.usuario if valid. Does NOT block request if missing/invalid.
export const identifyUser = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();

    const token = authHeader.replace('Bearer ', '');
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user) {
            const usuario = await Usuario.findByPk(user.id);
            if (usuario) {
                req.usuario = usuario;
            }
        }
    } catch (err) {
        console.warn('Token verification failed:', err);
    }
    next();
};

// 2. Require Auth (Middleware)
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
        return res.status(401).json({ error: 'Unauthorized: Login required' });
    }
    next();
};

// 3. Verify Group Access (Admin or Guest)
export const verifyGroup = async (req: Request, res: Response, next: NextFunction) => {
    // A. If Admin (req.usuario exists)
    if (req.usuario) {
        // Check for specific group code in header (Override/Join)
        const groupCode = req.headers['x-group-code'] as string;

        if (groupCode) {
            const grupo = await Grupo.findOne({ where: { codigo: groupCode } });
            if (grupo) {
                // Access allowed if admin owns it OR if we implement Member logic later.
                // For now, only owner.
                if (grupo.adminId === req.usuario.id) {
                    req.grupoId = grupo.id;
                    return next();
                }
            }
        }

        // Default: Find the group this admin created
        const adminGrupo = await Grupo.findOne({ where: { adminId: req.usuario.id } });
        if (adminGrupo) {
            req.grupoId = adminGrupo.id;
            return next();
        }

        // If admin has no group, they need to create one.
        // But for endpoints requiring group, this is an error unless it's the create group endpoint.
        // If we are here, it means verifyGroup is intercepting.
        return res.status(400).json({ error: 'Start by creating a group.' });
    }

    // B. If Guest (No Identify User or Identify failed)
    const groupCode = req.headers['x-group-code'] as string;
    if (groupCode) {
        const grupo = await Grupo.findOne({ where: { codigo: groupCode } });
        if (!grupo) {
            return res.status(404).json({ error: 'Group code not found' });
        }

        req.grupoId = grupo.id;
        return next();
    }

    return res.status(401).json({ error: 'Group Identification Required (Login or Code)' });
};
