"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATALOGO_RELIQUIAS = exports.PROBABILIDADES_RELIQUIA = exports.PRECIOS_RELIQUIA_POR_CALIDAD = void 0;
exports.obtenerPrecioReliquia = obtenerPrecioReliquia;
exports.obtenerReliquiasRecompensa = obtenerReliquiasRecompensa;
const GameTypes_1 = require("./GameTypes");
const ReliquiasIniciales_1 = require("./AlmacenReliquias/ReliquiasIniciales");
const ReliquiasNeutrales_1 = require("./AlmacenReliquias/ReliquiasNeutrales");
const ReliquiasLadron_1 = require("./AlmacenReliquias/ReliquiasLadron");
const ReliquiasCombate_1 = require("./AlmacenReliquias/ReliquiasCombate");
const ReliquiasAsesino_1 = require("./AlmacenReliquias/ReliquiasAsesino");
// ================= VARIABLES EDITABLES DE RAREZAS Y PRECIOS =================
exports.PRECIOS_RELIQUIA_POR_CALIDAD = {
    INICIAL: 150,
    COMUN: 135,
    EPICA: 210,
    LEGENDARIA: 300,
    ESPECIAL: 250
};
exports.PROBABILIDADES_RELIQUIA = {
    ELITE: { COMUN: 70, EPICA: 25, LEGENDARIA: 5 },
    COFRE: { COMUN: 70, EPICA: 25, LEGENDARIA: 5 },
    TIENDA: { COMUN: 70, EPICA: 25, LEGENDARIA: 5 },
    EVENTO: { COMUN: 70, EPICA: 25, LEGENDARIA: 5 },
    JEFE: { COMUN: 0, EPICA: 65, LEGENDARIA: 35 }
};
const TODAS_LAS_RELIQUIAS = [
    ...ReliquiasIniciales_1.RELIQUIAS_INICIALES,
    ...ReliquiasNeutrales_1.RELIQUIAS_NEUTRALES,
    ...ReliquiasLadron_1.RELIQUIAS_LADRON,
    ...ReliquiasCombate_1.RELIQUIAS_COMBATE,
    ...ReliquiasAsesino_1.RELIQUIAS_ASESINO
];
exports.CATALOGO_RELIQUIAS = {};
for (const rel of TODAS_LAS_RELIQUIAS) {
    if (exports.CATALOGO_RELIQUIAS[rel.id]) {
        console.error(`[Reliquias] ¡ID duplicado detectado!: "${rel.id}"`);
    }
    exports.CATALOGO_RELIQUIAS[rel.id] = {
        ...rel,
        precioTienda: rel.precioTienda ?? exports.PRECIOS_RELIQUIA_POR_CALIDAD[rel.calidad]
    };
}
function obtenerPrecioReliquia(reliquiaId) {
    const data = exports.CATALOGO_RELIQUIAS[reliquiaId];
    if (!data)
        return exports.PRECIOS_RELIQUIA_POR_CALIDAD.COMUN;
    return data.precioTienda ?? exports.PRECIOS_RELIQUIA_POR_CALIDAD[data.calidad];
}
function sortearCalidadReliquia(contexto) {
    const probs = exports.PROBABILIDADES_RELIQUIA[contexto] || exports.PROBABILIDADES_RELIQUIA.ELITE;
    const total = probs.COMUN + probs.EPICA + probs.LEGENDARIA;
    const tirada = Math.random() * Math.max(1, total);
    if (tirada < probs.LEGENDARIA)
        return "LEGENDARIA";
    if (tirada < probs.LEGENDARIA + probs.EPICA)
        return "EPICA";
    return "COMUN";
}
function obtenerReliquiasRecompensa(jugadoresMap, cantidad, personajeFiltro, contexto = "ELITE", forzarCalidad, excluirIdsExtras) {
    const yaObtenidas = new Set(excluirIdsExtras ? Array.from(excluirIdsExtras) : []);
    const clasesValidas = new Set(["neutral"]);
    if (personajeFiltro && GameTypes_1.PERSONAJES_INFO[personajeFiltro]) {
        GameTypes_1.PERSONAJES_INFO[personajeFiltro].clases.forEach((c) => clasesValidas.add(c));
    }
    else {
        jugadoresMap.forEach((j) => {
            const info = GameTypes_1.PERSONAJES_INFO[j.personajeId];
            info?.clases.forEach((c) => clasesValidas.add(c));
        });
    }
    jugadoresMap.forEach((j) => {
        if (j.reliquias) {
            for (const rId of j.reliquias)
                yaObtenidas.add(rId);
        }
        if (j.reliquiaRecompensa) {
            yaObtenidas.add(j.reliquiaRecompensa);
        }
    });
    const candidatasPool = Object.values(exports.CATALOGO_RELIQUIAS).filter((r) => r.enPoolRecompensa && clasesValidas.has(r.clase));
    const resultado = [];
    for (let i = 0; i < cantidad; i++) {
        const calidadBuscada = forzarCalidad || sortearCalidadReliquia(contexto);
        // 1. Calidad buscada, sin repetir
        let pool = candidatasPool.filter((r) => r.calidad === calidadBuscada && !yaObtenidas.has(r.id));
        // 2. Cualquier calidad válida, sin repetir
        if (pool.length === 0) {
            pool = candidatasPool.filter((r) => !yaObtenidas.has(r.id));
        }
        // 3. Fallback: misma calidad aunque repetida
        if (pool.length === 0) {
            pool = candidatasPool.filter((r) => r.calidad === calidadBuscada);
        }
        // 4. Fallback total
        if (pool.length === 0) {
            pool = candidatasPool;
        }
        if (pool.length === 0)
            break;
        const elegida = pool[Math.floor(Math.random() * pool.length)];
        resultado.push(elegida.id);
        yaObtenidas.add(elegida.id);
    }
    return resultado;
}
