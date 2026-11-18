export type AmbientacionId = "BRAWL_STARS" | "CLASH_ROYALE" | "POKEMON";
export type CategoriaEnemigo = "NORMAL" | "ELITE" | "JEFE";

export type TipoIntencion =
    | "ATACAR"
    | "BLOQUEAR"
    | "ATACAR_Y_BLOQUEAR"
    | "GANAR_FUERZA"
    | "GANAR_ESPINAS"
    | "APLICAR_VULNERABLE"
    | "APLICAR_DEBIL"
    | "CURAR_ALIADOS"
    | "INVOCAR";

export const NOMBRES_AMBIENTACION: Record<AmbientacionId, string> = {
    BRAWL_STARS: "Brawl Stars",
    CLASH_ROYALE: "Clash Royale",
    POKEMON: "Pokémon"
};

export const TODAS_LAS_AMBIENTACIONES: AmbientacionId[] = [
    "BRAWL_STARS",
    "CLASH_ROYALE",
    "POKEMON"
];

// ================= VARIABLES DE BALANCEO =================
export const CONFIG_ENEMIGOS = {
    ESPACIO_MAXIMO_COMBATE: 10,
    ESPACIO_MINIMO_ENEMIGO_PRINCIPAL: 3,
    MAX_ENEMIGOS_SIMULTANEOS_EN_PANTALLA: 10
};

export interface IConfigEscaladoMapa {
    porcentajeVidaExtra: number;
    aumentoMinimoVida: number;
    porcentajeAccionExtra: number;
    aumentoMinimoAccion: number;
}

/**
 * Escalado por número de mapa (1, 2 y 3).
 * Todos los aumentos redondean hacia abajo (Math.floor) respetando el aumento mínimo.
 */
export const ESCALADO_ENEMIGOS_POR_MAPA: Record<number, IConfigEscaladoMapa> = {
    1: {
        porcentajeVidaExtra: 0,
        aumentoMinimoVida: 0,
        porcentajeAccionExtra: 0,
        aumentoMinimoAccion: 0
    },
    2: {
        porcentajeVidaExtra: 0.70, // +70% vida
        aumentoMinimoVida: 2,
        porcentajeAccionExtra: 0.5, // +50% daño, bloqueo, fuerza, espinas y curación
        aumentoMinimoAccion: 2
    },
    3: {
        porcentajeVidaExtra: 1.50, // +150% vida
        aumentoMinimoVida: 4,
        porcentajeAccionExtra: 1, // +100% daño, bloqueo, fuerza, espinas y curación
        aumentoMinimoAccion: 4
    }
};

export interface IIntencionPatron {
    tipo: TipoIntencion;
    valorMin: number;
    valorMax: number;
    golpes?: number; // Para ataques multi-golpe (ej: 2x2 -> valorMin: 2, valorMax: 2, golpes: 2)
    invocarEnemigoId?: string; // ID del enemigo a invocar cuando tipo === "INVOCAR"
}

export interface IEnemigoInfo {
    id: string;
    nombre: string;
    ambientacion: AmbientacionId;
    categoria: CategoriaEnemigo;
    espacio: number;
    hpMin: number;
    hpMax: number;
    patron: IIntencionPatron[];
}

export interface IIntencionResuelta {
    tipo: TipoIntencion;
    valor: number;
    golpes: number;
    invocarEnemigoId: string;
}

