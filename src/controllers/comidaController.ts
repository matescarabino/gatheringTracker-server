/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { Comida } from '../models';
import sequelize from '../config/database';
// @ts-ignore
import { Op } from 'sequelize';

export const getComidas = async (req: Request, res: Response) => {
    try {
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        const comidas = await Comida.findAll({
            where: {
                isDeleted: false,
                grupoId
            }
        });
        res.json(comidas);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving comidas', error });
    }
};

export const createComida = async (req: Request, res: Response) => {
    try {
        const { nombre, tipo } = req.body;
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        // Validations
        if (!nombre || nombre.length < 3 || nombre.length > 50) {
            return res.status(400).json({ error: 'El nombre debe tener entre 3 y 50 caracteres.' });
        }

        // Check Duplicate (Case Insensitive)
        const existing = await Comida.findOne({
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('nombre')),
                sequelize.fn('LOWER', nombre)
            ) as any
        });

        // Ensure checking within the same group? 
        // Wait, Comida model has grupoId? Yes, createComida adds it.
        // The check above searches GLOBALLY if I don't add grupoId filter.
        // Let's refine the query.

        const existingInGroup = await Comida.findOne({
            where: {
                grupoId,
                [Op.and]: [
                    sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('nombre')),
                        sequelize.fn('LOWER', nombre)
                    )
                ]
            } as any
        });

        if (existingInGroup) {
            return res.status(400).json({ error: 'Ya existe una comida con ese nombre.' });
        }

        const newComida = await Comida.create({
            nombre,
            tipo,
            grupoId
        });
        res.status(201).json(newComida);
    } catch (error) {
        res.status(500).json({ message: 'Error creating comida', error });
    }
};

export const updateComida = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nombre, tipo } = req.body;
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        const [updated] = await Comida.update(
            { nombre, tipo },
            { where: { id, grupoId } } // Security: only update if belongs to group
        );

        if (updated) {
            const updatedComida = await Comida.findByPk(id);
            res.json(updatedComida);
        } else {
            res.status(404).json({ message: 'Comida not found or access denied' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating comida', error });
    }
};

export const deleteComida = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        const [updated] = await Comida.update(
            { isDeleted: true },
            { where: { id, grupoId } }
        );

        if (updated) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Comida not found or access denied' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting comida', error });
    }
};
