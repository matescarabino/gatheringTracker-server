
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables manually since we are outside app context
dotenv.config({ path: path.join(__dirname, '../../.env') });

import sequelize from '../config/database';
import { Juntada } from '../models';
import { optimizeBase64Image } from '../utils/imageOptimizer';
import { Op } from 'sequelize';

const optimizeAll = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Fetch all juntadas with images
        const juntadas = await Juntada.findAll({
            where: {
                fotoJuntada: {
                    [Op.not]: null
                }
            }
        });

        console.log(`Found ${juntadas.length} juntadas with images.`);

        for (const juntada of juntadas) {
            if (juntada.fotoJuntada && juntada.fotoJuntada.length > 100000) { // Optimize if > 100KB (Approx 75KB binary)
                console.log(`Optimizing image for Juntada ${juntada.id} (Size: ${(juntada.fotoJuntada.length / 1024 / 1024).toFixed(2)} MB)...`);

                try {
                    const optimized = await optimizeBase64Image(juntada.fotoJuntada);
                    // Check if actually got smaller
                    if (optimized.length < juntada.fotoJuntada.length) {
                        juntada.fotoJuntada = optimized;
                        await juntada.save();
                        console.log(`-> Optimization complete. New Size: ${(optimized.length / 1024).toFixed(2)} KB`);
                    } else {
                        console.log('-> Optimization did not reduce size. Skipping.');
                    }
                } catch (err) {
                    console.error(`-> Failed to optimize Juntada ${juntada.id}`, err);
                }
            } else {
                console.log(`Skipping Juntada ${juntada.id} (Small or empty)`);
            }
        }

        console.log('All done.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

optimizeAll();
