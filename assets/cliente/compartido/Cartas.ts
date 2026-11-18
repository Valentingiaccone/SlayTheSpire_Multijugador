import { CARTAS_COMBATE } from "./AlmacenCartas/CartasCombate";
import { CARTAS_VENENO } from "./AlmacenCartas/CartasVeneno";
import { CARTAS_MALDICION } from "./AlmacenCartas/CartasMaldicion";
import { ClaseId, PersonajeId, PERSONAJES_INFO } from "./GameTypes";
import { DescriptorEfecto, EstadoId, IEfecto, TipoEfecto, TipoObjetivo } from "./CondicionesYEfectos";

export type { EstadoId, IEfecto, TipoEfecto, TipoObjetivo, DescriptorEfecto };
export type TipoCartaId = "ATAQUE" | "HABILIDAD" | "PODER" | "MALDICION";

export interface IMejoraCartaConfig {
    nombre?: string;
    costo?: number;
    descripcion: string;
    efectos: DescriptorEfecto[];
}

export interface ICartaData {
    id: string;
    nombre: string;
    costo: number;
    descripcion: string;
    sprite: string;
    clase: ClaseId;
    tipo: TipoCartaId;
    enPoolRecompensa: boolean;
    precioTienda?: number;
    objetivoSeleccion?: "ENEMIGO" | "ALIADO";
    injugable?: boolean;
    eterea?: boolean;
    efectos: DescriptorEfecto[];
    efectosFinTurnoEnMano?: DescriptorEfecto[];
    mejora?: IMejoraCartaConfig;
    // Campos autogenerados al construir el catálogo:
    esMejorada?: boolean;
    idMejora?: string;
    idBase?: string;
}

const TODAS_LAS_CARTAS_BASE: ICartaData[] = [
    ...CARTAS_COMBATE,
    ...CARTAS_VENENO,
    ...CARTAS_MALDICION
];

export const CATALOGO_CARTAS: Record<string, ICartaData> = {};

for (const base of TODAS_LAS_CARTAS_BASE) {
    if (CATALOGO_CARTAS[base.id]) {
        console.error(`[Cartas] ¡ID duplicado detectado!: "${base.id}"`);
    }

    const tieneMejora = Boolean(base.mejora);
    const idMejorada = tieneMejora ? `${base.id}+` : undefined;

    const cartaNormal: ICartaData = {
        ...base,
        precioTienda: base.precioTienda ?? 55,
        esMejorada: false,
        idMejora: idMejorada,
        idBase: base.id
    };

    CATALOGO_CARTAS[cartaNormal.id] = cartaNormal;

    if (base.mejora && idMejorada) {
        const cartaMejorada: ICartaData = {
            ...base,
            id: idMejorada,
            nombre: base.mejora.nombre || `${base.nombre}+`,
            costo: base.mejora.costo ?? base.costo,
            descripcion: base.mejora.descripcion,
            efectos: base.mejora.efectos,
            enPoolRecompensa: false,
            precioTienda: Math.floor((base.precioTienda ?? 55) * 1.5),
            esMejorada: true,
            idMejora: undefined,
            idBase: base.id,
            mejora: undefined
        };
        CATALOGO_CARTAS[cartaMejorada.id] = cartaMejorada;
    }
}

export function puedeMejorarseCarta(cartaId: string): boolean {
    const data = CATALOGO_CARTAS[cartaId];
    return Boolean(data && !data.esMejorada && data.idMejora && CATALOGO_CARTAS[data.idMejora]);
}

export function obtenerCartaMejorada(cartaId: string): ICartaData | undefined {
    const data = CATALOGO_CARTAS[cartaId];
    if (!data || !data.idMejora) return undefined;
    return CATALOGO_CARTAS[data.idMejora];
}

export function obtenerPrecioCarta(cartaId: string): number {
    return CATALOGO_CARTAS[cartaId]?.precioTienda ?? 55;
}

export function obtenerMazoInicial(personajeId: string): string[] {
    const info = PERSONAJES_INFO[personajeId as PersonajeId];
    return info ? [...info.mazoInicial] : [];
}

export function obtenerMaldicionAleatoria(): string {
    if (CARTAS_MALDICION.length === 0) return "maldicion_herida";
    const idx = Math.floor(Math.random() * CARTAS_MALDICION.length);
    return CARTAS_MALDICION[idx].id;
}

export function generarOpcionesRecompensa(personajeId: PersonajeId, cantidad = 3): string[] {
    const infoPersonaje = PERSONAJES_INFO[personajeId];
    const clasesPermitidas: string[] = infoPersonaje ? [...infoPersonaje.clases] : ["combate"];

    const pool = Object.values(CATALOGO_CARTAS)
        .filter((carta) =>
            carta.enPoolRecompensa !== false &&
            !carta.esMejorada &&
            carta.tipo !== "MALDICION" &&
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