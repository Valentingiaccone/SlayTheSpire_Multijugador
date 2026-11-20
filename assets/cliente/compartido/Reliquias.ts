import { ClaseId, PERSONAJES_INFO, PersonajeId } from "./GameTypes";
import { DescriptorCondicion, DescriptorEfecto, EncantamientoId } from "./CondicionesYEfectos";
import { CalidadCarta, TipoCartaId } from "./Cartas";
import { RELIQUIAS_INICIALES } from "./AlmacenReliquias/ReliquiasIniciales";
import { RELIQUIAS_NEUTRALES } from "./AlmacenReliquias/ReliquiasNeutrales";
import { RELIQUIAS_LADRON } from "./AlmacenReliquias/ReliquiasLadron";
import { RELIQUIAS_COMBATE } from "./AlmacenReliquias/ReliquiasCombate";
import { RELIQUIAS_ASESINO } from "./AlmacenReliquias/ReliquiasAsesino";

export type CalidadReliquia = "INICIAL" | "COMUN" | "EPICA" | "LEGENDARIA" | "ESPECIAL";
export type ContextoGeneracionReliquias = "ELITE" | "COFRE" | "TIENDA" | "JEFE" | "EVENTO";

export type TriggerReliquia =
    | "AL_INICIAR_COMBATE"
    | "AL_INICIAR_TURNO"
    | "AL_JUGAR_CARTA"
    | "AL_TERMINAR_TURNO"
    | "AL_RECIBIR_DANIO"
    | "AL_INFLIGIR_DANIO"
    | "AL_MORIR_ENEMIGO"
    | "AL_FINALIZAR_COMBATE"
    | "AL_RECOGER"
    | "AL_INGRESAR_FOGATA"
    | "PASIVA";

export type IConfigContadorReliquia =
    | {
          modo: "ACUMULAR_CARTAS";
          meta: number;
          filtroTipoCarta?: TipoCartaId;
          reiniciarCadaTurno?: boolean;
      }
    | {
          modo: "TURNO_CICLO" | "TURNO_OBJETIVO";
          meta: number;
      }
    | {
          modo: "CARGAS";
          valorInicial: number;
      };

export type DescriptorEfectoAlRecoger =
    | { tipo: "MEJORAR_CARTAS_MAZO_AZAR"; cantidad: number; filtroTipo: TipoCartaId | "CUALQUIERA" }
    | { tipo: "AUMENTAR_HP_MAX_Y_CURAR"; valor: number }
    | { tipo: "GANAR_CARTA_CALIDAD_AZAR"; calidad: CalidadCarta }
    | { tipo: "REEMPLAZAR_RELIQUIA_SI_TIENE"; reliquiaOrigen: string; reliquiaDestino: string }
    | { tipo: "OTORGAR_RELIQUIAS_ALEATORIAS"; comunes: number; epicas: number; legendarias?: number }
    | { tipo: "INICIAR_ENCANTAR_CARTA"; encantamiento: EncantamientoId; cantidad: number }
    | { tipo: "INICIAR_ELIMINAR_CARTAS"; cantidadMaxima: number };

export type DescriptorModificadorPasivo =
    | { tipo: "OPCION_CARTA_RECOMPENSA_EXTRA"; valor: number }
    | { tipo: "COFRE_LEGENDARIO_CARGAS" }
    | { tipo: "CURAR_AL_ENTRAR_FOGATA_POR_MAZO"; cadaCuantasCartas: number; hpPorTramo: number }
    | { tipo: "ORO_POR_HP_PERDIDO"; valor: number }
    | { tipo: "PROBABILIDAD_DOBLE_ORO"; probabilidad: number }
    | { tipo: "ESCUDO_ORO_AL_PERDER_HP"; oroPorHp: number };

export interface IReliquiaData {
    id: string;
    nombre: string;
    descripcion: string;
    icono: string;
    clase: ClaseId | "neutral";
    calidad: CalidadReliquia;
    enPoolRecompensa: boolean;
    precioTienda?: number;
    trigger: TriggerReliquia;
    condicion?: DescriptorCondicion;
    contadorConfig?: IConfigContadorReliquia;
    efectos: DescriptorEfecto[];
    efectosAlRecoger?: DescriptorEfectoAlRecoger[];
    modificadorPasivo?: DescriptorModificadorPasivo;
}

// ================= VARIABLES EDITABLES DE RAREZAS Y PRECIOS =================
export const PRECIOS_RELIQUIA_POR_CALIDAD: Record<CalidadReliquia, number> = {
    INICIAL: 150,
    COMUN: 135,
    EPICA: 210,
    LEGENDARIA: 300,
    ESPECIAL: 250
};

