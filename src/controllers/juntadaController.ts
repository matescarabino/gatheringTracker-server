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

        const sortField = (req.query.sortField as string) || 'fecha';
        const sortOrder = (req.query.sortOrder as string) === 'ASC' ? 'ASC' : 'DESC';

        const { count, rows } = await Juntada.findAndCountAll({
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM "Asistencias" AS "attendance"
                            WHERE "attendance"."idJuntada" = "Juntada"."id"
                        )`),
                        'cantAsistentes'
                    ]
                ]
            },
            where: { isDeleted: false, grupoId },
            include: [
                {
                    model: Sede,
                    include: [{ model: Persona, as: 'Dueño', attributes: ['nombre', 'apodo'] }]
                },
                {
                    model: DetalleComida,
                    as: 'DetallesComidas',
                    include: [
                        { model: Comida, attributes: ['nombre', 'tipo'] }
                    ]
                }
            ],
            order: [[sortField, sortOrder]],
            limit,
            offset,
            distinct: true
        });

        const juntadasWithCount = rows.map(j => {
            const plainJuntada = j.get({ plain: true });
            return {
                ...plainJuntada,
                // Ensure cantAsistentes is a number (sequelize.literal might return string)
                cantAsistentes: parseInt(plainJuntada.cantAsistentes as any || '0')
            };
        });

        res.json({
            data: juntadasWithCount,
            meta: {
                total: count,
                page,
                limit: limit || count,
                totalPages: limit ? Math.ceil(count / limit) : 1
            }
        });
    } catch (error) {
        console.error('Error getting juntadas:', error);
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
                    as: 'DetallesComidas',
                    include: [
                        { model: Comida }
                    ]
                },
                {
                    model: Asistencia,
                    as: 'Asistencias',
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
                await t.rollback();
                return res.status(400).json({ error: 'Invalid JSON format for detalles' });
            }
        }

        if (parsedDetalles) {
            if (!Array.isArray(parsedDetalles)) {
                await t.rollback();
                return res.status(400).json({ error: 'detalles must be an array' });
            }
            const detalleRecords = parsedDetalles.map((d: any) => {
                if (!d.idComida) throw new Error('Missing idComida in detalles');
                return {
                    idJuntada: newJuntada.id,
                    idComida: d.idComida,
                    categoria: d.categoria
                };
            });
            await DetalleComida.bulkCreate(detalleRecords, { transaction: t });
        }

        // Handle Asistencias
        let parsedAsistencias = asistencias;
        if (typeof asistencias === 'string') {
            try {
                parsedAsistencias = JSON.parse(asistencias);
            } catch (e) {
                await t.rollback();
                return res.status(400).json({ error: 'Invalid JSON format for asistencias' });
            }
        }

        if (parsedAsistencias) {
            if (!Array.isArray(parsedAsistencias)) {
                await t.rollback();
                return res.status(400).json({ error: 'asistencias must be an array' });
            }
            const asistenciaRecords = parsedAsistencias.map((a: any) => {
                if (!a.idPersona) throw new Error('Missing idPersona in asistencias');
                return {
                    ...a,
                    idJuntada: newJuntada.id
                };
            });
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
                await t.rollback();
                return res.status(400).json({ error: 'Invalid JSON format for detalles' });
            }
        }

        if (parsedDetalles) {
            if (!Array.isArray(parsedDetalles)) {
                await t.rollback();
                return res.status(400).json({ error: 'detalles must be an array' });
            }
            await DetalleComida.destroy({ where: { idJuntada: id }, transaction: t });
            const detalleRecords = parsedDetalles.map((d: any) => {
                if (!d.idComida) throw new Error('Missing idComida in detalles');
                return {
                    idJuntada: id,
                    idComida: d.idComida,
                    categoria: d.categoria
                };
            });
            await DetalleComida.bulkCreate(detalleRecords, { transaction: t });
        }

        // Update Asistencias
        let parsedAsistencias = asistencias;
        if (typeof asistencias === 'string') {
            try {
                parsedAsistencias = JSON.parse(asistencias);
            } catch (e) {
                await t.rollback();
                return res.status(400).json({ error: 'Invalid JSON format for asistencias' });
            }
        }

        if (parsedAsistencias) {
            if (!Array.isArray(parsedAsistencias)) {
                await t.rollback();
                return res.status(400).json({ error: 'asistencias must be an array' });
            }
            await Asistencia.destroy({ where: { idJuntada: id }, transaction: t });
            const asistenciaRecords = parsedAsistencias.map((a: any) => {
                if (!a.idPersona) throw new Error('Missing idPersona in asistencias');
                return {
                    ...a,
                    idJuntada: id
                };
            });
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

export const getStatistics = async (req: Request, res: Response) => {
    try {
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        // 1. Fetch Juntadas (Base)
        const juntadas = await Juntada.findAll({
            where: { isDeleted: false, grupoId },
            include: [
                {
                    model: Sede,
                    attributes: ['id', 'idPersona', 'nombre']
                }
            ],
            order: [['fecha', 'ASC']]
        });

        if (juntadas.length === 0) {
            return res.json([]);
        }

        const juntadaIds = juntadas.map(j => j.id);

        // 2. Fetch Detalles (Separate Query)
        const detalles = await DetalleComida.findAll({
            where: { idJuntada: juntadaIds },
            include: [
                { model: Comida, attributes: ['nombre', 'tipo'] }
            ]
        });

        // 3. Fetch Asistencias (Separate Query)
        const asistencias = await Asistencia.findAll({
            where: { idJuntada: juntadaIds },
            include: [
                { model: Persona, attributes: ['id', 'nombre', 'apodo'] }
            ]
        });

        // 4. Assemble Data
        // Create lookup maps for performance
        const detallesMap: Record<number, any[]> = {};
        detalles.forEach(d => {
            if (!detallesMap[d.idJuntada]) detallesMap[d.idJuntada] = [];
            detallesMap[d.idJuntada].push(d);
        });

        const asistenciasMap: Record<number, any[]> = {};
        asistencias.forEach(a => {
            if (!asistenciasMap[a.idJuntada]) asistenciasMap[a.idJuntada] = [];
            asistenciasMap[a.idJuntada].push(a);
        });

        // Merge back into plain objects
        const fullJuntadas = juntadas.map(j => {
            const plainJuntada = j.get({ plain: true });
            return {
                ...plainJuntada,
                DetallesComidas: detallesMap[j.id] || [],
                Asistencias: asistenciasMap[j.id] || []
            };
        });

        res.json(fullJuntadas);
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
};
