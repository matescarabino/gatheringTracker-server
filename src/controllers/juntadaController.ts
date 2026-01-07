import { Request, Response } from 'express';
import { Juntada, Sede, Comida, Asistencia, Persona, DetalleComida, Categoria } from '../models';
import sequelize from '../config/database';

export const getJuntadas = async (req: Request, res: Response) => {
    try {
        const juntadas = await Juntada.findAll({
            where: { isDeleted: false },
            include: [
                { model: Sede, attributes: ['nombre'] },
                {
                    model: DetalleComida,
                    include: [
                        { model: Comida, attributes: ['nombre'] },
                        { model: Categoria, attributes: ['nombre'] }
                    ]
                }
            ],
            order: [['fecha', 'DESC']]
        });
        res.json(juntadas);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving juntadas', error });
    }
};

export const getJuntadaById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const juntada = await Juntada.findByPk(id, {
            include: [
                { model: Sede },
                {
                    model: DetalleComida,
                    include: [
                        { model: Comida },
                        { model: Categoria }
                    ]
                },
                {
                    model: Asistencia,
                    include: [{ model: Persona, attributes: ['nombre', 'apodo'] }]
                }
            ]
        });

        if (!juntada) {
            res.status(404).json({ message: 'Juntada not found' });
            return;
        }

        res.json(juntada);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving juntada', error });
    }
};

export const createJuntada = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    try {
        const { fecha, idSede, asistencias, detalles } = req.body;
        // Multer saves the file to req.file
        const fotoJuntada = req.file ? `/uploads/${req.file.filename}` : null;

        const newJuntada = await Juntada.create({
            fecha,
            idSede,
            fotoJuntada
        }, { transaction: t });

        // Handle Details (Comidas + Categorias)
        let parsedDetalles = detalles;
        if (typeof detalles === 'string') {
            try {
                parsedDetalles = JSON.parse(detalles);
            } catch (e) {
                console.error("Error parsing detalles JSON", e);
                parsedDetalles = [];
            }
        }

        if (parsedDetalles && Array.isArray(parsedDetalles)) {
            const detalleRecords = parsedDetalles.map((d: any) => ({
                idJuntada: newJuntada.id,
                idComida: d.idComida,
                idCategoria: d.idCategoria
            }));
            await DetalleComida.bulkCreate(detalleRecords, { transaction: t });
        }

        // Handle Asistencias
        let parsedAsistencias = asistencias;
        if (typeof asistencias === 'string') {
            try {
                parsedAsistencias = JSON.parse(asistencias);
            } catch (e) {
                console.error("Error parsing asistencias JSON", e);
                parsedAsistencias = [];
            }
        }

        if (parsedAsistencias && Array.isArray(parsedAsistencias)) {
            const asistenciaRecords = parsedAsistencias.map((a: any) => ({
                ...a,
                idJuntada: newJuntada.id
            }));
            await Asistencia.bulkCreate(asistenciaRecords, { transaction: t });
        }

        await t.commit();
        res.status(201).json(newJuntada);
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error creating juntada', error });
    }
};

export const deleteJuntada = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updated] = await Juntada.update({ isDeleted: true }, { where: { id } });
        if (updated) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Juntada not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting juntada', error });
    }
};

export const updateJuntada = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { fecha, idSede, asistencias, detalles } = req.body;
        const fotoJuntada = req.file ? `/uploads/${req.file.filename}` : undefined;

        const juntada = await Juntada.findByPk(id);
        if (!juntada) {
            await t.rollback();
            res.status(404).json({ message: 'Juntada not found' });
            return;
        }

        await juntada.update({
            fecha,
            idSede,
            ...(fotoJuntada && { fotoJuntada })
        }, { transaction: t });

        // Update Detalles
        let parsedDetalles = detalles;
        if (typeof detalles === 'string') {
            try {
                parsedDetalles = JSON.parse(detalles);
            } catch (e) {
                console.error("Error parsing detalles JSON", e);
                parsedDetalles = [];
            }
        }

        if (parsedDetalles && Array.isArray(parsedDetalles)) {
            await DetalleComida.destroy({ where: { idJuntada: id }, transaction: t });
            const detalleRecords = parsedDetalles.map((d: any) => ({
                idJuntada: id,
                idComida: d.idComida,
                idCategoria: d.idCategoria
            }));
            await DetalleComida.bulkCreate(detalleRecords, { transaction: t });
        }

        // Update Asistencias
        let parsedAsistencias = asistencias;
        if (typeof asistencias === 'string') {
            try {
                parsedAsistencias = JSON.parse(asistencias);
            } catch (e) {
                console.error("Error parsing asistencias JSON", e);
                parsedAsistencias = [];
            }
        }

        if (parsedAsistencias && Array.isArray(parsedAsistencias)) {
            await Asistencia.destroy({ where: { idJuntada: id }, transaction: t });
            const asistenciaRecords = parsedAsistencias.map((a: any) => ({
                ...a,
                idJuntada: id
            }));
            await Asistencia.bulkCreate(asistenciaRecords, { transaction: t });
        }

        await t.commit();
        res.status(200).json(juntada);

    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error updating juntada', error });
    }
};
