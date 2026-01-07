import { Request, Response } from 'express';
import { Sede } from '../models';

export const getSedes = async (req: Request, res: Response) => {
    try {
        const sedes = await Sede.findAll({
            where: { isDeleted: false },
            include: ['Dueño']
        });
        res.json(sedes);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving sedes', error });
    }
};

export const createSede = async (req: Request, res: Response) => {
    try {
        const { nombre, direccion, idPersona } = req.body;
        const newSede = await Sede.create({ nombre, direccion, idPersona });
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
        const [updated] = await Sede.update({ nombre, direccion, idPersona }, { where: { id } });
        if (updated) {
            const updatedSede = await Sede.findByPk(id, { include: ['Dueño'] });
            res.json(updatedSede);
        } else {
            res.status(404).json({ message: 'Sede not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating sede', error });
    }
};

export const deleteSede = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updated] = await Sede.update({ isDeleted: true }, { where: { id } });
        if (updated) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Sede not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting sede', error });
    }
};
