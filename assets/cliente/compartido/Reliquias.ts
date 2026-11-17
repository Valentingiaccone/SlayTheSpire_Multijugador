import { ClaseId, PERSONAJES_INFO, PersonajeId } from "./GameTypes";
import { IEfecto, ICartaData } from "./Cartas";

export type TriggerReliquia =
    | "AL_INICIAR_COMBATE"
    | "AL_INICIAR_TURNO"
    | "AL_JUGAR_CARTA"
    | "AL_TERMINAR_TURNO"
    | "AL_RECIBIR_DANIO"
    | "AL_INFLIGIR_DANIO"
    | "AL_FINALIZAR_COMBATE"

/**
 * Contexto rico que reciben TODAS las reliquias aunque no usen todos los parámetros.
 * Si mañana inventás una reliquia con una condición nueva, ya tenés los datos acá.
 */
export interface IReliquiaContexto {
    state: any;
    portador: any; // PlayerState dueño de la reliquia
    turnoNumero: number;
    pisoActual: number;
    esElite: boolean;
    esJefe: boolean;
    // Datos al jugar carta
    cartaJugada?: ICartaData;
    objetivoId?: string;
    cartasJugadasTurno: number;
    ataquesJugadosTurno: number;
    cartasJugadasCombate: number;
    // Datos al recibir daño
    danioRecibido?: number;
    atacante?: any;
    // Datos al infligir daño?
    danioInfligido?: number;
}

export interface IReliquiaData {
    id: string;
    nombre: string;
    descripcion: string;
    icono: string;
    clase: ClaseId | "neutral";
    enPoolRecompensa: boolean; // false = reliquia inicial (no sale en cofres ni élites)
    trigger: TriggerReliquia;
    condicion?: (ctx: IReliquiaContexto) => boolean;
    efectos: IEfecto[];
}

export const CATALOGO_RELIQUIAS: Record<string, IReliquiaData> = {
    // ================= RELIQUIAS INICIALES =================
    bandita: {
        id: "bandita",
        nombre: "Bandita",
        descripcion: "Al finalizar un combate, cura 8 de HP.",
        icono: "reliquia_bandita",
        clase: "shelly",
        enPoolRecompensa: false,
        trigger: "AL_FINALIZAR_COMBATE",
        efectos: [{ tipo: "CURAR_HP", valor: 8, objetivo: "PROPIO" }]
    },
    cocoroch: {
        id: "cocoroch",
        nombre: "Cocoroch",
        descripcion: "Cada vez que inflijas daño a un enemigo, le aplica 1 de Veneno.",
        icono: "reliquia_cocoroch",
        clase: "crow",
        enPoolRecompensa: false,
        trigger: "AL_INFLIGIR_DANIO",
        efectos: [{ tipo: "APLICAR_ESTADO", valor: 1, objetivo: "ENEMIGO", estadoId: "VENENO" }]
    },

    // ================= RELIQUIAS DE ASESINO ===============
    dinamita: {
        id: "dinamita",
        nombre: "Dinamita",
        descripcion: "Cada 3 cartas que juegues en un mismo turno, inflige 5 de daño a todos los enemigos.",
        icono: "reliquia_dinamita",
        clase: "asesino",
        enPoolRecompensa: true,
        trigger: "AL_JUGAR_CARTA",
        condicion: (ctx) => ctx.cartasJugadasTurno > 0 && ctx.cartasJugadasTurno % 3 === 0,
        efectos: [{ tipo: "DANIO", valor: 5, objetivo: "TODOS_ENEMIGOS" }]
    },

    // ================= RELIQUIAS DE COMBATE ===============
    sangre_vengativa: {
        id: "sangre_vengativa",
        nombre: "Sangre Vengativa",
        descripcion: "Cada vez que perdés HP por un ataque enemigo, ganás +1 de Fuerza.",
        icono: "reliquia_sangre_vengativa",
        clase: "combate",
        enPoolRecompensa: true,
        trigger: "AL_RECIBIR_DANIO",
        condicion: (ctx) => (ctx.danioRecibido || 0) > 0,
        efectos: [{ tipo: "APLICAR_ESTADO", valor: 1, objetivo: "PROPIO", estadoId: "FUERZA" }]
    },

    // ================= RELIQUIAS DEL POOL =================
    distintivo_abogado: {
        id: "distintivo_abogado",
        nombre: "Distintivo de Abogado",
        descripcion: "Al inicio de cada combate, gana 10 de bloqueo.",
        icono: "reliquia_distintivo_abogado",
        clase: "neutral",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "BLOQUEO", valor: 10, objetivo: "PROPIO" }]
    },
    lluvia_espinas: {
        id: "lluvia_espinas",
        nombre: "Lluvia de Espinas",
        descripcion: "Al inicio del combate, gana 3 de Espinas (devuelve daño al ser atacado).",
        icono: "reliquia_espinas",
        clase: "neutral",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "APLICAR_ESTADO", valor: 3, objetivo: "PROPIO", estadoId: "ESPINAS" }]
    },
    mancuernas: {
        id: "mancuernas",
        nombre: "Mancuernas",
        descripcion: "Si terminás tu turno sin haber jugado ataques, ganás +2 de Fuerza por el resto del combate.",
        icono: "reliquia_mancuernas",
        clase: "neutral",
        enPoolRecompensa: true,
        trigger: "AL_TERMINAR_TURNO",
        condicion: (ctx) => ctx.ataquesJugadosTurno === 0,
        efectos: [{ tipo: "APLICAR_ESTADO", valor: 2, objetivo: "PROPIO", estadoId: "FUERZA" }]
    },
    pala: {
        id: "pala",
        nombre: "Pala",
        descripcion: "Al inicio del combate, aplica 1 de Vulnerable a TODOS los enemigos.",
        icono: "reliquia_pala",
        clase: "neutral",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "APLICAR_ESTADO", valor: 1, objetivo: "TODOS_ENEMIGOS", estadoId: "VULNERABLE" }]
    },
    cofre_clash: {
        id: "cofre_clash",
        nombre: "Cofre de Clash Royale",
        descripcion: "Al comienzo del combate, roba 2 cartas adicionales.",
        icono: "reliquia_cofre_clash",
        clase: "neutral",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "ROBAR_CARTA", valor: 2, objetivo: "PROPIO" }]
    },
    girasol: {
        id: "girasol",
        nombre: "Girasol",
        descripcion: "Cada 3 turnos, gana 1 de Energía adicional.",
        icono: "reliquia_girasol",
        clase: "neutral",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        condicion: (ctx) => ctx.turnoNumero % 3 === 0,
        efectos: [{ tipo: "GANAR_ENERGIA", valor: 1, objetivo: "PROPIO" }]
    },
    spooky: {
        id: "spooky",
        nombre: "Spooky",
        descripcion: "En el turno 2 de cada combate, otorga 8 de bloqueo a TODOS los aliados.",
        icono: "reliquia_spooky",
        clase: "neutral",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        condicion: (ctx) => ctx.turnoNumero === 2,
        efectos: [{ tipo: "BLOQUEO", valor: 8, objetivo: "TODOS_ALIADOS" }]
    },
    oso_en_punto: {
        id: "oso_en_punto",
        nombre: "Las oso en punto",
        descripcion: "En el turno 8, inflige 50 de daño a todos los enemigos.",
        icono: "reliquia_oso_en_punto",
        clase: "neutral",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        condicion: (ctx) => ctx.turnoNumero === 8,
        efectos: [{ tipo: "DANIO", valor: 50, objetivo: "TODOS_ENEMIGOS" }]
    },
    sanacion: {
        id: "sanacion",
        nombre: "Sanacion",
        descripcion: "Al iniciar un combate, cura 2 de HP.",
        icono: "reliquia_sanacion",
        clase: "neutral",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "CURAR_HP", valor: 2, objetivo: "PROPIO" }]
    },
    elixir: {
        id: "elixir",
        nombre: "Elixir",
        descripcion: "Al iniciar un combate, gana 1 de energia.",
        icono: "reliquia_elixir",
        clase: "neutral",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "GANAR_ENERGIA", valor: 1, objetivo: "PROPIO" }]
    },
    reloj_par: {
        id: "reloj_par",
        nombre: "Reloj par",
        descripcion: "Al inicio de cada turno PAR, gana 4 de bloqueo.",
        icono: "reliquia_reloj_par",
        clase: "neutral",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        condicion: (ctx) => ctx.turnoNumero % 2 === 0,
        efectos: [{ tipo: "BLOQUEO", valor: 4, objetivo: "PROPIO" }]
    },
};

