"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELIQUIAS_ASESINO = void 0;
exports.RELIQUIAS_ASESINO = [
    {
        id: "dinamita",
        nombre: "Dinamita",
        descripcion: "Cada 3 cartas que juegues en un mismo turno, inflige 5 de daño a todos los enemigos.",
        icono: "reliquia_dinamita",
        clase: "asesino",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_JUGAR_CARTA",
        contadorConfig: { modo: "ACUMULAR_CARTAS", meta: 3, reiniciarCadaTurno: true },
        efectos: [{ tipo: "DANIO", valor: 5, objetivo: "TODOS_ENEMIGOS", fuente: "RELIQUIA" }]
    },
    {
        id: "kunai",
        nombre: "Kunai",
        descripcion: "Cuando jugás 3 Ataques en un mismo turno, ganás 1 de Destreza.",
        icono: "reliquia_kunai",
        clase: "asesino",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_JUGAR_CARTA",
        contadorConfig: {
            modo: "ACUMULAR_CARTAS",
            meta: 3,
            filtroTipoCarta: "ATAQUE",
            reiniciarCadaTurno: true
        },
        efectos: [{ tipo: "APLICAR_ESTADO", estadoId: "DESTREZA", valor: 1, objetivo: "PROPIO" }]
    },
    {
        id: "shuriken",
        nombre: "Shuriken",
        descripcion: "Cuando jugás 3 Ataques en un mismo turno, ganás 1 de Fuerza.",
        icono: "reliquia_shuriken",
        clase: "asesino",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_JUGAR_CARTA",
        contadorConfig: {
            modo: "ACUMULAR_CARTAS",
            meta: 3,
            filtroTipoCarta: "ATAQUE",
            reiniciarCadaTurno: true
        },
        efectos: [{ tipo: "APLICAR_ESTADO", estadoId: "FUERZA", valor: 1, objetivo: "PROPIO" }]
    }
];
