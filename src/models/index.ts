import Sede from './Sede';
import Categoria from './Categoria';
import Comida from './Comida';
import Persona from './Persona';
import Juntada from './Juntada';
import Asistencia from './Asistencia';
import DetalleComida from './DetalleComida';

// Relaciones

// Comida - Categoria (Legacy or implied? Removed direct FK use in Juntada context, 
// but Comida might still have idCategoria as default category?)
// Let's keep existing if valid, but Juntada uses DetalleComida now.
Categoria.hasMany(Comida, { foreignKey: 'idCategoria' });
Comida.belongsTo(Categoria, { foreignKey: 'idCategoria' });

// Juntada - Sede
Sede.hasMany(Juntada, { foreignKey: 'idSede' });
Juntada.belongsTo(Sede, { foreignKey: 'idSede' });

// Sede - Persona (Dueño)
Persona.hasMany(Sede, { foreignKey: 'idPersona', as: 'Sedes' });
Sede.belongsTo(Persona, { foreignKey: 'idPersona', as: 'Dueño' });

// Juntada - Comida (Via DetalleComida)
Juntada.hasMany(DetalleComida, { foreignKey: 'idJuntada' });
DetalleComida.belongsTo(Juntada, { foreignKey: 'idJuntada' });

DetalleComida.belongsTo(Comida, { foreignKey: 'idComida' });
DetalleComida.belongsTo(Categoria, { foreignKey: 'idCategoria', as: 'Categoria' });

// Asistencia
Juntada.hasMany(Asistencia, { foreignKey: 'idJuntada' });
Asistencia.belongsTo(Juntada, { foreignKey: 'idJuntada' });

Persona.hasMany(Asistencia, { foreignKey: 'idPersona' });
Asistencia.belongsTo(Persona, { foreignKey: 'idPersona' });

export {
    Sede,
    Categoria,
    Comida,
    Persona,
    Juntada,
    Asistencia,
    DetalleComida
};
