/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { Persona, Asistencia } from '../models';

export const getPersonas = async (req: Request, res: Response) => {
    try {
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        const personas = await Persona.findAll({
            where: { isDeleted: false, grupoId },
            include: [{
                model: Asistencia,
                attributes: ['id', 'cocino', 'lavo', 'compras']
            }]
        });
        res.json(personas);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving personas', error });
    }
};

import { Op } from 'sequelize';
import sequelize from '../config/database';

export const createPersona = async (req: Request, res: Response) => {
    try {
        const { nombre, apodo, fechaNacimiento } = req.body;
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        // Validations
        if (!nombre || nombre.length < 3 || nombre.length > 50) {
            return res.status(400).json({ error: 'El nombre debe tener entre 3 y 50 caracteres.' });
        }
        if (apodo && apodo.length > 30) {
            return res.status(400).json({ error: 'El apodo no puede superar los 30 caracteres.' });
        }

        // Check Duplicate (Name OR Nickname in same group)
        // We want to avoid two people named "Mateo" or two people nicknamed "Teo".

        const whereClause: any = {
            grupoId,
            [Op.or]: [
                sequelize.where(sequelize.fn('LOWER', sequelize.col('nombre')), sequelize.fn('LOWER', nombre))
            ]
        };

        if (apodo) {
            whereClause[Op.or].push(
                sequelize.where(sequelize.fn('LOWER', sequelize.col('apodo')), sequelize.fn('LOWER', apodo))
            );
        }

        const existing = await Persona.findOne({ where: whereClause });

        if (existing) {
            return res.status(400).json({ error: 'Ya existe una persona con ese nombre o apodo.' });
        }

        const newPersona = await Persona.create({
            nombre,
            apodo,
            fechaNacimiento,
            grupoId
        });
        res.status(201).json(newPersona);
    } catch (error) {
        res.status(500).json({ message: 'Error creating persona', error });
    }
};

export const updatePersona = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nombre, apodo, fechaNacimiento } = req.body;
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        const [updated] = await Persona.update(
            { nombre, apodo, fechaNacimiento },
            { where: { id, grupoId } }
        );

        if (updated) {
            const updatedPersona = await Persona.findByPk(id);
            res.json(updatedPersona);
        } else {
            res.status(404).json({ message: 'Persona not found or access denied' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating persona', error });
    }
};

export const deletePersona = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        const [updated] = await Persona.update(
            { isDeleted: true },
            { where: { id, grupoId } }
        );

        if (updated) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Persona not found or access denied' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting persona', error });
    }
};
