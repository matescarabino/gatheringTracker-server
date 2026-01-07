import { Request, Response } from 'express';
import { Persona } from '../models';

export const getPersonas = async (req: Request, res: Response) => {
    try {
        const personas = await Persona.findAll({ where: { isDeleted: false } });
        res.json(personas);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving personas', error });
    }
};

export const createPersona = async (req: Request, res: Response) => {
    try {
        const { nombre, apodo, fechaNacimiento } = req.body;
        const newPersona = await Persona.create({ nombre, apodo, fechaNacimiento });
        res.status(201).json(newPersona);
    } catch (error) {
        res.status(500).json({ message: 'Error creating persona', error });
    }
};

export const updatePersona = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nombre, apodo, fechaNacimiento } = req.body;
        const [updated] = await Persona.update({ nombre, apodo, fechaNacimiento }, { where: { id } });
        if (updated) {
            const updatedPersona = await Persona.findByPk(id);
            res.json(updatedPersona);
        } else {
            res.status(404).json({ message: 'Persona not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating persona', error });
    }
};

export const deletePersona = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updated] = await Persona.update({ isDeleted: true }, { where: { id } });
        if (updated) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Persona not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting persona', error });
    }
};
