/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { Juntada, Sede, Comida, Asistencia, Persona, DetalleComida } from '../models';
import sequelize from '../config/database';

export const getJuntadas = async (req: Request, res: Response) => {
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

        // Sorting
        const sortField = (req.query.sortField as string) || 'fecha';
        const sortOrder = (req.query.sortOrder as string) === 'ASC' ? 'ASC' : 'DESC';

        const { count, rows } = await Juntada.findAndCountAll({
            where: { isDeleted: false, grupoId },
            include: [
                {
                    model: Sede,
                    include: [{ model: Persona, as: 'Dueño', attributes: ['nombre', 'apodo'] }]
                },
                {
                    model: DetalleComida,
                    include: [
                        { model: Comida, attributes: ['nombre', 'tipo'] }
                    ]
                },
                {
                    model: Asistencia,
                    include: [{ model: Persona, attributes: ['nombre', 'apodo'] }]
                }
            ],
            order: [[sortField, sortOrder]],
            limit,
            offset,
            distinct: true // Important for correct count with includes
        });

        const juntadasWithCount = rows.map(j => {
            const plainJuntada = j.get({ plain: true });
            const asistenciaList = plainJuntada.Asistencia || plainJuntada.Asistencias || [];
            return {
                ...plainJuntada,
                cantAsistentes: asistenciaList.length
            };
        });

        res.json({
            data: juntadasWithCount,
            meta: {
                total: count,
                page,
                limit: limit || count, // if no limit, effective limit is total (or just say count)
                totalPages: limit ? Math.ceil(count / limit) : 1
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving juntadas', error });
    }
};

export const getJuntadaById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        const juntada = await Juntada.findOne({
            where: { id, grupoId },
            include: [
                {
                    model: Sede,
                    include: [{ model: Persona, as: 'Dueño', attributes: ['nombre', 'apodo'] }]
                },
                {
                    model: DetalleComida,
                    include: [
                        { model: Comida }
                    ]
                },
                {
                    model: Asistencia,
                    include: [{ model: Persona, attributes: ['nombre', 'apodo'] }]
                }
            ]
        });

        if (!juntada) {
            res.status(404).json({ message: 'Juntada not found or access denied' });
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
        const { fecha, idSede, asistencias, detalles, fotoJuntada } = req.body;
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        const newJuntada = await Juntada.create({
            fecha,
            idSede,
            fotoJuntada,
            grupoId
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
                categoria: d.categoria // Now string
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
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        const [updated] = await Juntada.update(
            { isDeleted: true },
            { where: { id, grupoId } }
        );

        if (updated) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Juntada not found or access denied' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting juntada', error });
    }
};

export const updateJuntada = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { fecha, idSede, asistencias, detalles, fotoJuntada } = req.body;
        const { grupoId } = req;
        if (!grupoId) {
            await t.rollback();
            return res.status(400).json({ error: 'Group context required' });
        }

        const juntada = await Juntada.findOne({ where: { id, grupoId } });

        if (!juntada) {
            await t.rollback();
            res.status(404).json({ message: 'Juntada not found or access denied' });
            return;
        }

        await juntada.update({
            fecha,
            idSede,
            fotoJuntada
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
                categoria: d.categoria // Now string
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
