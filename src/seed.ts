import sequelize from './config/database';
import { Sede, Comida, Persona } from './models';

const seed = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ force: false });

        // 1. Sedes
        await Sede.findOrCreate({ where: { nombre: 'Casa de Mateo' }, defaults: { nombre: 'Casa de Mateo', direccion: 'Calle Falsa 123' } });
        await Sede.findOrCreate({ where: { nombre: 'Quincho del Club' }, defaults: { nombre: 'Quincho del Club', direccion: 'Av. Libertador 1000' } });

        // 2. Personas
        await Persona.findOrCreate({ where: { nombre: 'Mateo' }, defaults: { nombre: 'Mateo', apodo: 'Matt' } });
        await Persona.findOrCreate({ where: { nombre: 'Juan' }, defaults: { nombre: 'Juan', apodo: 'Juancito' } });
        await Persona.findOrCreate({ where: { nombre: 'Pedro' }, defaults: { nombre: 'Pedro', apodo: 'Pepe' } });

        // 3. Comidas
        await Comida.findOrCreate({ where: { nombre: 'Asadazo Completo' }, defaults: { nombre: 'Asadazo Completo', tipo: 'Cocinado' } });
        await Comida.findOrCreate({ where: { nombre: 'Sorrentinos' }, defaults: { nombre: 'Sorrentinos', tipo: 'Cocinado' } });

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