export const ENEMIGOS_INFO: Record<string, IEnemigoInfo> = {
    // =========================================================================
    // MUNDO 1: BRAWL STARS
    // =========================================================================
    robot_pequeno: {
        id: "robot_pequeno",
        nombre: "Robot pequeño",
        ambientacion: "BRAWL_STARS",
        categoria: "NORMAL",
        espacio: 2,
        hpMin: 15,
        hpMax: 18,
        patron: [
            { tipo: "ATACAR", valorMin: 5, valorMax: 5 },
            { tipo: "ATACAR", valorMin: 8, valorMax: 8 },
            { tipo: "ATACAR", valorMin: 9, valorMax: 11 }
        ]
    },
    robot: {
        id: "robot",
        nombre: "Robot",
        ambientacion: "BRAWL_STARS",
        categoria: "NORMAL",
        espacio: 4,
        hpMin: 41,
        hpMax: 46,
        patron: [
            { tipo: "ATACAR", valorMin: 3, valorMax: 3 },
            { tipo: "BLOQUEAR", valorMin: 6, valorMax: 6 },
            { tipo: "GANAR_FUERZA", valorMin: 2, valorMax: 2 },
            { tipo: "ATACAR_Y_BLOQUEAR", valorMin: 3, valorMax: 3 },
            { tipo: "ATACAR", valorMin: 4, valorMax: 6 },
            { tipo: "ATACAR", valorMin: 2, valorMax: 2, golpes: 2 }
        ]
    },
    robot_pistola: {
        id: "robot_pistola",
        nombre: "Robot pistola",
        ambientacion: "BRAWL_STARS",
        categoria: "NORMAL",
        espacio: 4,
        hpMin: 30,
        hpMax: 34,
        patron: [
            { tipo: "ATACAR", valorMin: 5, valorMax: 7 },
            { tipo: "ATACAR", valorMin: 8, valorMax: 9 },
            { tipo: "ATACAR", valorMin: 10, valorMax: 12 }
        ]
    },
    cactus: {
        id: "cactus",
        nombre: "Cactus",
        ambientacion: "BRAWL_STARS",
        categoria: "NORMAL",
        espacio: 4,
        hpMin: 28,
        hpMax: 32,
        patron: [
            { tipo: "GANAR_ESPINAS", valorMin: 1, valorMax: 1 },
            { tipo: "GANAR_ESPINAS", valorMin: 1, valorMax: 1 },
            { tipo: "GANAR_ESPINAS", valorMin: 1, valorMax: 2 },
            { tipo: "ATACAR", valorMin: 10, valorMax: 10 }
        ]
    },
    robot_dorado: {
        id: "robot_dorado",
        nombre: "👹 Robot dorado",
        ambientacion: "BRAWL_STARS",
        categoria: "ELITE",
        espacio: 7,
        hpMin: 65,
        hpMax: 70,
        patron: [
            { tipo: "ATACAR", valorMin: 8, valorMax: 8 },
            { tipo: "BLOQUEAR", valorMin: 10, valorMax: 10 },
            { tipo: "GANAR_FUERZA", valorMin: 2, valorMax: 2 },
            { tipo: "ATACAR_Y_BLOQUEAR", valorMin: 6, valorMax: 7 },
            { tipo: "ATACAR", valorMin: 5, valorMax: 5, golpes: 2 }
        ]
    },
    robot_jefe: {
        id: "robot_jefe",
        nombre: "💀 Robot jefe",
        ambientacion: "BRAWL_STARS",
        categoria: "JEFE",
        espacio: 10,
        hpMin: 110,
        hpMax: 120,
        patron: [
            { tipo: "BLOQUEAR", valorMin: 11, valorMax: 13 },
            { tipo: "ATACAR", valorMin: 14, valorMax: 15 },
            { tipo: "ATACAR_Y_BLOQUEAR", valorMin: 9, valorMax: 10 },
            { tipo: "GANAR_FUERZA", valorMin: 2, valorMax: 2 },
            { tipo: "ATACAR", valorMin: 7, valorMax: 7, golpes: 2 }
        ]
    },

    // =========================================================================
    // MUNDO 2: CLASH ROYALE
    // =========================================================================
    larry: {
        id: "larry",
        nombre: "Larry",
        ambientacion: "CLASH_ROYALE",
        categoria: "NORMAL",
        espacio: 1,
        hpMin: 3,
        hpMax: 5,
        patron: [
            { tipo: "ATACAR", valorMin: 1, valorMax: 2 },
            { tipo: "GANAR_FUERZA", valorMin: 1, valorMax: 2 }
        ]
    },
    espiritu_fuego: {
        id: "espiritu_fuego",
        nombre: "Espíritu de fuego",
        ambientacion: "CLASH_ROYALE",
        categoria: "NORMAL",
        espacio: 1,
        hpMin: 2,
        hpMax: 4,
        patron: [
            { tipo: "GANAR_ESPINAS", valorMin: 1, valorMax: 1 },
            { tipo: "ATACAR", valorMin: 1, valorMax: 2 }
        ]
    },
    espiritu_hielo: {
        id: "espiritu_hielo",
        nombre: "Espíritu de hielo",
        ambientacion: "CLASH_ROYALE",
        categoria: "NORMAL",
        espacio: 1,
        hpMin: 1,
        hpMax: 3,
        patron: [
            { tipo: "APLICAR_VULNERABLE", valorMin: 1, valorMax: 1 },
            { tipo: "APLICAR_DEBIL", valorMin: 1, valorMax: 1 }
        ]
    },
    espiritu_electrico: {
        id: "espiritu_electrico",
        nombre: "Espíritu eléctrico",
        ambientacion: "CLASH_ROYALE",
        categoria: "NORMAL",
        espacio: 1,
        hpMin: 1,
        hpMax: 3,
        patron: [
            { tipo: "GANAR_ESPINAS", valorMin: 1, valorMax: 1 },
            { tipo: "APLICAR_VULNERABLE", valorMin: 1, valorMax: 1 }
        ]
    },
    espiritu_sanador: {
        id: "espiritu_sanador",
        nombre: "Espíritu sanador",
        ambientacion: "CLASH_ROYALE",
        categoria: "NORMAL",
        espacio: 1,
        hpMin: 2,
        hpMax: 4,
        patron: [
            { tipo: "CURAR_ALIADOS", valorMin: 2, valorMax: 4 }
        ]
    },
    arqueras: {
        id: "arqueras",
        nombre: "Arqueras",
        ambientacion: "CLASH_ROYALE",
        categoria: "NORMAL",
        espacio: 3,
        hpMin: 18,
        hpMax: 21,
        patron: [
            { tipo: "ATACAR", valorMin: 4, valorMax: 5 },
            { tipo: "ATACAR", valorMin: 6, valorMax: 7 }
        ]
    },
    caballero: {
        id: "caballero",
        nombre: "Caballero",
        ambientacion: "CLASH_ROYALE",
        categoria: "NORMAL",
        espacio: 4,
        hpMin: 30,
        hpMax: 34,
        patron: [
            { tipo: "ATACAR", valorMin: 3, valorMax: 3 },
            { tipo: "ATACAR_Y_BLOQUEAR", valorMin: 3, valorMax: 4 },
            { tipo: "ATACAR", valorMin: 8, valorMax: 9 }
        ]
    },
    horno: {
        id: "horno",
        nombre: "Horno",
        ambientacion: "CLASH_ROYALE",
        categoria: "NORMAL",
        espacio: 5,
        hpMin: 40,
        hpMax: 44,
        patron: [
            { tipo: "INVOCAR", valorMin: 1, valorMax: 1, invocarEnemigoId: "espiritu_fuego" },
            { tipo: "INVOCAR", valorMin: 1, valorMax: 1, invocarEnemigoId: "espiritu_hielo" },
            { tipo: "INVOCAR", valorMin: 1, valorMax: 1, invocarEnemigoId: "espiritu_sanador" },
            { tipo: "INVOCAR", valorMin: 1, valorMax: 1, invocarEnemigoId: "espiritu_electrico" },
            { tipo: "ATACAR_Y_BLOQUEAR", valorMin: 7, valorMax: 7 }
        ]
    },
    bruja: {
        id: "bruja",
        nombre: "👹 Bruja",
        ambientacion: "CLASH_ROYALE",
        categoria: "ELITE",
        espacio: 6,
        hpMin: 50,
        hpMax: 55,
        patron: [
            { tipo: "INVOCAR", valorMin: 2, valorMax: 2, invocarEnemigoId: "larry" },
            { tipo: "ATACAR", valorMin: 3, valorMax: 3, golpes: 2 },
            { tipo: "BLOQUEAR", valorMin: 15, valorMax: 15 },
            { tipo: "INVOCAR", valorMin: 4, valorMax: 5, invocarEnemigoId: "larry" },
            { tipo: "GANAR_FUERZA", valorMin: 2, valorMax: 2 },
            { tipo: "ATACAR_Y_BLOQUEAR", valorMin: 5, valorMax: 5 }
        ]
    },
    pekka: {
        id: "pekka",
        nombre: "💀 P.E.K.K.A",
        ambientacion: "CLASH_ROYALE",
        categoria: "JEFE",
        espacio: 10,
        hpMin: 125,
        hpMax: 132,
        patron: [
            { tipo: "BLOQUEAR", valorMin: 14, valorMax: 16 },
            { tipo: "GANAR_FUERZA", valorMin: 4, valorMax: 6 },
            { tipo: "BLOQUEAR", valorMin: 14, valorMax: 16 },
            { tipo: "ATACAR", valorMin: 20, valorMax: 20 }
        ]
    },

    // =========================================================================
    // MUNDO 3: POKÉMON
    // =========================================================================
    torchic: {
        id: "torchic",
        nombre: "Torchic",
        ambientacion: "POKEMON",
        categoria: "NORMAL",
        espacio: 4,
        hpMin: 30,
        hpMax: 34,
        patron: [
            { tipo: "ATACAR", valorMin: 5, valorMax: 6 },
            { tipo: "GANAR_FUERZA", valorMin: 2, valorMax: 2 },
            { tipo: "ATACAR_Y_BLOQUEAR", valorMin: 6, valorMax: 7 }
        ]
    },
    flareon: {
        id: "flareon",
        nombre: "Flareon",
        ambientacion: "POKEMON",
        categoria: "NORMAL",
        espacio: 6,
        hpMin: 40,
        hpMax: 45,
        patron: [
            { tipo: "ATACAR", valorMin: 2, valorMax: 2, golpes: 2 },
            { tipo: "GANAR_FUERZA", valorMin: 1, valorMax: 1 },
            { tipo: "ATACAR", valorMin: 2, valorMax: 2, golpes: 2 },
            { tipo: "ATACAR", valorMin: 1, valorMax: 1, golpes: 3 }
        ]
    },
    magikarp: {
        id: "magikarp",
        nombre: "Magikarp",
        ambientacion: "POKEMON",
        categoria: "NORMAL",
        espacio: 5,
        hpMin: 29,
        hpMax: 33,
        patron: [
            { tipo: "BLOQUEAR", valorMin: 3, valorMax: 5 },
            { tipo: "BLOQUEAR", valorMin: 4, valorMax: 6 },
            { tipo: "GANAR_FUERZA", valorMin: 3, valorMax: 4 },
            { tipo: "ATACAR", valorMin: 12, valorMax: 15 }
        ]
    },
    cinderace: {
        id: "cinderace",
        nombre: "👹 Cinderace",
        ambientacion: "POKEMON",
        categoria: "ELITE",
        espacio: 10,
        hpMin: 75,
        hpMax: 82,
        patron: [
            { tipo: "ATACAR", valorMin: 20, valorMax: 20 }
        ]
    },
    charizard: {
        id: "charizard",
        nombre: "💀 Charizard",
        ambientacion: "POKEMON",
        categoria: "JEFE",
        espacio: 10,
        hpMin: 100,
        hpMax: 110,
        patron: [
            { tipo: "ATACAR", valorMin: 11, valorMax: 13 },
            { tipo: "GANAR_FUERZA", valorMin: 2, valorMax: 3 },
            { tipo: "ATACAR_Y_BLOQUEAR", valorMin: 10, valorMax: 12 },
            { tipo: "ATACAR", valorMin: 5, valorMax: 5, golpes: 3 },
            { tipo: "APLICAR_VULNERABLE", valorMin: 2, valorMax: 2 }
        ]
    }
};

