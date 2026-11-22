"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELIQUIAS_COMBATE = void 0;
exports.RELIQUIAS_COMBATE = [
    {
        id: "sangre_vengativa",
        nombre: "Sangre Vengativa",
        descripcion: "Cada vez que perdés HP por un ataque enemigo, ganás +1 de Fuerza.",
        icono: "reliquia_sangre_vengativa",
        clase: "combate",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_RECIBIR_DANIO",
        condicion: { tipo: "DANIO_RECIBIDO_MAYOR_A", minimo: 0 },
        efectos: [{ tipo: "APLICAR_ESTADO", valor: 1, objetivo: "PROPIO", estadoId: "FUERZA" }]
    },
    {
        id: "mini_bomba",
        nombre: "Mini bomba",
        descripcion: "Al inicio de tu turno, hace 3 de daño a todos los enemigos.",
        icono: "reliquia_mini_bomba",
        clase: "combate",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        efectos: [{ tipo: "DANIO", valor: 3, objetivo: "TODOS_ENEMIGOS", fuente: "RELIQUIA" }]
    }
];
