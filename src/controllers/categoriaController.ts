import { Request, Response } from 'express';
import { Categoria } from '../models';

export const getCategorias = async (req: Request, res: Response) => {
    try {
        const categorias = await Categoria.findAll();
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving categorias', error });
    }
};

export const createCategoria = async (req: Request, res: Response) => {
    try {
        const { nombre } = req.body;
        const newCategoria = await Categoria.create({ nombre });
        res.status(201).json(newCategoria);
    } catch (error) {
        res.status(500).json({ message: 'Error creating categoria', error });
    }
};
