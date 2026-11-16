"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG_MAPA = void 0;
exports.generarMapaRun = generarMapaRun;
exports.CONFIG_MAPA = {
    CANTIDAD_PISOS: 8, // Cambiá este valor para alargar o acortar todos los caminos (último piso = Jefe)
    COLUMNAS: 5, // Ancho de la grilla (0 a 4)
    MIN_HOJAS_INICIO: 3, // Mínimo de nodos iniciales en el Piso 1
    MAX_HOJAS_INICIO: 4, // Máximo de nodos iniciales en el Piso 1
    SEGUNDOS_CUENTA_REGRESIVA: 3 // Segundos antes de viajar una vez que hay mayoría
};
function generarMapaRun() {
    const totalPisos = Math.max(2, exports.CONFIG_MAPA.CANTIDAD_PISOS);
    const totalCols = exports.CONFIG_MAPA.COLUMNAS;
    const mapaPorPiso = new Map();
    for (let p = 1; p <= totalPisos; p++) {
        mapaPorPiso.set(p, new Map());
    }
    // 1. Piso 1: Crear entre MIN_HOJAS_INICIO (3) y MAX_HOJAS_INICIO (4) nodos iniciales
    const colsDisponibles = Array.from({ length: totalCols }, (_, i) => i);
    mezclarArray(colsDisponibles);
    const cantHojas = Math.min(totalCols, exports.CONFIG_MAPA.MIN_HOJAS_INICIO + Math.floor(Math.random() * (exports.CONFIG_MAPA.MAX_HOJAS_INICIO - exports.CONFIG_MAPA.MIN_HOJAS_INICIO + 1)));
    const colsPiso1 = colsDisponibles.slice(0, cantHojas).sort((a, b) => a - b);
    for (const col of colsPiso1) {
        mapaPorPiso.get(1).set(col, {
            id: `p1_c${col}`,
            piso: 1,
            columna: col,
            tipo: "COMBATE",
            estado: "DISPONIBLE", // En el piso 1 arrancan disponibles para votar
            siguientesIds: []
        });
    }
    // 2. Pisos intermedios (1 hasta totalPisos - 2 -> conectan con p + 1)
    for (let p = 1; p <= totalPisos - 2; p++) {
        const nodosActuales = Array.from(mapaPorPiso.get(p).values()).sort((a, b) => a.columna - b.columna);
        const pisoSiguiente = mapaPorPiso.get(p + 1);
        // Evita cruces en X: ningún nodo puede conectarse a una columna menor que el máximo destino del nodo a su izquierda
        let maxColUsadaPorIzquierda = 0;
        nodosActuales.forEach((nodo, idx) => {
            const minCol = Math.max(0, nodo.columna - 1, maxColUsadaPorIzquierda);
            const maxCol = Math.min(totalCols - 1, Math.max(minCol, nodo.columna + 1));
            const candidatas = [];
            for (let c = minCol; c <= maxCol; c++) {
                candidatas.push(c);
            }
            // Elegimos 1 o 2 conexiones hacia arriba
            const quiereDos = candidatas.length > 1 && (Math.random() < 0.20 || (nodosActuales.length < 3 && idx === 0));
            const cantConexiones = quiereDos ? 2 : 1;
            mezclarArray(candidatas);
            const elegidas = candidatas.slice(0, cantConexiones).sort((a, b) => a - b);
            for (const colDestino of elegidas) {
                if (!pisoSiguiente.has(colDestino)) {
                    pisoSiguiente.set(colDestino, {
                        id: `p${p + 1}_c${colDestino}`,
                        piso: p + 1,
                        columna: colDestino,
                        tipo: elegirTipoNodoIntermedio(p + 1, totalPisos),
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
    // 3. Último Piso (Jefe único en el centro)
    const colJefe = Math.floor(totalCols / 2);
    const nodoJefe = {
        id: `p${totalPisos}_jefe`,
        piso: totalPisos,
        columna: colJefe,
        tipo: "JEFE",
        estado: "BLOQUEADO",
        siguientesIds: []
    };
    mapaPorPiso.get(totalPisos).set(colJefe, nodoJefe);
    // Todos los nodos del anteúltimo piso convergen en el Jefe
    const nodosAnteultimo = Array.from(mapaPorPiso.get(totalPisos - 1).values());
    for (const nodo of nodosAnteultimo) {
        nodo.siguientesIds.push(nodoJefe.id);
    }
    // Devolver lista plana ordenada por piso y columna
    const resultado = [];
    for (let p = 1; p <= totalPisos; p++) {
        const nodosPiso = Array.from(mapaPorPiso.get(p).values()).sort((a, b) => a.columna - b.columna);
        resultado.push(...nodosPiso);
    }
    return resultado;
}
function elegirTipoNodoIntermedio(_piso, _totalPisos) {
    // Por ahora todos los nodos intermedios son COMBATE.
    // Mañana acá podés retornar "EVENTO", "HOGUERA", "ELITE" o "TIENDA" según probabilidades.
    return "COMBATE";
}
function mezclarArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}
