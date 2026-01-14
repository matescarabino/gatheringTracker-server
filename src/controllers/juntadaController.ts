import { Request, Response } from 'express';
import { optimizeBase64Image } from '../utils/imageOptimizer';
import { Juntada, Sede, Persona, Comida, Asistencia, DetalleComida } from '../models';
import sequelize from '../config/database';

export const getJuntadas = async (req: Request, res: Response) => {
    const requestId = Date.now() + Math.random().toString(36).substring(7);
    console.time(`getJuntadas_Total_${requestId}`);
    try {
        const { grupoId } = req;
        if (!grupoId) return res.status(400).json({ error: 'Group context required' });

        const sortField = (req.query.sortField as string) || 'fecha';
        // Default to DESC (newest first) unless ASC is requested
        const sortOrder = (req.query.sortOrder as string) === 'ASC' ? 'ASC' : 'DESC';

        // 1. Fetch Juntadas (Split Query Part 1) - Only Base + Sede
        console.time(`fetch_Juntadas_${requestId}`);
        const juntadas = await Juntada.findAll({
            where: { isDeleted: false, grupoId },
            include: [
                {
                    model: Sede,
                    include: [{ model: Persona, as: 'Dueño', attributes: ['nombre', 'apodo'] }]
                }
            ],
            order: [[sortField, sortOrder]],
            raw: true,
            nest: true
        });
        console.timeEnd(`fetch_Juntadas_${requestId}`);

        if (juntadas.length === 0) {
            console.timeEnd(`getJuntadas_Total_${requestId}`);
            return res.json([]);
        }

        // Type assertion for raw result if needed, or just usage
        const juntadaIds = juntadas.map((j: any) => j.id);

        /**
         * Server-side Aggregation (Split Query Pattern)
         * Instead of massive JOINs which cause Cartesian products or slow queries,
         * we fetch related data in separate efficient queries and merge them in application memory.
         * Using raw: true avoids expensive Sequelize Model hydration.
         */

        // 2. Fetch Detalles (Split Query Part 2)
        console.time(`fetch_Detalles_${requestId}`);
        const detalles = await DetalleComida.findAll({
            where: { idJuntada: juntadaIds },
            include: [
                { model: Comida, attributes: ['nombre', 'tipo'] }
            ],
            raw: true,
            nest: true
        });
        console.timeEnd(`fetch_Detalles_${requestId}`);

        // 3. Fetch Asistencias (Split Query Part 3)
        console.time(`fetch_Asistencias_${requestId}`);
        const asistencias = await Asistencia.findAll({
            where: { idJuntada: juntadaIds },
            include: [
                { model: Persona, attributes: ['id', 'nombre', 'apodo'] }
            ],
            raw: true,
            nest: true
        });
        console.timeEnd(`fetch_Asistencias_${requestId}`);

        // 4. Assemble Data (Server-side merging)
        console.time(`assemble_Data_${requestId}`);
        const detallesMap: Record<number, any[]> = {};
        detalles.forEach((d: any) => {
            if (!detallesMap[d.idJuntada]) detallesMap[d.idJuntada] = [];
            detallesMap[d.idJuntada].push(d);
        });

        const asistenciasMap: Record<number, any[]> = {};
        asistencias.forEach((a: any) => {
            if (!asistenciasMap[a.idJuntada]) asistenciasMap[a.idJuntada] = [];
            asistenciasMap[a.idJuntada].push(a);
        });

        const fullJuntadas = juntadas.map((j: any) => {
            // Raw objects don't need .get({plain: true})
            return {
                ...j,
                DetallesComidas: detallesMap[j.id] || [],
                Asistencias: asistenciasMap[j.id] || [],
                cantAsistentes: (asistenciasMap[j.id] || []).length
            };
        });
        console.timeEnd(`assemble_Data_${requestId}`);

        console.timeEnd(`getJuntadas_Total_${requestId}`);
        // Return full array (No backend pagination)
        res.json(fullJuntadas);
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

        // Optimize Image
        let optimizedFoto = fotoJuntada;
        if (fotoJuntada) {
            optimizedFoto = await optimizeBase64Image(fotoJuntada);
        }

        const newJuntada = await Juntada.create({
            fecha,
            idSede,
            fotoJuntada: optimizedFoto,
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

        // Optimize Image
        let optimizedFoto = fotoJuntada;
        if (fotoJuntada) {
            optimizedFoto = await optimizeBase64Image(fotoJuntada);
        }

        await juntada.update({
            fecha,
            idSede,
            fotoJuntada: optimizedFoto
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