/** Sortea un entero aleatorio entre min y max (ambos inclusive) */
export function sortearRangoEntero(min: number, max: number): number {
    if (max <= min) return min;
    return min + Math.floor(Math.random() * (max - min + 1));
}

/** Aplica el escalado de vida del mapa actual redondeando hacia abajo y respetando el mínimo */
export function escalarVidaEnemigo(hpBase: number, numeroMapa: number): number {
    const cfg = ESCALADO_ENEMIGOS_POR_MAPA[numeroMapa];
    if (!cfg || (cfg.porcentajeVidaExtra <= 0 && cfg.aumentoMinimoVida <= 0)) {
        return hpBase;
    }
    const aumento = Math.max(cfg.aumentoMinimoVida, Math.floor(hpBase * cfg.porcentajeVidaExtra));
    return hpBase + aumento;
}

/** Aplica el escalado de acción (daño por golpe, bloqueo, fuerza, espinas, curación) según el mapa */
export function escalarAccionEnemigo(valorBase: number, tipo: TipoIntencion, numeroMapa: number): number {
    const escalaEsteTipo =
        tipo === "ATACAR" ||
        tipo === "BLOQUEAR" ||
        tipo === "ATACAR_Y_BLOQUEAR" ||
        tipo === "GANAR_FUERZA" ||
        tipo === "GANAR_ESPINAS" ||
        tipo === "CURAR_ALIADOS";

    if (!escalaEsteTipo) return valorBase;

    const cfg = ESCALADO_ENEMIGOS_POR_MAPA[numeroMapa];
    if (!cfg || (cfg.porcentajeAccionExtra <= 0 && cfg.aumentoMinimoAccion <= 0)) {
        return valorBase;
    }
    const aumento = Math.max(cfg.aumentoMinimoAccion, Math.floor(valorBase * cfg.porcentajeAccionExtra));
    return valorBase + aumento;
}

