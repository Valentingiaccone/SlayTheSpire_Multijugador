import { ClaseId, PERSONAJES_INFO, PersonajeId } from "./GameTypes";
import { DescriptorCondicion, DescriptorEfecto } from "./CondicionesYEfectos";

export type TriggerReliquia =
    | "AL_INICIAR_COMBATE"
    | "AL_INICIAR_TURNO"
    | "AL_JUGAR_CARTA"
    | "AL_TERMINAR_TURNO"
    | "AL_RECIBIR_DANIO"
    | "AL_INFLIGIR_DANIO"
    | "AL_MORIR_ENEMIGO"
    | "AL_FINALIZAR_COMBATE";

export interface IReliquiaData {
    id: string;
    nombre: string;
    descripcion: string;
    icono: string;
    clase: ClaseId | "neutral";
    enPoolRecompensa: boolean;
    precioTienda?: number;
    trigger: TriggerReliquia;
    condicion?: DescriptorCondicion;
    efectos: DescriptorEfecto[];
}

export const CATALOGO_RELIQUIAS: Record<string, IReliquiaData> = {
    bandita: {
        id: "bandita",
        nombre: "Bandita",
        descripcion: "Al finalizar un combate, cura 8 de HP.",
        icono: "reliquia_bandita",
        clase: "shelly",
        enPoolRecompensa: false,
        precioTienda: 140,
        trigger: "AL_FINALIZAR_COMBATE",
        efectos: [{ tipo: "CURAR_HP", valor: 8, objetivo: "PROPIO" }]
    },
    cocoroch: {
        id: "cocoroch",
        nombre: "Cocoroch",
        descripcion: "Cada vez que inflijas daño de ataque a un enemigo, le aplica 1 de Veneno.",
        icono: "reliquia_cocoroch",
        clase: "crow",
        enPoolRecompensa: false,
        precioTienda: 150,
        trigger: "AL_INFLIGIR_DANIO",
        efectos: [{ tipo: "APLICAR_ESTADO", valor: 1, objetivo: "ENEMIGO", estadoId: "VENENO" }]
    },
    dinamita: {
        id: "dinamita",
        nombre: "Dinamita",
        descripcion: "Cada 3 cartas que juegues en un mismo turno, inflige 5 de daño a todos los enemigos.",
        icono: "reliquia_dinamita",
        clase: "asesino",
        enPoolRecompensa: true,
        precioTienda: 150,
        trigger: "AL_JUGAR_CARTA",
        condicion: { tipo: "CARTAS_TURNO_MULTIPLO", divisor: 3 },
        efectos: [{ tipo: "DANIO", valor: 5, objetivo: "TODOS_ENEMIGOS", fuente: "RELIQUIA" }]
    },
    sangre_vengativa: {
        id: "sangre_vengativa",
        nombre: "Sangre Vengativa",
        descripcion: "Cada vez que perdés HP por un ataque enemigo, ganás +1 de Fuerza.",
        icono: "reliquia_sangre_vengativa",
        clase: "combate",
        enPoolRecompensa: true,
        precioTienda: 160,
        trigger: "AL_RECIBIR_DANIO",
        condicion: { tipo: "DANIO_RECIBIDO_MAYOR_A", minimo: 0 },
        efectos: [{ tipo: "APLICAR_ESTADO", valor: 1, objetivo: "PROPIO", estadoId: "FUERZA" }]
    },
    distintivo_abogado: {
        id: "distintivo_abogado",
        nombre: "Distintivo de Abogado",
        descripcion: "Al inicio de cada combate, gana 10 de bloqueo.",
        icono: "reliquia_distintivo_abogado",
        clase: "neutral",
        enPoolRecompensa: true,
        precioTienda: 125,
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
        precioTienda: 140,
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
        precioTienda: 155,
        trigger: "AL_TERMINAR_TURNO",
        condicion: { tipo: "ATAQUES_TURNO_IGUAL", cantidad: 0 },
        efectos: [{ tipo: "APLICAR_ESTADO", valor: 2, objetivo: "PROPIO", estadoId: "FUERZA" }]
    },
    pala: {
        id: "pala",
        nombre: "Pala",
        descripcion: "Al inicio del combate, aplica 1 de Vulnerable a TODOS los enemigos.",
        icono: "reliquia_pala",
        clase: "neutral",
        enPoolRecompensa: true,
        precioTienda: 135,
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
        precioTienda: 145,
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
        precioTienda: 165,
        trigger: "AL_INICIAR_TURNO",
        condicion: { tipo: "TURNO_MULTIPLO", divisor: 3 },
        efectos: [{ tipo: "GANAR_ENERGIA", valor: 1, objetivo: "PROPIO" }]
    },
    spooky: {
        id: "spooky",
        nombre: "Spooky",
        descripcion: "En el turno 2 de cada combate, otorga 8 de bloqueo a TODOS los aliados.",
        icono: "reliquia_spooky",
        clase: "neutral",
        enPoolRecompensa: true,
        precioTienda: 140,
        trigger: "AL_INICIAR_TURNO",
        condicion: { tipo: "TURNO_EXACTO", turno: 2 },
        efectos: [{ tipo: "BLOQUEO", valor: 8, objetivo: "TODOS_ALIADOS" }]
    },
    oso_en_punto: {
        id: "oso_en_punto",
        nombre: "Las oso en punto",
        descripcion: "En el turno 8, inflige 50 de daño a todos los enemigos.",
        icono: "reliquia_oso_en_punto",
        clase: "neutral",
        enPoolRecompensa: true,
        precioTienda: 150,
        trigger: "AL_INICIAR_TURNO",
        condicion: { tipo: "TURNO_EXACTO", turno: 8 },
        efectos: [{ tipo: "DANIO", valor: 50, objetivo: "TODOS_ENEMIGOS", fuente: "RELIQUIA" }]
    },
    sanacion: {
        id: "sanacion",
        nombre: "Sanación",
        descripcion: "Al iniciar un combate, cura 2 de HP.",
        icono: "reliquia_sanacion",
        clase: "neutral",
        enPoolRecompensa: true,
        precioTienda: 115,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "CURAR_HP", valor: 2, objetivo: "PROPIO" }]
    },
    elixir: {
        id: "elixir",
        nombre: "Elixir",
        descripcion: "Al iniciar un combate, gana 1 de energía.",
        icono: "reliquia_elixir",
        clase: "neutral",
        enPoolRecompensa: true,
        precioTienda: 155,
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
        precioTienda: 135,
        trigger: "AL_INICIAR_TURNO",
        condicion: { tipo: "TURNO_PARIDAD", esPar: true },
        efectos: [{ tipo: "BLOQUEO", valor: 4, objetivo: "PROPIO" }]
    }
};

export function obtenerPrecioReliquia(reliquiaId: string): number {
    return CATALOGO_RELIQUIAS[reliquiaId]?.precioTienda ?? 145;
}

export interface IPortadorReliquiasMinimo {
    personajeId: PersonajeId | string;
    reliquias?: Iterable<string>;
    reliquiaRecompensa?: string;
}

export function obtenerReliquiasRecompensa(
    jugadoresMap: { forEach(cb: (j: IPortadorReliquiasMinimo) => void): void },
    cantidad: number,
    personajeFiltro?: PersonajeId
): string[] {
    const yaObtenidas = new Set<string>();
    const clasesValidas = new Set<string>(["neutral"]);

    if (personajeFiltro && PERSONAJES_INFO[personajeFiltro]) {
        PERSONAJES_INFO[personajeFiltro].clases.forEach((c) => clasesValidas.add(c));
    } else {
        jugadoresMap.forEach((j) => {
            const info = PERSONAJES_INFO[j.personajeId as PersonajeId];
            info?.clases.forEach((c) => clasesValidas.add(c));
        });
    }

    jugadoresMap.forEach((j) => {
        if (j.reliquias) {
            for (const rId of j.reliquias) {
                yaObtenidas.add(rId);
            }
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