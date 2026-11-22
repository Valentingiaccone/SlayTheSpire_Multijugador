"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATALOGO_CARTAS = void 0;
exports.puedeMejorarseCarta = puedeMejorarseCarta;
exports.obtenerCartaMejorada = obtenerCartaMejorada;
exports.obtenerPrecioCarta = obtenerPrecioCarta;
exports.obtenerMazoInicial = obtenerMazoInicial;
exports.generarOpcionesRecompensa = generarOpcionesRecompensa;
const CartasCombate_1 = require("./AlmacenCartas/CartasCombate");
const CartasVeneno_1 = require("./AlmacenCartas/CartasVeneno");
const GameTypes_1 = require("./GameTypes");
const TODAS_LAS_CARTAS_BASE = [
    ...CartasCombate_1.CARTAS_COMBATE,
    ...CartasVeneno_1.CARTAS_VENENO
];
exports.CATALOGO_CARTAS = {};
for (const base of TODAS_LAS_CARTAS_BASE) {
    if (exports.CATALOGO_CARTAS[base.id]) {
        console.error(`[Cartas] ¡ID duplicado detectado!: "${base.id}"`);
    }
    const tieneMejora = Boolean(base.mejora);
    const idMejorada = tieneMejora ? `${base.id}+` : undefined;
    const cartaNormal = {
        ...base,
        precioTienda: base.precioTienda ?? 55,
        esMejorada: false,
        idMejora: idMejorada,
        idBase: base.id
    };
    exports.CATALOGO_CARTAS[cartaNormal.id] = cartaNormal;
    if (base.mejora && idMejorada) {
        const cartaMejorada = {
            ...base,
            id: idMejorada,
            nombre: base.mejora.nombre || `${base.nombre}+`,
            costo: base.mejora.costo ?? base.costo,
            descripcion: base.mejora.descripcion,
            efectos: base.mejora.efectos,
            enPoolRecompensa: false,
            precioTienda: Math.floor((base.precioTienda ?? 55) * 1.5),
            esMejorada: true,
            idMejora: undefined,
            idBase: base.id,
            mejora: undefined
        };
        exports.CATALOGO_CARTAS[cartaMejorada.id] = cartaMejorada;
    }
}
function puedeMejorarseCarta(cartaId) {
    const data = exports.CATALOGO_CARTAS[cartaId];
    return Boolean(data && !data.esMejorada && data.idMejora && exports.CATALOGO_CARTAS[data.idMejora]);
}
function obtenerCartaMejorada(cartaId) {
    const data = exports.CATALOGO_CARTAS[cartaId];
    if (!data || !data.idMejora)
        return undefined;
    return exports.CATALOGO_CARTAS[data.idMejora];
}
function obtenerPrecioCarta(cartaId) {
    return exports.CATALOGO_CARTAS[cartaId]?.precioTienda ?? 55;
}
function obtenerMazoInicial(personajeId) {
    const info = GameTypes_1.PERSONAJES_INFO[personajeId];
    return info ? [...info.mazoInicial] : [];
}
function generarOpcionesRecompensa(personajeId, cantidad = 3) {
    const infoPersonaje = GameTypes_1.PERSONAJES_INFO[personajeId];
    const clasesPermitidas = infoPersonaje ? [...infoPersonaje.clases] : ["combate"];
    const pool = Object.values(exports.CATALOGO_CARTAS)
        .filter((carta) => carta.enPoolRecompensa !== false &&
        !carta.esMejorada &&
        clasesPermitidas.includes(carta.clase))
        .map((carta) => carta.id);
    const elegidas = [];
    while (elegidas.length < cantidad && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        elegidas.push(pool.splice(idx, 1)[0]);
    }
    return elegidas;
}
