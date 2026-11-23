import { CARTAS_COMBATE } from "./AlmacenCartas/CartasCombate";
import { CARTAS_VENENO } from "./AlmacenCartas/CartasVeneno";
import { CARTAS_LADRON } from "./AlmacenCartas/CartasLadron";
import { CARTAS_ASESINO } from "./AlmacenCartas/CartasAsesino";
import { CARTAS_MALDICION } from "./AlmacenCartas/CartasMaldicion";
import { ClaseId, PersonajeId, PERSONAJES_INFO } from "./GameTypes";
import {
    DescriptorEfecto,
    EncantamientoId,
    EstadoId,
    IEfecto,
    TipoEfecto,
    TipoObjetivo
} from "./CondicionesYEfectos";

export type { EstadoId, IEfecto, TipoEfecto, TipoObjetivo, DescriptorEfecto, EncantamientoId };
export type TipoCartaId = "ATAQUE" | "HABILIDAD" | "PODER" | "MALDICION";
export type CalidadCarta = "BASICA" | "COMUN" | "EPICA" | "LEGENDARIA" | "MALDICION";
export type ContextoGeneracionCartas = "COMBATE" | "ELITE" | "JEFE" | "TIENDA" | "EVENTO";

export interface IMejoraCartaConfig {
    nombre?: string;
    costo?: number;
    costoOro?: number;
    agotar?: boolean;
    minimoOtrasCartasEnMano?: number;
    descripcion: string;
    efectos: DescriptorEfecto[];
}

export interface ICartaData {
    id: string;
    nombre: string;
    costo: number;
    costoOro?: number;
    reduccionCostoPorHpPerdido?: boolean;
    requiereManoSoloAtaques?: boolean;
    minimoOtrasCartasEnMano?: number;
    descripcion: string;
    sprite: string;
    clase: ClaseId;
    calidad?: CalidadCarta;
    tipo: TipoCartaId;
    enPoolRecompensa: boolean;
    precioTienda?: number;
    objetivoSeleccion?: "ENEMIGO" | "ALIADO";
    soloMultijugador?: boolean;
    agotar?: boolean;
    injugable?: boolean;
    eterea?: boolean;
    eterno?: boolean;
    innato?: boolean;
    duplicarAlRobar?: boolean;
    esDaga?: boolean;
    efectos: DescriptorEfecto[];
    efectosFinTurnoEnMano?: DescriptorEfecto[];
    mejora?: IMejoraCartaConfig;
    esMejorada?: boolean;
    idMejora?: string;
    idBase?: string;
}

export interface IInstanciaCartaParseada {
    cartaIdBase: string;
    encantamiento?: EncantamientoId;
    gratisEsteTurno: boolean;
}

const PRECIOS_POR_CALIDAD: Record<CalidadCarta, number> = {
    BASICA: 45,
    COMUN: 55,
    EPICA: 95,
    LEGENDARIA: 150,
    MALDICION: 0
};

const TODAS_LAS_CARTAS_BASE: ICartaData[] = [
    ...CARTAS_COMBATE,
    ...CARTAS_VENENO,
    ...CARTAS_LADRON,
    ...CARTAS_ASESINO,
    ...CARTAS_MALDICION
];

export const CATALOGO_CARTAS: Record<string, ICartaData> = {};

for (const base of TODAS_LAS_CARTAS_BASE) {
    if (CATALOGO_CARTAS[base.id]) {
        console.error(`[Cartas] ¡ID duplicado detectado!: "${base.id}"`);
    }

    const calidadFinal: CalidadCarta =
        base.calidad ||
        (base.tipo === "MALDICION" ? "MALDICION" : base.enPoolRecompensa ? "COMUN" : "BASICA");

    const precioBase = base.precioTienda ?? PRECIOS_POR_CALIDAD[calidadFinal];
    const esSoloMulti = Boolean(base.soloMultijugador || base.objetivoSeleccion === "ALIADO");

    const tieneMejora = Boolean(base.mejora);
    const idMejorada = tieneMejora ? `${base.id}+` : undefined;

    const cartaNormal: ICartaData = {
        ...base,
        calidad: calidadFinal,
        soloMultijugador: esSoloMulti,
        precioTienda: precioBase,
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
            costoOro: base.mejora.costoOro ?? base.costoOro,
            agotar: base.mejora.agotar ?? base.agotar,
            minimoOtrasCartasEnMano:
                base.mejora.minimoOtrasCartasEnMano ?? base.minimoOtrasCartasEnMano,
            descripcion: base.mejora.descripcion,
            efectos: base.mejora.efectos,
            calidad: calidadFinal,
            soloMultijugador: esSoloMulti,
            enPoolRecompensa: false,
            precioTienda: Math.floor(precioBase * 1.4),
            esMejorada: true,
            idMejora: undefined,
            idBase: base.id,
            mejora: undefined
        };
        CATALOGO_CARTAS[cartaMejorada.id] = cartaMejorada;
    }
}

