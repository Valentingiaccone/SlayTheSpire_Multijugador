export type AmbientacionId = "BRAWL_STARS" | "CLASH_ROYALE" | "POKEMON" | "NITROMEME";
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
    | "INVOCAR"
    // NUEVAS DE NITROMEME
    | "APLICAR_FRAGIL"
    | "GANAR_REFLEJAR"
    | "GANAR_RITUAL"
    | "GANAR_ENFURECIDO"
    | "GANAR_ENTERRADO"
    | "GANAR_PONE_HERIDAS"
    | "ESCUDO_AREA"
    | "BLOQUEAR_Y_VULNERABLE";

export const NOMBRES_AMBIENTACION: Record<AmbientacionId, string> = {
    BRAWL_STARS: "Brawl Stars",
    CLASH_ROYALE: "Clash Royale",
    POKEMON: "Pokémon",
    NITROMEME: "Nitrome"
};

export const TODAS_LAS_AMBIENTACIONES: AmbientacionId[] = [
    "BRAWL_STARS",
    "CLASH_ROYALE",
    "POKEMON",
    "NITROMEME"
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

export const ESCALADO_ENEMIGOS_POR_MAPA: Record<number, IConfigEscaladoMapa> = {
    1: { porcentajeVidaExtra: 0, aumentoMinimoVida: 0, porcentajeAccionExtra: 0, aumentoMinimoAccion: 0 },
    2: { porcentajeVidaExtra: 0.70, aumentoMinimoVida: 2, porcentajeAccionExtra: 0.5, aumentoMinimoAccion: 2 },
    3: { porcentajeVidaExtra: 1.50, aumentoMinimoVida: 4, porcentajeAccionExtra: 1, aumentoMinimoAccion: 4 }
};

export interface IIntencionPatron {
    tipo: TipoIntencion;
    valorMin: number;
    valorMax: number;
    golpes?: number; 
    invocarEnemigoId?: string;
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
        hpMin: 14,
        hpMax: 16,
        patron: [
            { tipo: "ATACAR", valorMin: 3, valorMax: 4 },
            { tipo: "ATACAR", valorMin: 5, valorMax: 6 },
            { tipo: "ATACAR", valorMin: 7, valorMax: 8 }
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
            { tipo: "ATACAR", valorMin: 4, valorMax: 4 },
            { tipo: "ATACAR", valorMin: 6, valorMax: 7 },
            { tipo: "ATACAR", valorMin: 4, valorMax: 4 },
            { tipo: "ATACAR", valorMin: 10, valorMax: 12 },
        ]
    },
    cactus: {
        id: "cactus",
        nombre: "Cactus",
        ambientacion: "BRAWL_STARS",
        categoria: "NORMAL",
        espacio: 4,
        hpMin: 31,
        hpMax: 34,
        patron: [
            { tipo: "GANAR_ESPINAS", valorMin: 1, valorMax: 1 },
            { tipo: "GANAR_ESPINAS", valorMin: 1, valorMax: 1 },
            { tipo: "GANAR_ESPINAS", valorMin: 1, valorMax: 2 },
            { tipo: "ATACAR", valorMin: 6, valorMax: 6 }
        ]
    },
    robot_dorado: {
        id: "robot_dorado",
        nombre: "👹 Robot dorado",
        ambientacion: "BRAWL_STARS",
        categoria: "ELITE",
        espacio: 7,
        hpMin: 96,
        hpMax: 102,
        patron: [
            { tipo: "ATACAR", valorMin: 8, valorMax: 8 },
            { tipo: "BLOQUEAR", valorMin: 10, valorMax: 12 },
            { tipo: "GANAR_FUERZA", valorMin: 2, valorMax: 2 },
            { tipo: "ATACAR", valorMin: 5, valorMax: 5, golpes: 2 }
        ]
    },
    robot_jefe: {
        id: "robot_jefe",
        nombre: "💀 Robot jefe",
        ambientacion: "BRAWL_STARS",
        categoria: "JEFE",
        espacio: 10,
        hpMin: 150,
        hpMax: 160,
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
        hpMin: 23,
        hpMax: 26,
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
        hpMin: 32,
        hpMax: 36,
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
        hpMin: 44,
        hpMax: 48,
        patron: [
            { tipo: "INVOCAR", valorMin: 1, valorMax: 2, invocarEnemigoId: "espiritu_fuego" },
            { tipo: "INVOCAR", valorMin: 1, valorMax: 2, invocarEnemigoId: "espiritu_hielo" },
            { tipo: "INVOCAR", valorMin: 1, valorMax: 2, invocarEnemigoId: "espiritu_sanador" },
            { tipo: "INVOCAR", valorMin: 1, valorMax: 2, invocarEnemigoId: "espiritu_electrico" },
            { tipo: "ATACAR_Y_BLOQUEAR", valorMin: 7, valorMax: 8 }
        ]
    },
    bruja: {
        id: "bruja",
        nombre: "👹 Bruja",
        ambientacion: "CLASH_ROYALE",
        categoria: "ELITE",
        espacio: 6,
        hpMin: 75,
        hpMax: 85,
        patron: [
            { tipo: "INVOCAR", valorMin: 2, valorMax: 3, invocarEnemigoId: "larry" },
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
        hpMin: 250,
        hpMax: 265,
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
        hpMin: 36,
        hpMax: 40,
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
        hpMin: 78,
        hpMax: 84,
        patron: [
            { tipo: "ATACAR", valorMin: 13, valorMax: 13 }
        ]
    },
    charizard: {
        id: "charizard",
        nombre: "💀 Charizard",
        ambientacion: "POKEMON",
        categoria: "JEFE",
        espacio: 10,
        hpMin: 160,
        hpMax: 170,
        patron: [
            { tipo: "ATACAR", valorMin: 11, valorMax: 13 },
            { tipo: "GANAR_FUERZA", valorMin: 2, valorMax: 3 },
            { tipo: "ATACAR_Y_BLOQUEAR", valorMin: 10, valorMax: 12 },
            { tipo: "ATACAR", valorMin: 5, valorMax: 5, golpes: 3 },
            { tipo: "APLICAR_VULNERABLE", valorMin: 2, valorMax: 2 }
        ]
    },

    // =========================================================================
    // MUNDO 4: NITROMEME
    // =========================================================================
    dark: {
        id: "dark",
        nombre: "Dark",
        ambientacion: "NITROMEME",
        categoria: "NORMAL",
        espacio: 1,
        hpMin: 3,
        hpMax: 5,
        patron: [
            { tipo: "ATACAR", valorMin: 1, valorMax: 2 },
            { tipo: "GANAR_FUERZA", valorMin: 1, valorMax: 2 }
        ]
    },
    bad_ice_creams: {
        id: "bad_ice_creams",
        nombre: "Bad Ice Creams",
        ambientacion: "NITROMEME",
        categoria: "NORMAL",
        espacio: 2,
        hpMin: 30,
        hpMax: 30,
        patron: [
            { tipo: "ESCUDO_AREA", valorMin: 6, valorMax: 8 },
            { tipo: "APLICAR_DEBIL", valorMin: 3, valorMax: 3 },
            { tipo: "APLICAR_FRAGIL", valorMin: 3, valorMax: 3 }
        ]
    },
    roly_poly: {
        id: "roly_poly",
        nombre: "Roly Poly",
        ambientacion: "NITROMEME",
        categoria: "NORMAL",
        espacio: 3,
        hpMin: 40,
        hpMax: 40,
        patron: [
            { tipo: "GANAR_ESPINAS", valorMin: 2, valorMax: 2 },
            { tipo: "BLOQUEAR", valorMin: 6, valorMax: 6 },
            { tipo: "ATACAR", valorMin: 7, valorMax: 7 }
        ]
    },
    twin_shot: {
        id: "twin_shot",
        nombre: "Twin Shot",
        ambientacion: "NITROMEME",
        categoria: "NORMAL",
        espacio: 3,
        hpMin: 25,
        hpMax: 30,
        patron: [
            { tipo: "ATACAR", valorMin: 3, valorMax: 3, golpes: 3 },
            { tipo: "GANAR_FUERZA", valorMin: 1, valorMax: 1 }
        ]
    },
    luciergana: {
        id: "luciergana",
        nombre: "👹 Luciergana",
        ambientacion: "NITROMEME",
        categoria: "ELITE",
        espacio: 7,
        hpMin: 85,
        hpMax: 95,
        patron: [
            { tipo: "ATACAR", valorMin: 8, valorMax: 8 },
            { tipo: "BLOQUEAR", valorMin: 20, valorMax: 20 },
            { tipo: "GANAR_REFLEJAR", valorMin: 1, valorMax: 1 }
        ]
    },
    ox: {
        id: "ox",
        nombre: "👹 Ox",
        ambientacion: "NITROMEME",
        categoria: "ELITE",
        espacio: 7,
        hpMin: 1,
        hpMax: 1,
        patron: [
            { tipo: "ATACAR", valorMin: 1, valorMax: 1 }
        ]
    },
    double_edge: {
        id: "double_edge",
        nombre: "👹 Doublé Edge",
        ambientacion: "NITROMEME",
        categoria: "ELITE",
        espacio: 7,
        hpMin: 120,
        hpMax: 120,
        patron: [
            { tipo: "GANAR_RITUAL", valorMin: 1, valorMax: 1 },
            { tipo: "ATACAR_Y_BLOQUEAR", valorMin: 7, valorMax: 7 },
            { tipo: "ATACAR", valorMin: 3, valorMax: 3, golpes: 2 }
        ]
    },
    ete_bull: {
        id: "ete_bull",
        nombre: "💀 Ete Bull",
        ambientacion: "NITROMEME",
        categoria: "JEFE",
        espacio: 10,
        hpMin: 220,
        hpMax: 250,
        patron: [
            { tipo: "GANAR_ENFURECIDO", valorMin: 1, valorMax: 1 },
            { tipo: "ATACAR", valorMin: 8, valorMax: 8 },
            { tipo: "ATACAR", valorMin: 1, valorMax: 1, golpes: 5 },
            { tipo: "BLOQUEAR_Y_VULNERABLE", valorMin: 20, valorMax: 20 }
        ]
    },
    comida_para_gusano: {
        id: "comida_para_gusano",
        nombre: "💀 Comida para gusano",
        ambientacion: "NITROMEME",
        categoria: "JEFE",
        espacio: 10,
        hpMin: 280,
        hpMax: 300,
        patron: [
            { tipo: "GANAR_PONE_HERIDAS", valorMin: 1, valorMax: 1 },
            { tipo: "ATACAR", valorMin: 15, valorMax: 15 },
            { tipo: "ATACAR", valorMin: 4, valorMax: 4, golpes: 3 },
            { tipo: "GANAR_ENTERRADO", valorMin: 60, valorMax: 60 }
        ]
    }
};

export function sortearRangoEntero(min: number, max: number): number {
    if (max <= min) return min;
    return min + Math.floor(Math.random() * (max - min + 1));
}

export function escalarVidaEnemigo(hpBase: number, numeroMapa: number): number {
    const cfg = ESCALADO_ENEMIGOS_POR_MAPA[numeroMapa];
    if (!cfg || (cfg.porcentajeVidaExtra <= 0 && cfg.aumentoMinimoVida <= 0)) return hpBase;
    const aumento = Math.max(cfg.aumentoMinimoVida, Math.floor(hpBase * cfg.porcentajeVidaExtra));
    return hpBase + aumento;
}

export function escalarAccionEnemigo(valorBase: number, tipo: TipoIntencion, numeroMapa: number): number {
    const escalaEsteTipo =
        tipo === "ATACAR" || tipo === "BLOQUEAR" || tipo === "ATACAR_Y_BLOQUEAR" ||
        tipo === "GANAR_FUERZA" || tipo === "GANAR_ESPINAS" || tipo === "CURAR_ALIADOS" ||
        tipo === "ESCUDO_AREA" || tipo === "BLOQUEAR_Y_VULNERABLE" || tipo === "GANAR_ENTERRADO";

    if (!escalaEsteTipo) return valorBase;

    const cfg = ESCALADO_ENEMIGOS_POR_MAPA[numeroMapa];
    if (!cfg || (cfg.porcentajeAccionExtra <= 0 && cfg.aumentoMinimoAccion <= 0)) return valorBase;
    const aumento = Math.max(cfg.aumentoMinimoAccion, Math.floor(valorBase * cfg.porcentajeAccionExtra));
    return valorBase + aumento;
}

export function resolverIntencionPatron(info: IEnemigoInfo, indicePatron: number, numeroMapa: number): IIntencionResuelta {
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

export function obtenerEncuentroAleatorio(tipoCombate: "COMBATE" | "ELITE" | "JEFE", ambientacion: AmbientacionId = "BRAWL_STARS"): string[] {
    const categoriaBuscada: CategoriaEnemigo = tipoCombate === "JEFE" ? "JEFE" : tipoCombate === "ELITE" ? "ELITE" : "NORMAL";
    const poolMundo = Object.values(ENEMIGOS_INFO).filter((e) => e.ambientacion === ambientacion && e.categoria === categoriaBuscada);
    if (poolMundo.length === 0) return ["robot"];

    let espacioRestante = CONFIG_ENEMIGOS.ESPACIO_MAXIMO_COMBATE;
    const resultado: string[] = [];

    if (tipoCombate === "COMBATE") {
        const principales = poolMundo.filter((e) => e.espacio >= CONFIG_ENEMIGOS.ESPACIO_MINIMO_ENEMIGO_PRINCIPAL && e.espacio <= espacioRestante);
        if (principales.length > 0) {
            const primero = principales[Math.floor(Math.random() * principales.length)];
            resultado.push(primero.id);
            espacioRestante -= primero.espacio;
        }

        while (espacioRestante > 0 && resultado.length < CONFIG_ENEMIGOS.MAX_ENEMIGOS_SIMULTANEOS_EN_PANTALLA) {
            const candidatos = poolMundo.filter((e) => e.espacio <= espacioRestante);
            if (candidatos.length === 0) break;
            const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];
            resultado.push(elegido.id);
            espacioRestante -= elegido.espacio;
        }

        // Filtro especial: Evitar pelear SÓLO contra helados de buff
        if (ambientacion === "NITROMEME" && resultado.length > 0 && !resultado.some((id) => id !== "bad_ice_creams")) {
            resultado[0] = "roly_poly";
        }

        return resultado;
    }

    const usados = new Set<string>();
    while (espacioRestante > 0) {
        const candidatos = poolMundo.filter((e) => e.espacio <= espacioRestante && !usados.has(e.id));
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