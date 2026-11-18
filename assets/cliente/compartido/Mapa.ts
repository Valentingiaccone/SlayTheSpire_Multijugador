export type TipoNodoMapa = "COMBATE" | "ELITE" | "COFRE" | "JEFE" | "EVENTO" | "HOGUERA" | "TIENDA";
export type EstadoNodoMapa = "BLOQUEADO" | "DISPONIBLE" | "ACTUAL" | "COMPLETADO";

export interface INodoMapaData {
    id: string;
    piso: number;
    columna: number;
    tipo: TipoNodoMapa;
    /**
     * Si el nodo es un interrogante falso, `tipo` vale "EVENTO" (lo que ven los jugadores en el mapa)
     * y `tipoRealOculto` guarda el evento verdadero ("ELITE", "COMBATE", "COFRE", etc.).
     */
    tipoRealOculto?: TipoNodoMapa;
    estado: EstadoNodoMapa;
    siguientesIds: string[];
}

export interface IReglaAparicionNodo {
    min: number;
    max: number;
    probabilidad: number;
}

export const CONFIG_MAPA = {
    CANTIDAD_PISOS: 12,
    COLUMNAS: 5,
    MIN_HOJAS_INICIO: 3,
    MAX_HOJAS_INICIO: 4,
    SEGUNDOS_CUENTA_REGRESIVA: 3,
    /**
     * Porcentaje (0 a 100) de que un nodo intermedio (Piso 2 a totalPisos - 2) que NO sea EVENTO
     * se camufle con un signo de interrogación ("?") ocultando su verdadero encuentro.
     */
    PROBABILIDAD_INTERROGANTE_FALSO: 3
};

/**
 * Reglas aplicadas exclusivamente en pisos intermedios (Piso 2 hasta totalPisos - 2).
 * El Piso 1 es siempre COMBATE, el piso (totalPisos - 1) es siempre HOGUERA y el último es JEFE.
 */
export const REGLAS_NODOS_MAPA: Partial<Record<TipoNodoMapa, IReglaAparicionNodo>> = {
    EVENTO: { min: 2, max: 5, probabilidad: 25 },
    ELITE: { min: 2, max: 4, probabilidad: 20 },
    TIENDA: { min: 1, max: 3, probabilidad: 18 },
    COFRE: { min: 2, max: 3, probabilidad: 15 },
    HOGUERA: { min: 1, max: 2, probabilidad: 14 }
};