export interface IProbabilidadesReliquia {
    COMUN: number;
    EPICA: number;
    LEGENDARIA: number;
}

export const PROBABILIDADES_RELIQUIA: Record<ContextoGeneracionReliquias, IProbabilidadesReliquia> = {
    ELITE: { COMUN: 70, EPICA: 25, LEGENDARIA: 5 },
    COFRE: { COMUN: 70, EPICA: 25, LEGENDARIA: 5 },
    TIENDA: { COMUN: 70, EPICA: 25, LEGENDARIA: 5 },
    EVENTO: { COMUN: 70, EPICA: 25, LEGENDARIA: 5 },
    JEFE: { COMUN: 0, EPICA: 65, LEGENDARIA: 35 }
};

const TODAS_LAS_RELIQUIAS: IReliquiaData[] = [
    ...RELIQUIAS_INICIALES,
    ...RELIQUIAS_NEUTRALES,
    ...RELIQUIAS_LADRON,
    ...RELIQUIAS_COMBATE,
    ...RELIQUIAS_ASESINO
];

export const CATALOGO_RELIQUIAS: Record<string, IReliquiaData> = {};

for (const rel of TODAS_LAS_RELIQUIAS) {
    if (CATALOGO_RELIQUIAS[rel.id]) {
        console.error(`[Reliquias] ¡ID duplicado detectado!: "${rel.id}"`);
    }
    CATALOGO_RELIQUIAS[rel.id] = {
        ...rel,
        precioTienda: rel.precioTienda ?? PRECIOS_RELIQUIA_POR_CALIDAD[rel.calidad]
    };
}

export function obtenerPrecioReliquia(reliquiaId: string): number {
    const data = CATALOGO_RELIQUIAS[reliquiaId];
    if (!data) return PRECIOS_RELIQUIA_POR_CALIDAD.COMUN;
    return data.precioTienda ?? PRECIOS_RELIQUIA_POR_CALIDAD[data.calidad];
}

export interface IPortadorReliquiasMinimo {
    personajeId: PersonajeId | string;
    reliquias?: Iterable<string>;
    reliquiaRecompensa?: string;
}

function sortearCalidadReliquia(contexto: ContextoGeneracionReliquias): "COMUN" | "EPICA" | "LEGENDARIA" {
    const probs = PROBABILIDADES_RELIQUIA[contexto] || PROBABILIDADES_RELIQUIA.ELITE;
    const total = probs.COMUN + probs.EPICA + probs.LEGENDARIA;
    const tirada = Math.random() * Math.max(1, total);

    if (tirada < probs.LEGENDARIA) return "LEGENDARIA";
    if (tirada < probs.LEGENDARIA + probs.EPICA) return "EPICA";
    return "COMUN";
}

export function obtenerReliquiasRecompensa(
    jugadoresMap: { forEach(cb: (j: IPortadorReliquiasMinimo) => void): void },
    cantidad: number,
    personajeFiltro?: PersonajeId,
    contexto: ContextoGeneracionReliquias = "ELITE",
    forzarCalidad?: "COMUN" | "EPICA" | "LEGENDARIA",
    excluirIdsExtras?: Set<string>
): string[] {
    const yaObtenidas = new Set<string>(excluirIdsExtras ? Array.from(excluirIdsExtras) : []);
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
            for (const rId of j.reliquias) yaObtenidas.add(rId);
        }
        if (j.reliquiaRecompensa) {
            yaObtenidas.add(j.reliquiaRecompensa);
        }
    });

    const candidatasPool = Object.values(CATALOGO_RELIQUIAS).filter(
        (r) => r.enPoolRecompensa && clasesValidas.has(r.clase)
    );

    const resultado: string[] = [];

    for (let i = 0; i < cantidad; i++) {
        const calidadBuscada = forzarCalidad || sortearCalidadReliquia(contexto);

        // 1. Calidad buscada, sin repetir
        let pool = candidatasPool.filter(
            (r) => r.calidad === calidadBuscada && !yaObtenidas.has(r.id)
        );
        // 2. Cualquier calidad válida, sin repetir
        if (pool.length === 0) {
            pool = candidatasPool.filter((r) => !yaObtenidas.has(r.id));
        }
        // 3. Fallback: misma calidad aunque repetida
        if (pool.length === 0) {
            pool = candidatasPool.filter((r) => r.calidad === calidadBuscada);
        }
        // 4. Fallback total
        if (pool.length === 0) {
            pool = candidatasPool;
        }
        if (pool.length === 0) break;

        const elegida = pool[Math.floor(Math.random() * pool.length)];
        resultado.push(elegida.id);
        yaObtenidas.add(elegida.id);
    }

    return resultado;
}