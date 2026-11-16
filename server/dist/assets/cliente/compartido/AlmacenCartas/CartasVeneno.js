"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARTAS_VENENO = void 0;
exports.CARTAS_VENENO = [
    {
        id: "golpe_veneno",
        nombre: "Golpe",
        costo: 1,
        sprite: "golpe_veneno",
        clase: "veneno",
        descripcion: "Inflige 6 de daño.",
        enPoolRecompensa: false,
        objetivoSeleccion: "ENEMIGO",
        tipo: "ATAQUE",
        efectos: [
            { tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" }
        ]
    },
    {
        id: "defender_veneno",
        nombre: "Defender",
        costo: 1,
        descripcion: "Gana 5 de bloqueo.",
        clase: "veneno",
        sprite: "defender_veneno",
        enPoolRecompensa: false,
        tipo: "HABILIDAD",
        efectos: [
            { tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" }
        ]
    },
];
