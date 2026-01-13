import Sede from './Sede';
import Comida from './Comida';
import Persona from './Persona';
import Juntada from './Juntada';
import Asistencia from './Asistencia';
import DetalleComida from './DetalleComida';
import Usuario from './Usuario';
import Grupo from './Grupo';

// Relaciones

// Usuario - Grupo
Usuario.hasMany(Grupo, { foreignKey: 'adminId' });
Grupo.belongsTo(Usuario, { foreignKey: 'adminId' });

// Grupo scopes (Tenancy)
const tenancyModels = [Juntada, Sede, Persona, Comida];

tenancyModels.forEach((Model: any) => {
    Grupo.hasMany(Model, { foreignKey: 'grupoId' });
    Model.belongsTo(Grupo, { foreignKey: 'grupoId' });
});

// Juntada - Sede
Sede.hasMany(Juntada, { foreignKey: 'idSede' });
Juntada.belongsTo(Sede, { foreignKey: 'idSede' });

// Sede - Persona (Dueño)
Persona.hasMany(Sede, { foreignKey: 'idPersona', as: 'Sedes' });
Sede.belongsTo(Persona, { foreignKey: 'idPersona', as: 'Dueño' });

// Juntada - Comida (Via DetalleComida)
Juntada.hasMany(DetalleComida, { foreignKey: 'idJuntada', as: 'DetallesComidas' });
DetalleComida.belongsTo(Juntada, { foreignKey: 'idJuntada' });

DetalleComida.belongsTo(Comida, { foreignKey: 'idComida' });

// Asistencia
Juntada.hasMany(Asistencia, { foreignKey: 'idJuntada', as: 'Asistencias' });
Asistencia.belongsTo(Juntada, { foreignKey: 'idJuntada' });

Persona.hasMany(Asistencia, { foreignKey: 'idPersona' });
Asistencia.belongsTo(Persona, { foreignKey: 'idPersona' });

export {
    Sede,
    Comida,
    Persona,
    Juntada,
    Asistencia,
    DetalleComida,
    Usuario,
    Grupo
};
