/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { Sede } from '../models';

export const getSedes = async (req: Request, res: Response) => {
    try {
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        const page = parseInt(req.query.page as string) || 1;
        let limit: number | undefined = parseInt(req.query.limit as string) || 15;
        let offset: number | undefined = (page - 1) * limit;

        if (req.query.limit === '-1') {
            limit = undefined;
            offset = undefined;
        }

        const sortField = (req.query.sortField as string) || 'nombre';
        const sortOrder = (req.query.sortOrder as string) === 'DESC' ? 'DESC' : 'ASC'; // Default ASC for Sedes

        const { count, rows } = await Sede.findAndCountAll({
            where: { isDeleted: false, grupoId },
            include: ['Dueño'],
            order: [[sortField, sortOrder]],
            limit,
            offset,
            distinct: true
        });

        res.json({
            data: rows,
            meta: {
                total: count,
                page,
                limit: limit || count,
                totalPages: limit ? Math.ceil(count / limit) : 1
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving sedes', error });
    }
};

import { Op } from 'sequelize';
import sequelize from '../config/database';

export const createSede = async (req: Request, res: Response) => {
    try {
        const { nombre, direccion, idPersona } = req.body;
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        // Validations
        if (!nombre || nombre.length < 3 || nombre.length > 50) {
            return res.status(400).json({ error: 'El nombre debe tener entre 3 y 50 caracteres.' });
        }

        // Check Duplicate (Case Insensitive in same group)
        const existing = await Sede.findOne({
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

        if (existing) {
            return res.status(400).json({ error: 'Ya existe una sede con ese nombre.' });
        }

        const newSede = await Sede.create({ nombre, direccion, idPersona, grupoId });
        const sedeWithOwner = await Sede.findByPk(newSede.id, { include: ['Dueño'] });
        res.status(201).json(sedeWithOwner);
    } catch (error) {
        res.status(500).json({ message: 'Error creating sede', error });
    }
};

export const updateSede = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nombre, direccion, idPersona } = req.body;
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        // Validations
        if (!nombre || nombre.length < 3 || nombre.length > 50) {
            return res.status(400).json({ error: 'El nombre debe tener entre 3 y 50 caracteres.' });
        }

        // Check Duplicate (Case Insensitive in same group, excluding current ID)
        const existing = await Sede.findOne({
            where: {
                grupoId,
                id: { [Op.ne]: id },
                [Op.and]: [
                    sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('nombre')),
                        sequelize.fn('LOWER', nombre)
                    )
                ]
            } as any
        });

        if (existing) {
            return res.status(400).json({ error: 'Ya existe una sede con ese nombre.' });
        }

        const [updated] = await Sede.update(
            { nombre, direccion, idPersona },
            { where: { id, grupoId } }
        );

        if (updated) {
            const updatedSede = await Sede.findByPk(id, { include: ['Dueño'] });
            res.json(updatedSede);
        } else {
            res.status(404).json({ message: 'Sede not found or access denied' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating sede', error });
    }
};

export const deleteSede = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        const [updated] = await Sede.update(
            { isDeleted: true },
            { where: { id, grupoId } }
        );

        if (updated) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Sede not found or access denied' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting sede', error });
    }
};
