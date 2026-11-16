"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POOL_ENCUENTROS_JEFES = exports.POOL_ENCUENTROS_NORMALES = exports.ENEMIGOS_INFO = void 0;
exports.obtenerEncuentroAleatorio = obtenerEncuentroAleatorio;
exports.ENEMIGOS_INFO = {
    slime_acido: {
        id: "slime_acido",
        nombre: "Slime Ácido",
        hpBase: 32,
        patron: [
            { tipo: "ATACAR", valor: 8 },
            { tipo: "BLOQUEAR", valor: 6 },
            { tipo: "ATACAR", valor: 12 }
        ]
    },
    cultista: {
        id: "cultista",
        nombre: "Cultista Oscuro",
        hpBase: 40,
        patron: [
            { tipo: "ATACAR", valor: 6 },
            { tipo: "ATACAR", valor: 10 },
            { tipo: "ATACAR", valor: 14 }
        ]
    },
    guardian_antiguo: {
        id: "guardian_antiguo",
        nombre: "Guardián de Piedra (Jefe)",
        hpBase: 90,
        patron: [
            { tipo: "BLOQUEAR", valor: 12 },
            { tipo: "ATACAR", valor: 15 },
            { tipo: "ATACAR", valor: 20 }
        ]
    }
};
// Pool escalable de combates normales
exports.POOL_ENCUENTROS_NORMALES = [
    { id: "slimes_dobles", pisoMinimo: 1, enemigos: ["slime_acido", "slime_acido"] },
    { id: "cultista_solitario", pisoMinimo: 1, enemigos: ["cultista"] },
    { id: "cultista_y_slime", pisoMinimo: 2, enemigos: ["cultista", "slime_acido"] },
    { id: "doble_cultista", pisoMinimo: 3, enemigos: ["cultista", "cultista"] }
];
// Pool escalable de Jefes
exports.POOL_ENCUENTROS_JEFES = [
    { id: "jefe_guardian", pisoMinimo: 1, enemigos: ["guardian_antiguo"] }
];
function obtenerEncuentroAleatorio(esJefe, pisoActual) {
    const poolBase = esJefe ? exports.POOL_ENCUENTROS_JEFES : exports.POOL_ENCUENTROS_NORMALES;
    const candidatos = poolBase.filter((e) => pisoActual >= e.pisoMinimo);
    const listaFinal = candidatos.length > 0 ? candidatos : poolBase;
    const elegido = listaFinal[Math.floor(Math.random() * listaFinal.length)];
    return [...elegido.enemigos];
}
