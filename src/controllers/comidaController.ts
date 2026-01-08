import { Request, Response } from 'express';
import { Comida, Categoria } from '../models';

export const getComidas = async (req: Request, res: Response) => {
    try {
        const comidas = await Comida.findAll({
            where: { isDeleted: false },
            include: [{ model: Categoria, attributes: ['nombre'] }]
        });
        res.json(comidas);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving comidas', error });
    }
};

export const createComida = async (req: Request, res: Response) => {
    try {
        const { nombre, idCategoria, tipo } = req.body;
        const newComida = await Comida.create({ nombre, idCategoria, tipo });
        res.status(201).json(newComida);
    } catch (error) {
        res.status(500).json({ message: 'Error creating comida', error });
    }
};

export const updateComida = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nombre, idCategoria, tipo } = req.body;
        const [updated] = await Comida.update({ nombre, idCategoria, tipo }, { where: { id } });
        if (updated) {
            const updatedComida = await Comida.findByPk(id);
            res.json(updatedComida);
        } else {
            res.status(404).json({ message: 'Comida not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating comida', error });
    }
};

export const deleteComida = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updated] = await Comida.update({ isDeleted: true }, { where: { id } });
        if (updated) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Comida not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting comida', error });
    }
};
