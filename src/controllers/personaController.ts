/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { Persona } from '../models';

export const getPersonas = async (req: Request, res: Response) => {
    try {
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        const personas = await Persona.findAll({
            where: { isDeleted: false, grupoId }
        });
        res.json(personas);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving personas', error });
    }
};

export const createPersona = async (req: Request, res: Response) => {
    try {
        const { nombre, apodo, fechaNacimiento } = req.body;
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

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
