"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGLAS_NODOS_MAPA = exports.CONFIG_MAPA = void 0;
exports.obtenerCantidadPisosMapa = obtenerCantidadPisosMapa;
exports.generarMapaRun = generarMapaRun;
exports.CONFIG_MAPA = {
    TOTAL_MAPAS: 3,
    PISOS_POR_MAPA: {
        1: 16,
        2: 15,
        3: 14
    },
    CANTIDAD_PISOS: 16,
    COLUMNAS: 5,
    MIN_HOJAS_INICIO: 3,
    MAX_HOJAS_INICIO: 4,
    SEGUNDOS_CUENTA_REGRESIVA: 3,
    PROBABILIDAD_INTERROGANTE_FALSO: 3
};
function obtenerCantidadPisosMapa(numeroMapa = 1) {
    return exports.CONFIG_MAPA.PISOS_POR_MAPA[numeroMapa] || exports.CONFIG_MAPA.CANTIDAD_PISOS;
}
exports.REGLAS_NODOS_MAPA = {
    EVENTO: { min: 4, max: 7, probabilidad: 35 },
    ELITE: { min: 3, max: 5, probabilidad: 25 },
    TIENDA: { min: 3, max: 5, probabilidad: 20 },
    COFRE: { min: 3, max: 4, probabilidad: 15 },
    HOGUERA: { min: 4, max: 5, probabilidad: 20 }
};
function generarMapaRun(numeroMapa = 1) {
    const totalPisos = Math.max(4, obtenerCantidadPisosMapa(numeroMapa));
    const totalCols = exports.CONFIG_MAPA.COLUMNAS;
    const mapaPorPiso = new Map();
    for (let p = 1; p <= totalPisos; p++) {
        mapaPorPiso.set(p, new Map());
    }
    // 1. Piso 1: Hojas iniciales (siempre COMBATE)
    const colsDisponibles = Array.from({ length: totalCols }, (_, i) => i);
    mezclarArray(colsDisponibles);
    const cantHojas = Math.min(totalCols, exports.CONFIG_MAPA.MIN_HOJAS_INICIO +
        Math.floor(Math.random() * (exports.CONFIG_MAPA.MAX_HOJAS_INICIO - exports.CONFIG_MAPA.MIN_HOJAS_INICIO + 1)));
    const colsPiso1 = colsDisponibles.slice(0, cantHojas).sort((a, b) => a - b);
    for (const col of colsPiso1) {
        mapaPorPiso.get(1).set(col, {
            id: `m${numeroMapa}_p1_c${col}`,
            piso: 1,
            columna: col,
            tipo: "COMBATE",
            estado: "DISPONIBLE",
            siguientesIds: []
        });
    }
    // 2. Pisos intermedios (1 hasta totalPisos - 2 conectan hacia arriba)
    for (let p = 1; p <= totalPisos - 2; p++) {
        const nodosActuales = Array.from(mapaPorPiso.get(p).values()).sort((a, b) => a.columna - b.columna);
        const pisoSiguiente = mapaPorPiso.get(p + 1);
        let maxColUsadaPorIzquierda = 0;
        nodosActuales.forEach((nodo, idx) => {
            const minCol = Math.max(0, nodo.columna - 1, maxColUsadaPorIzquierda);
            const maxCol = Math.min(totalCols - 1, Math.max(minCol, nodo.columna + 1));
            const candidatas = [];
            for (let c = minCol; c <= maxCol; c++)
                candidatas.push(c);
            const quiereDos = candidatas.length > 1 && (Math.random() < 0.45 || (nodosActuales.length < 3 && idx === 0));
            const cantConexiones = quiereDos ? 2 : 1;
            mezclarArray(candidatas);
            const elegidas = candidatas.slice(0, cantConexiones).sort((a, b) => a - b);
            for (const colDestino of elegidas) {
                if (!pisoSiguiente.has(colDestino)) {
                    const esFilaPreJefe = p + 1 === totalPisos - 1;
                    pisoSiguiente.set(colDestino, {
                        id: `m${numeroMapa}_p${p + 1}_c${colDestino}`,
                        piso: p + 1,
                        columna: colDestino,
                        tipo: esFilaPreJefe ? "HOGUERA" : "COMBATE",
                        estado: "BLOQUEADO",
                        siguientesIds: []
                    });
                }
                const nodoDestino = pisoSiguiente.get(colDestino);
                if (!nodo.siguientesIds.includes(nodoDestino.id)) {
                    nodo.siguientesIds.push(nodoDestino.id);
                }
            }
            maxColUsadaPorIzquierda = Math.max(maxColUsadaPorIzquierda, ...elegidas);
        });
    }
    // 3. Último Piso: Único nodo JEFE
    const colJefe = Math.floor(totalCols / 2);
    const nodoJefe = {
        id: `m${numeroMapa}_p${totalPisos}_jefe`,
        piso: totalPisos,
        columna: colJefe,
        tipo: "JEFE",
        estado: "BLOQUEADO",
        siguientesIds: []
    };
    mapaPorPiso.get(totalPisos).set(colJefe, nodoJefe);
    const nodosAnteultimo = Array.from(mapaPorPiso.get(totalPisos - 1).values());
    for (const nodo of nodosAnteultimo) {
        nodo.tipo = "HOGUERA";
        nodo.siguientesIds.push(nodoJefe.id);
    }
    // 4. Distribuir tipos intermedios y camuflar interrogantes falsos
    distribuirTiposNodosIntermedios(mapaPorPiso, totalPisos);
    const resultado = [];
    for (let p = 1; p <= totalPisos; p++) {
        const nodosPiso = Array.from(mapaPorPiso.get(p).values()).sort((a, b) => a.columna - b.columna);
        resultado.push(...nodosPiso);
    }
    return resultado;
}
function distribuirTiposNodosIntermedios(mapaPorPiso, totalPisos) {
    const nodosIntermedios = [];
    for (let p = 2; p <= totalPisos - 2; p++) {
        nodosIntermedios.push(...Array.from(mapaPorPiso.get(p).values()));
    }
    mezclarArray(nodosIntermedios);
    const conteoActual = {};
    const entradasReglas = Object.entries(exports.REGLAS_NODOS_MAPA);
    entradasReglas.forEach(([tipo]) => (conteoActual[tipo] = 0));
    for (const [tipo, regla] of entradasReglas) {
        for (const nodo of nodosIntermedios) {
            if (conteoActual[tipo] >= regla.min)
                break;
            if (nodo.tipo === "COMBATE") {
                nodo.tipo = tipo;
                conteoActual[tipo]++;
            }
        }
    }
    for (const nodo of nodosIntermedios) {
        if (nodo.tipo !== "COMBATE")
            continue;
        for (const [tipo, regla] of entradasReglas) {
            if (conteoActual[tipo] >= regla.max)
                continue;
            if (Math.random() * 100 < regla.probabilidad) {
                nodo.tipo = tipo;
                conteoActual[tipo]++;
                break;
            }
        }
    }
    for (const nodo of nodosIntermedios) {
        if (nodo.tipo !== "EVENTO") {
            if (Math.random() * 100 < exports.CONFIG_MAPA.PROBABILIDAD_INTERROGANTE_FALSO) {
                nodo.tipoRealOculto = nodo.tipo;
                nodo.tipo = "EVENTO";
            }
        }
    }
}
function mezclarArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}