/** Resuelve el paso del patrón sorteando el rango interno y aplicando el escalado del mapa */
export function resolverIntencionPatron(
    info: IEnemigoInfo,
    indicePatron: number,
    numeroMapa: number
): IIntencionResuelta {
    const paso = info.patron[indicePatron % info.patron.length];
    const valorSorteado = sortearRangoEntero(paso.valorMin, paso.valorMax);
    const valorFinal = escalarAccionEnemigo(valorSorteado, paso.tipo, numeroMapa);

    return {
        tipo: paso.tipo,
        valor: valorFinal,
        golpes: Math.max(1, paso.golpes || 1),
        invocarEnemigoId: paso.invocarEnemigoId || ""
    };
}

/**
 * Genera un encuentro llenando hasta 10 de espacio con enemigos de la ambientación actual.
 * - COMBATE: garantiza mínimo 1 enemigo de espacio >= 3 y rellena el espacio restante con enemigos normales.
 * - ELITE: solo usa enemigos de categoría ELITE de esa ambientación (sin rellenar con normales).
 * - JEFE: coloca al jefe de esa ambientación.
 */
export function obtenerEncuentroAleatorio(
    tipoCombate: "COMBATE" | "ELITE" | "JEFE",
    ambientacion: AmbientacionId = "BRAWL_STARS"
): string[] {
    const categoriaBuscada: CategoriaEnemigo =
        tipoCombate === "JEFE" ? "JEFE" : tipoCombate === "ELITE" ? "ELITE" : "NORMAL";

    const poolMundo = Object.values(ENEMIGOS_INFO).filter(
        (e) => e.ambientacion === ambientacion && e.categoria === categoriaBuscada
    );

    if (poolMundo.length === 0) return ["robot"];

    let espacioRestante = CONFIG_ENEMIGOS.ESPACIO_MAXIMO_COMBATE;
    const resultado: string[] = [];

    if (tipoCombate === "COMBATE") {
        // 1. Asegurar al menos un enemigo de espacio >= 3
        const principales = poolMundo.filter(
            (e) =>
                e.espacio >= CONFIG_ENEMIGOS.ESPACIO_MINIMO_ENEMIGO_PRINCIPAL &&
                e.espacio <= espacioRestante
        );

        if (principales.length > 0) {
            const primero = principales[Math.floor(Math.random() * principales.length)];
            resultado.push(primero.id);
            espacioRestante -= primero.espacio;
        }

        // 2. Rellenar el espacio restante aleatoriamente con enemigos normales que quepan
        while (
            espacioRestante > 0 &&
            resultado.length < CONFIG_ENEMIGOS.MAX_ENEMIGOS_SIMULTANEOS_EN_PANTALLA
        ) {
            const candidatos = poolMundo.filter((e) => e.espacio <= espacioRestante);
            if (candidatos.length === 0) break;

            const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];
            resultado.push(elegido.id);
            espacioRestante -= elegido.espacio;
        }

        return resultado;
    }

    // ELITE o JEFE: rellenar únicamente con candidatos de su propia categoría sin repetir el mismo élite
    const usados = new Set<string>();
    while (espacioRestante > 0) {
        const candidatos = poolMundo.filter(
            (e) => e.espacio <= espacioRestante && !usados.has(e.id)
        );
        if (candidatos.length === 0) break;

        const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];
        resultado.push(elegido.id);
        usados.add(elegido.id);
        espacioRestante -= elegido.espacio;
    }

    if (resultado.length === 0) {
        const fallback = poolMundo[Math.floor(Math.random() * poolMundo.length)];
        resultado.push(fallback.id);
    }

    return resultado;
}