/**
 * Obtiene reliquias priorizando que no estén ya en manos de ningún jugador.
 * Si se acaban las reliquias únicas disponibles, rellena repitiendo del pool válido.
 */
export function obtenerReliquiasRecompensa(
    jugadoresMap: Map<string, any> | any,
    cantidad: number,
    personajeFiltro?: PersonajeId
): string[] {
    const yaObtenidas = new Set<string>();
    const clasesValidas = new Set<string>(["neutral"]);

    if (personajeFiltro && PERSONAJES_INFO[personajeFiltro]) {
        PERSONAJES_INFO[personajeFiltro].clases.forEach((c) => clasesValidas.add(c));
    } else {
        // Para un Cofre grupal, permitimos reliquias neutrales y de las clases de los jugadores presentes
        jugadoresMap.forEach((j: any) => {
            const info = PERSONAJES_INFO[j.personajeId as PersonajeId];
            info?.clases.forEach((c) => clasesValidas.add(c));
        });
    }

    jugadoresMap.forEach((j: any) => {
        if (j.reliquias) {
            j.reliquias.forEach((rId: string) => yaObtenidas.add(rId));
        }
        if (j.reliquiaRecompensa) {
            yaObtenidas.add(j.reliquiaRecompensa);
        }
    });

    const candidatasPool = Object.values(CATALOGO_RELIQUIAS).filter(
        (r) => r.enPoolRecompensa && clasesValidas.has(r.clase)
    );

    const noRepetidas = candidatasPool.filter((r) => !yaObtenidas.has(r.id)).map((r) => r.id);
    const todasValidas = candidatasPool.map((r) => r.id);

    mezclar(noRepetidas);
    mezclar(todasValidas);

    const resultado: string[] = [];
    for (const id of noRepetidas) {
        if (resultado.length >= cantidad) break;
        resultado.push(id);
    }

    // Fallback: si no alcanzaron las únicas, rellenamos permitiendo repetidas
    let idxFallback = 0;
    while (resultado.length < cantidad && todasValidas.length > 0) {
        resultado.push(todasValidas[idxFallback % todasValidas.length]);
        idxFallback++;
    }

    return resultado;
}

function mezclar(arr: string[]) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}