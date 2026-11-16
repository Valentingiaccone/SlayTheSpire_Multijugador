import { CARTAS_COMBATE } from "./AlmacenCartas/CartasCombate";
import { CARTAS_VENENO } from "./AlmacenCartas/CartasVeneno";
import { ClaseId, PersonajeId, PERSONAJES_INFO } from "./GameTypes";

export type TipoObjetivo = "ENEMIGO" | "TODOS_ENEMIGOS" | "ALIADO" | "TODOS_ALIADOS" | "PROPIO";
export type TipoEfecto = "DANIO" | "BLOQUEO" | "APLICAR_ESTADO" | "ROBAR_CARTA" | "GANAR_ENERGIA";
export type EstadoId = "FUERZA" | "VULNERABLE" | "DEBIL";
export type TipoCartaId = "ATAQUE" | "HABILIDAD" | "PODER"

export interface IEfecto {
    tipo: TipoEfecto;
    valor: number;
    objetivo: TipoObjetivo;
    estadoId?: EstadoId;
}

export interface ICartaData {
    id: string
    nombre: string
    costo: number
    descripcion: string
    sprite: string
    clase: ClaseId
    tipo: TipoCartaId
    enPoolRecompensa: boolean
    objetivoSeleccion?: "ENEMIGO" | "ALIADO"
    efectos: IEfecto[]
}

const TODAS_LAS_CARTAS: ICartaData[] = [
    ...CARTAS_COMBATE,
    ...CARTAS_VENENO
];

export const CATALOGO_CARTAS: Record<string, ICartaData> = {};

for (const carta of TODAS_LAS_CARTAS) {
    if (CATALOGO_CARTAS[carta.id]) {
        console.error(`[Cartas] ¡ID duplicado detectado!: "${carta.id}"`);
    }
    CATALOGO_CARTAS[carta.id] = carta;
}

export function obtenerMazoInicial(personajeId: string): string[] {
    const info = PERSONAJES_INFO[personajeId as PersonajeId];
    return info ? [...info.mazoInicial] : [];
}

export function generarOpcionesRecompensa(personajeId: PersonajeId, cantidad = 3): string[] {
    const infoPersonaje = PERSONAJES_INFO[personajeId];
    const clasesPermitidas = infoPersonaje ? infoPersonaje.clases : ["NEUTRAL"];

    // Filtra automáticamente todas las cartas válidas para las clases del personaje
    const pool = Object.values(CATALOGO_CARTAS)
        .filter((carta) =>
            carta.enPoolRecompensa !== false &&
            clasesPermitidas.includes(carta.clase)
        )
        .map((carta) => carta.id);

    const elegidas: string[] = [];
    while (elegidas.length < cantidad && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        elegidas.push(pool.splice(idx, 1)[0]);
    }
    return elegidas;
}