export function parsearCartaInstancia(rawId: string): IInstanciaCartaParseada {
    if (!rawId) return { cartaIdBase: "", gratisEsteTurno: false };
    let texto = rawId;
    let gratisEsteTurno = false;

    if (texto.endsWith("~0")) {
        gratisEsteTurno = true;
        texto = texto.slice(0, -2);
    }

    const idxArroba = texto.indexOf("@");
    if (idxArroba !== -1) {
        return {
            cartaIdBase: texto.slice(0, idxArroba),
            encantamiento: texto.slice(idxArroba + 1) as EncantamientoId,
            gratisEsteTurno
        };
    }

    return { cartaIdBase: texto, gratisEsteTurno };
}

export function construirIdInstanciaCarta(
    cartaIdBase: string,
    encantamiento?: EncantamientoId,
    gratisEsteTurno: boolean = false
): string {
    let res = cartaIdBase;
    if (encantamiento) res += `@${encantamiento}`;
    if (gratisEsteTurno) res += "~0";
    return res;
}

export function obtenerDataCarta(rawId: string): ICartaData | undefined {
    const { cartaIdBase } = parsearCartaInstancia(rawId);
    return CATALOGO_CARTAS[cartaIdBase];
}

export function obtenerEncantamientoCarta(rawId: string): EncantamientoId | undefined {
    return parsearCartaInstancia(rawId).encantamiento;
}

export function esCartaGratisEsteTurno(rawId: string): boolean {
    return parsearCartaInstancia(rawId).gratisEsteTurno;
}

export function limpiarMarcadoresTemporalesCarta(rawId: string): string {
    const { cartaIdBase, encantamiento } = parsearCartaInstancia(rawId);
    return construirIdInstanciaCarta(cartaIdBase, encantamiento, false);
}

export function marcarCartaGratisEsteTurno(rawId: string): string {
    const { cartaIdBase, encantamiento } = parsearCartaInstancia(rawId);
    return construirIdInstanciaCarta(cartaIdBase, encantamiento, true);
}

export function puedeEncantarseCarta(rawId: string): boolean {
    const parsed = parsearCartaInstancia(rawId);
    return Boolean(CATALOGO_CARTAS[parsed.cartaIdBase] && !parsed.encantamiento);
}

export function aplicarEncantamientoCarta(rawId: string, encantamiento: EncantamientoId): string {
    const parsed = parsearCartaInstancia(rawId);
    return construirIdInstanciaCarta(parsed.cartaIdBase, encantamiento, parsed.gratisEsteTurno);
}

export function puedeMejorarseCarta(rawId: string): boolean {
    const data = obtenerDataCarta(rawId);
    return Boolean(data && !data.esMejorada && data.idMejora && CATALOGO_CARTAS[data.idMejora]);
}

export function obtenerCartaMejorada(rawId: string): ICartaData | undefined {
    const data = obtenerDataCarta(rawId);
    if (!data || !data.idMejora) return undefined;
    return CATALOGO_CARTAS[data.idMejora];
}

export function obtenerIdCartaMejoradaPreservandoExtras(rawId: string): string | undefined {
    const parsed = parsearCartaInstancia(rawId);
    const mejorada = obtenerCartaMejorada(rawId);
    if (!mejorada) return undefined;
    return construirIdInstanciaCarta(mejorada.id, parsed.encantamiento, parsed.gratisEsteTurno);
}

