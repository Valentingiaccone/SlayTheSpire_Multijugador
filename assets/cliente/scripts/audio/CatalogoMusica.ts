import { AmbientacionId } from "../../compartido/Enemigos";
import { FaseSala } from "../../compartido/GameTypes";

export type TipoCombateMusica = "NORMAL" | "ELITE" | "JEFE";
export type FaseNoCombate = Exclude<FaseSala, "COMBAT">;

// ================= CONFIGURACIÓN GENERAL =================
export const CONFIG_MUSICA = {
    /** Subcarpeta dentro de assets/resources/ donde van tus .mp3 / .ogg */
    CARPETA_RESOURCES: "audio/ost",
    /** Volumen por defecto (0.0 a 1.0) */
    VOLUMEN_BASE: 0.6,
    /** Duración del fade-out / fade-in al cambiar de canción (0 = cambio instantáneo) */
    DURACION_FADE_SEGUNDOS: 0.35
};

/**
 * Si una de estas fases NO tiene ninguna canción cargada en sus listas,
 * seguirá sonando la música anterior en lugar de quedar en silencio.
 */
export const FASES_QUE_MANTIENEN_MUSICA_SI_VACIO: FaseSala[] = ["REWARD"];

/**
 * Fases donde la música NO debe repetirse en bucle (por ejemplo, jingle corto de victoria/derrota).
 * Todas las demás fases y combates se reproducen en bucle automáticamente.
 */
export const FASES_SIN_BUCLE: FaseSala[] = [];

/**
 * Opcional: ajuste fino de volumen por pista individual (multiplicador 0.0 a 1.0)
 * por si algún .mp3 suena más fuerte que los demás.
 */
export const VOLUMEN_POR_PISTA: Record<string, number> = {
    // ejemplo_tema_fuerte: 0.7
};

// =========================================================================
// 1. OST DE COMBATE (Por Mundo y por Tipo: NORMAL / ELITE / JEFE)
//    Podés poner 1 o varios nombres en cada array; al iniciar cada combate
//    se elige uno al azar y suena en bucle durante toda la pelea.
// =========================================================================
export const MUSICA_COMBATE_POR_MUNDO: Record<
    AmbientacionId,
    Record<TipoCombateMusica, string[]>
> = {
    BRAWL_STARS: {
        NORMAL: [
            // "brawl_combate_1",
            // "brawl_combate_2"
        ],
        ELITE: [
            // "brawl_elite_1"
        ],
        JEFE: [
            // "brawl_jefe_1"
        ]
    },
    CLASH_ROYALE: {
        NORMAL: [
            // "clash_combate_1",
            // "clash_combate_2"
        ],
        ELITE: [
            // "clash_elite_1"
        ],
        JEFE: [
            // "clash_jefe_1"
        ]
    },
    POKEMON: {
        NORMAL: [
            // "pokemon_combate_1",
            // "pokemon_combate_2"
        ],
        ELITE: [
            // "pokemon_elite_1"
        ],
        JEFE: [
            // "pokemon_jefe_1"
        ]
    }
};

// =========================================================================
// 2. OST DE FASES POR MUNDO (Opcional — tiene prioridad sobre el global)
//    Ideal si querés que el Mapa, Fogata, Cofre, Interrogante o Tienda
//    tengan música distinta según el mundo actual.
// =========================================================================
export const MUSICA_FASES_POR_MUNDO: Record<
    AmbientacionId,
    Partial<Record<FaseNoCombate, string[]>>
> = {
    BRAWL_STARS: {
        MAP: [
            // "brawl_mapa_1"
        ],
        CAMPFIRE: [],
        CHEST: [],
        EVENT: [],
        SHOP: []
    },
    CLASH_ROYALE: {
        MAP: [
            // "clash_mapa_1"
        ],
        CAMPFIRE: [],
        CHEST: [],
        EVENT: [],
        SHOP: []
    },
    POKEMON: {
        MAP: [
            // "pokemon_mapa_1"
        ],
        CAMPFIRE: [],
        CHEST: [],
        EVENT: [],
        SHOP: []
    }
};

// =========================================================================
// 3. OST GLOBAL POR FASE (Respaldo si el mundo actual dejó esa fase vacía)
// =========================================================================
export const MUSICA_FASES_GLOBAL: Partial<Record<FaseNoCombate, string[]>> = {
    LOBBY: [
        // "lobby_tema_1"
    ],
    MAP: [
        // "mapa_generico_1"
    ],
    CAMPFIRE: [
        // "fogata_1",
        // "fogata_2"
    ],
    CHEST: [
        // "cofre_1"
    ],
    EVENT: [
        // "interrogante_1",
        // "interrogante_2"
    ],
    SHOP: [
        // "tienda_1"
    ],
    REWARD: [
        // Si lo dejás vacío, sigue sonando la música del combate que acabás de ganar
    ],
    VICTORY: [
        // "victoria_1"
    ],
    DEFEAT: [
        // "derrota_1"
    ]
};

/**
 * Devuelve la lista de OST correspondiente al estado actual.
 * Prioridad en no-combate: lista del mundo actual -> lista global.
 */
export function obtenerListaOstParaEstado(
    fase: FaseSala,
    ambientacion: AmbientacionId,
    esElite: boolean,
    esJefe: boolean
): string[] {
    if (fase === "COMBAT") {
        const tipo: TipoCombateMusica = esJefe ? "JEFE" : esElite ? "ELITE" : "NORMAL";
        const porMundo = MUSICA_COMBATE_POR_MUNDO[ambientacion];
        if (!porMundo) return [];

        const listaTipo = porMundo[tipo];
        if (listaTipo && listaTipo.length > 0) return listaTipo;

        // Respaldo útil: si todavía no cargaste OST de ELITE o JEFE, usa los de NORMAL del mismo mundo
        return porMundo.NORMAL || [];
    }

    const listaMundo = MUSICA_FASES_POR_MUNDO[ambientacion]?.[fase];
    if (listaMundo && listaMundo.length > 0) {
        return listaMundo;
    }

    return MUSICA_FASES_GLOBAL[fase] || [];
}