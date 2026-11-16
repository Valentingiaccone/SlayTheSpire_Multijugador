"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATALOGO_CARTAS = void 0;
exports.obtenerMazoInicial = obtenerMazoInicial;
exports.generarOpcionesRecompensa = generarOpcionesRecompensa;
const CartasCombate_1 = require("./AlmacenCartas/CartasCombate");
const CartasVeneno_1 = require("./AlmacenCartas/CartasVeneno");
const GameTypes_1 = require("./GameTypes");
const TODAS_LAS_CARTAS = [
    ...CartasCombate_1.CARTAS_COMBATE,
    ...CartasVeneno_1.CARTAS_VENENO
];
exports.CATALOGO_CARTAS = {};
for (const carta of TODAS_LAS_CARTAS) {
    if (exports.CATALOGO_CARTAS[carta.id]) {
        console.error(`[Cartas] ¡ID duplicado detectado!: "${carta.id}"`);
    }
    exports.CATALOGO_CARTAS[carta.id] = carta;
}
function obtenerMazoInicial(personajeId) {
    const info = GameTypes_1.PERSONAJES_INFO[personajeId];
    return info ? [...info.mazoInicial] : [];
}
function generarOpcionesRecompensa(personajeId, cantidad = 3) {
    const infoPersonaje = GameTypes_1.PERSONAJES_INFO[personajeId];
    const clasesPermitidas = infoPersonaje ? infoPersonaje.clases : ["NEUTRAL"];
    // Filtra automáticamente todas las cartas válidas para las clases del personaje
    const pool = Object.values(exports.CATALOGO_CARTAS)
        .filter((carta) => carta.enPoolRecompensa !== false &&
        clasesPermitidas.includes(carta.clase))
        .map((carta) => carta.id);
    const elegidas = [];
    while (elegidas.length < cantidad && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        elegidas.push(pool.splice(idx, 1)[0]);
    }
    return elegidas;
}
