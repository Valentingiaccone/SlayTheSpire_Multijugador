"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARTAS_MALDICION = void 0;
exports.CARTAS_MALDICION = [
    {
        id: "maldicion_herida",
        nombre: "Herida",
        costo: 0,
        sprite: "carta_vacia",
        clase: "maldicion",
        descripcion: "Injugable.",
        enPoolRecompensa: false,
        tipo: "MALDICION",
        injugable: true,
        efectos: []
    },
    {
        id: "maldicion_torpeza",
        nombre: "Torpeza",
        costo: 0,
        sprite: "carta_vacia",
        clase: "maldicion",
        descripcion: "Injugable. Etérea (si está en tu mano al terminar el turno, se agota).",
        enPoolRecompensa: false,
        tipo: "MALDICION",
        injugable: true,
        eterea: true,
        efectos: []
    },
    {
        id: "maldicion_decaimiento",
        nombre: "Decaimiento",
        costo: 0,
        sprite: "carta_vacia",
        clase: "maldicion",
        descripcion: "Injugable. Al final de tu turno en la mano, recibís 2 de daño.",
        enPoolRecompensa: false,
        tipo: "MALDICION",
        injugable: true,
        efectos: [],
        efectosFinTurnoEnMano: [
            { tipo: "DANIO", valor: 2, objetivo: "PROPIO", fuente: "EFECTO_DIRECTO" }
        ]
    },
    {
        id: "maldicion_duda",
        nombre: "Duda",
        costo: 0,
        sprite: "carta_vacia",
        clase: "maldicion",
        descripcion: "Injugable. Al final de tu turno en la mano, recibís 1 de Débil.",
        enPoolRecompensa: false,
        tipo: "MALDICION",
        injugable: true,
        efectos: [],
        efectosFinTurnoEnMano: [
            { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 1, objetivo: "PROPIO" }
        ]
    }
];