export function obtenerPrecioCarta(rawId: string): number {
    const data = obtenerDataCarta(rawId);
    if (!data) return 55;
    return data.precioTienda ?? PRECIOS_POR_CALIDAD[data.calidad || "COMUN"];
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

export function obtenerPoderAleatorio(
    personajeId: PersonajeId,
    cantidadJugadores: number = 2
): string | undefined {
    const infoPersonaje = PERSONAJES_INFO[personajeId];
    const clasesPermitidas: string[] = infoPersonaje ? [...infoPersonaje.clases] : [];
    const esJuegoSolitario = cantidadJugadores <= 1;

    let candidatas = Object.values(CATALOGO_CARTAS).filter(
        (c) =>
            c.tipo === "PODER" &&
            !c.esMejorada &&
            c.enPoolRecompensa &&
            clasesPermitidas.includes(c.clase) &&
            (!esJuegoSolitario || !c.soloMultijugador)
    );

    if (candidatas.length === 0) {
        candidatas = Object.values(CATALOGO_CARTAS).filter(
            (c) =>
                c.tipo === "PODER" &&
                !c.esMejorada &&
                c.enPoolRecompensa &&
                (!esJuegoSolitario || !c.soloMultijugador)
        );
    }

    if (candidatas.length === 0) return undefined;
    return candidatas[Math.floor(Math.random() * candidatas.length)].id;
}

export function generarCartaPorCalidad(
    personajeId: PersonajeId,
    calidad: CalidadCarta,
    cantidadJugadores: number = 2
): string | undefined {
    const infoPersonaje = PERSONAJES_INFO[personajeId];
    const clasesPermitidas: string[] = infoPersonaje ? [...infoPersonaje.clases] : ["combate"];
    const esJuegoSolitario = cantidadJugadores <= 1;

    let candidatas = Object.values(CATALOGO_CARTAS).filter(
        (c) =>
            c.enPoolRecompensa &&
            !c.esMejorada &&
            c.calidad === calidad &&
            clasesPermitidas.includes(c.clase) &&
            (!esJuegoSolitario || !c.soloMultijugador)
    );

    if (candidatas.length === 0) {
        candidatas = Object.values(CATALOGO_CARTAS).filter(
            (c) => c.enPoolRecompensa && !c.esMejorada && c.calidad === calidad
        );
    }

    if (candidatas.length === 0) return undefined;
    return candidatas[Math.floor(Math.random() * candidatas.length)].id;
}

function sortearCalidadPorContexto(contexto: ContextoGeneracionCartas): CalidadCarta {
    if (contexto === "JEFE") {
        return "LEGENDARIA";
    }

    const tirada = Math.random() * 100;

    if (contexto === "TIENDA") {
        if (tirada < 5) return "LEGENDARIA";
        if (tirada < 25) return "EPICA";
        return "COMUN";
    }

    if (contexto === "ELITE") {
        if (tirada < 12) return "LEGENDARIA";
        if (tirada < 45) return "EPICA";
        return "COMUN";
    }

    if (tirada < 3) return "LEGENDARIA";
    if (tirada < 23) return "EPICA";
    return "COMUN";
}

export function generarOpcionesRecompensa(
    personajeId: PersonajeId,
    cantidad = 3,
    contexto: ContextoGeneracionCartas = "COMBATE",
    cantidadJugadores: number = 2
): string[] {
    const infoPersonaje = PERSONAJES_INFO[personajeId];
    const clasesPermitidas: string[] = infoPersonaje ? [...infoPersonaje.clases] : ["combate"];
    const esJuegoSolitario = cantidadJugadores <= 1;

    const candidatasValidas = Object.values(CATALOGO_CARTAS).filter((carta) => {
        if (!carta.enPoolRecompensa || carta.esMejorada || carta.tipo === "MALDICION") return false;
        if (!clasesPermitidas.includes(carta.clase)) return false;
        if (esJuegoSolitario && carta.soloMultijugador) return false;
        return true;
    });

    if (candidatasValidas.length === 0) return [];

    const elegidas: string[] = [];
    const usadas = new Set<string>();

    for (let i = 0; i < cantidad; i++) {
        const calidadBuscada = sortearCalidadPorContexto(contexto);

        let poolCalidad = candidatasValidas.filter(
            (c) => c.calidad === calidadBuscada && !usadas.has(c.id)
        );

        if (poolCalidad.length === 0) {
            poolCalidad = candidatasValidas.filter((c) => !usadas.has(c.id));
        }

        if (poolCalidad.length === 0) {
            poolCalidad = candidatasValidas;
        }

        const idx = Math.floor(Math.random() * poolCalidad.length);
        const seleccionada = poolCalidad[idx];
        elegidas.push(seleccionada.id);
        usadas.add(seleccionada.id);
    }

    return elegidas;
}