export function generarMapaRun(): INodoMapaData[] {
    const totalPisos = Math.max(4, CONFIG_MAPA.CANTIDAD_PISOS);
    const totalCols = CONFIG_MAPA.COLUMNAS;
    const mapaPorPiso: Map<number, Map<number, INodoMapaData>> = new Map();

    for (let p = 1; p <= totalPisos; p++) {
        mapaPorPiso.set(p, new Map());
    }

    // 1. Piso 1: Hojas iniciales (siempre COMBATE, nunca interrogantes)
    const colsDisponibles = Array.from({ length: totalCols }, (_, i) => i);
    mezclarArray(colsDisponibles);
    const cantHojas = Math.min(
        totalCols,
        CONFIG_MAPA.MIN_HOJAS_INICIO +
            Math.floor(Math.random() * (CONFIG_MAPA.MAX_HOJAS_INICIO - CONFIG_MAPA.MIN_HOJAS_INICIO + 1))
    );
    const colsPiso1 = colsDisponibles.slice(0, cantHojas).sort((a, b) => a - b);

    for (const col of colsPiso1) {
        mapaPorPiso.get(1)!.set(col, {
            id: `p1_c${col}`,
            piso: 1,
            columna: col,
            tipo: "COMBATE",
            estado: "DISPONIBLE",
            siguientesIds: []
        });
    }

    // 2. Pisos intermedios (1 hasta totalPisos - 2 conectan hacia arriba)
    for (let p = 1; p <= totalPisos - 2; p++) {
        const nodosActuales = Array.from(mapaPorPiso.get(p)!.values()).sort((a, b) => a.columna - b.columna);
        const pisoSiguiente = mapaPorPiso.get(p + 1)!;
        let maxColUsadaPorIzquierda = 0;

        nodosActuales.forEach((nodo, idx) => {
            const minCol = Math.max(0, nodo.columna - 1, maxColUsadaPorIzquierda);
            const maxCol = Math.min(totalCols - 1, Math.max(minCol, nodo.columna + 1));

            const candidatas: number[] = [];
            for (let c = minCol; c <= maxCol; c++) candidatas.push(c);

            const quiereDos =
                candidatas.length > 1 && (Math.random() < 0.45 || (nodosActuales.length < 3 && idx === 0));
            const cantConexiones = quiereDos ? 2 : 1;

            mezclarArray(candidatas);
            const elegidas = candidatas.slice(0, cantConexiones).sort((a, b) => a - b);

            for (const colDestino of elegidas) {
                if (!pisoSiguiente.has(colDestino)) {
                    const esFilaPreJefe = p + 1 === totalPisos - 1;
                    pisoSiguiente.set(colDestino, {
                        id: `p${p + 1}_c${colDestino}`,
                        piso: p + 1,
                        columna: colDestino,
                        tipo: esFilaPreJefe ? "HOGUERA" : "COMBATE",
                        estado: "BLOQUEADO",
                        siguientesIds: []
                    });
                }
                const nodoDestino = pisoSiguiente.get(colDestino)!;
                if (!nodo.siguientesIds.includes(nodoDestino.id)) {
                    nodo.siguientesIds.push(nodoDestino.id);
                }
            }
            maxColUsadaPorIzquierda = Math.max(maxColUsadaPorIzquierda, ...elegidas);
        });
    }

    // 3. Último Piso: Único nodo JEFE
    const colJefe = Math.floor(totalCols / 2);
    const nodoJefe: INodoMapaData = {
        id: `p${totalPisos}_jefe`,
        piso: totalPisos,
        columna: colJefe,
        tipo: "JEFE",
        estado: "BLOQUEADO",
        siguientesIds: []
    };
    mapaPorPiso.get(totalPisos)!.set(colJefe, nodoJefe);

    // Todos los nodos de la fila de Fogatas (totalPisos - 1) conectan al Jefe y nunca se camuflan
    const nodosAnteultimo = Array.from(mapaPorPiso.get(totalPisos - 1)!.values());
    for (const nodo of nodosAnteultimo) {
        nodo.tipo = "HOGUERA";
        nodo.siguientesIds.push(nodoJefe.id);
    }

    // 4. Distribuir tipos intermedios (Piso 2 hasta totalPisos - 2) y aplicar Interrogantes Falsos
    distribuirTiposNodosIntermedios(mapaPorPiso, totalPisos);

    const resultado: INodoMapaData[] = [];
    for (let p = 1; p <= totalPisos; p++) {
        const nodosPiso = Array.from(mapaPorPiso.get(p)!.values()).sort((a, b) => a.columna - b.columna);
        resultado.push(...nodosPiso);
    }
    return resultado;
}

function distribuirTiposNodosIntermedios(
    mapaPorPiso: Map<number, Map<number, INodoMapaData>>,
    totalPisos: number
) {
    const nodosIntermedios: INodoMapaData[] = [];
    // Solo pisos entre 2 y totalPisos - 2 (excluye Piso 1, fila final de Fogatas y Jefe)
    for (let p = 2; p <= totalPisos - 2; p++) {
        nodosIntermedios.push(...Array.from(mapaPorPiso.get(p)!.values()));
    }
    mezclarArray(nodosIntermedios);

    const conteoActual: Record<string, number> = {};
    const entradasReglas = Object.entries(REGLAS_NODOS_MAPA) as [TipoNodoMapa, IReglaAparicionNodo][];
    entradasReglas.forEach(([tipo]) => (conteoActual[tipo] = 0));

    // Paso A: Garantizar el mínimo de cada tipo
    for (const [tipo, regla] of entradasReglas) {
        for (const nodo of nodosIntermedios) {
            if (conteoActual[tipo] >= regla.min) break;
            if (nodo.tipo === "COMBATE") {
                nodo.tipo = tipo;
                conteoActual[tipo]++;
            }
        }
    }

    // Paso B: Tirar porcentajes en los nodos restantes
    for (const nodo of nodosIntermedios) {
        if (nodo.tipo !== "COMBATE") continue;

        for (const [tipo, regla] of entradasReglas) {
            if (conteoActual[tipo] >= regla.max) continue;
            if (Math.random() * 100 < regla.probabilidad) {
                nodo.tipo = tipo;
                conteoActual[tipo]++;
                break;
            }
        }
    }

    // Paso C: Camuflar nodos con Interrogantes Falsos (solo en Piso 2 hasta totalPisos - 2)
    for (const nodo of nodosIntermedios) {
        if (nodo.tipo !== "EVENTO") {
            if (Math.random() * 100 < CONFIG_MAPA.PROBABILIDAD_INTERROGANTE_FALSO) {
                nodo.tipoRealOculto = nodo.tipo;
                nodo.tipo = "EVENTO";
            }
        }
    }
}

function mezclarArray<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}