/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { Usuario, Grupo } from '../models';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export const syncUser = async (req: Request, res: Response) => {
    // This endpoint must be protected by verifyAdmin middleware to populate req.usuario if exists,
    // OR we can manually verify token here if we want to allow new users.
    // Actually, verifyAdmin fails if user not in DB. So for SYNC we need loose verification or manual.
    // Let's do manual token verification here to allow "First Time Login".

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.replace('Bearer ', '');

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return res.status(401).json({ error: 'Invalid token' });

        const { id, email, user_metadata } = user;
        const nombre = user_metadata.name || user_metadata.full_name || email?.split('@')[0];
        const avatarUrl = user_metadata.avatar_url || user_metadata.picture;

        const [usuario, created] = await Usuario.findOrCreate({
            where: { id },
            defaults: { id, email: email!, nombre, avatarUrl }
        });

        if (!created) {
            // Update info if changed
            await usuario.update({ email: email!, nombre, avatarUrl });
        }

        // Check if user has a group
        const group = await Grupo.findOne({ where: { adminId: id } });

        res.json({
            user: usuario,
            hasGroup: !!group,
            group: group
        });

    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ error: 'Sync failed' });
    }
};

export const createGroup = async (req: Request, res: Response) => {
    // Requires verifyAdmin (which now should pass because we called syncUser first)
    // But verifyAdmin logic "Usuario.findByPk" works now.

    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Name required' });
    if (!req.usuario) return res.status(401).json({ error: 'User required' });

    try {
        // Check if already has group (One group per admin policy)
        const existing = await Grupo.findOne({ where: { adminId: req.usuario.id } });
        if (existing) return res.status(400).json({ error: 'User already has a group', group: existing });

        // Generate Code
        const generateCode = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 for clarity
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        };

        let codigo = generateCode();
        // Ensure unique
        while (await Grupo.findOne({ where: { codigo } })) {
            codigo = generateCode();
        }

        const grupo = await Grupo.create({
            nombre,
            codigo,
            adminId: req.usuario.id
        });

        res.status(201).json(grupo);
    } catch (error) {
        res.status(500).json({ error: 'Create Group failed', details: error });
    }
};

export const validateGroupCode = async (req: Request, res: Response) => {
    const { codigo } = req.body;
    if (!codigo) return res.status(400).json({ error: 'Code required' });

    try {
        const grupo = await Grupo.findOne({ where: { codigo: codigo.toUpperCase() } });
        if (!grupo) return res.status(404).json({ error: 'Invalid Code' });

        res.json({ valid: true, groupName: grupo.nombre, codigo: grupo.codigo });
    } catch (error) {
        res.status(500).json({ error: 'Validation failed' });
    }
};
