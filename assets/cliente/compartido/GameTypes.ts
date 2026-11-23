import { EstadoId, FuenteDanio } from "./CondicionesYEfectos";
import { EstadoNodoMapa, TipoNodoMapa } from "./Mapa";
import { AmbientacionId, TipoIntencion } from "./Enemigos";

export type FaseSala =
    | "LOBBY"
    | "MAP"
    | "COMBAT"
    | "REWARD"
    | "CHEST"
    | "CAMPFIRE"
    | "SHOP"
    | "EVENT"
    | "VICTORY"
    | "DEFEAT";

export const MENSAJES = {
    ELEGIR_PERSONAJE: "elegir_personaje",
    TOGGLE_LISTO: "toggle_listo",
    VOTAR_NODO: "votar_nodo",
    JUGAR_CARTA: "jugar_carta",
    TERMINAR_TURNO: "terminar_turno",
    ELEGIR_RECOMPENSA: "elegir_recompensa",
    ABRIR_COFRE: "abrir_cofre",
    VOTAR_RELIQUIA_COFRE: "votar_reliquia_cofre",
    ACCION_FOGATA: "accion_fogata",
    COMPRAR_CARTA_TIENDA: "comprar_carta_tienda",
    COMPRAR_RELIQUIA_TIENDA: "comprar_reliquia_tienda",
    ELIMINAR_CARTA_TIENDA: "eliminar_carta_tienda",
    SALIR_TIENDA: "salir_tienda",
    ACCION_EVENTO: "accion_evento",
    VOTAR_OPCION_EVENTO: "votar_opcion_evento",
    RESOLVER_ACCION_RELIQUIA: "resolver_accion_reliquia",
    REINICIAR_PARTIDA: "reiniciar_partida",
    SECUENCIA_COMBATE: "secuencia_combate"
} as const;

export const ECONOMIA_CONFIG = {
    ORO_INICIAL: 100,
    ORO_COMBATE_NORMAL: 25,
    ORO_COMBATE_ELITE: 55,
    ORO_COMBATE_JEFE: 100,
    COSTO_ELIMINAR_CARTA_TIENDA: 75,
    PORCENTAJE_CURACION_FOGATA: 0.3
} as const;

export type TipoAccionFogata =
    | { tipo: "CURAR_PROPIO" }
    | { tipo: "CURAR_ALIADO"; aliadoSessionId: string }
    | { tipo: "MEJORAR_CARTA"; indiceMazo: number };

export interface IPayloadAccionEvento {
    indiceOpcion: number;
    indiceCartaEliminar?: number;
}

export type TipoAccionReliquiaPendiente = "" | "ENCANTAR_CARTA" | "ELIMINAR_CARTAS";

export type PersonajeId = "SHELLY" | "CROW";
export type ClaseId = "combate" | "ladron" | "shelly" | "veneno" | "asesino" | "crow" | "maldicion";

export interface IPersonajeInfo {
    id: PersonajeId;
    nombre: string;
    icono: string;
    hpMax: number;
    energiaMax: number;
    oroInicial: number;
    descripcion: string;
    clases: ClaseId[];
    mazoInicial: string[];
    reliquiaInicial: string;
}

export const PERSONAJES_INFO: Record<PersonajeId, IPersonajeInfo> = {
    SHELLY: {
        id: "SHELLY",
        nombre: "Shelly",
        icono: "icono_shelly",
        hpMax: 90,
        energiaMax: 3,
        oroInicial: ECONOMIA_CONFIG.ORO_INICIAL,
        descripcion: "Personaje simple, tiene buen ataque, defensa y forma de ganar dinero.",
        clases: ["combate", "ladron", "shelly"],
        mazoInicial: [
            "golpe_combate", "golpe_combate", "golpe_combate", "golpe_combate",
            "defender_combate", "defender_combate", "defender_combate", "defender_combate",
            "bash"
        ],
        reliquiaInicial: "bandita"
    },
    CROW: {
        id: "CROW",
        nombre: "Crow",
        icono: "icono_crow",
        hpMax: 70,
        energiaMax: 3,
        oroInicial: ECONOMIA_CONFIG.ORO_INICIAL,
        descripcion: "Envenena a sus enemigos y lanza muchos ataques para acabar con sus enemigos.",
        clases: ["veneno", "asesino", "crow"],
        mazoInicial: [
            "golpe_veneno", "golpe_veneno", "golpe_veneno", "golpe_veneno",
            "defender_veneno", "defender_veneno", "defender_veneno", "defender_veneno",
            "bash"
        ],
        reliquiaInicial: "cocoroch"
    }
};

export interface ICartaDescartadaVisual {
    indiceMano: number;
    cartaId: string;
}

export type EventoVisualCombate =
    | {
          tipo: "CARTA_JUGADA";
          jugadorId: string;
          cartaId: string;
          objetivoId?: string;
          indiceMano?: number;
          destinoCarta?: "DESCARTE" | "AGOTADAS" | "PODER";
      }
    | {
          tipo: "CARTAS_DESCARTADAS";
          jugadorId: string;
          cartas: ICartaDescartadaVisual[];
          destino: "DESCARTE" | "AGOTADAS";
      }
    | {
          tipo: "MAZO_MEZCLADO";
          jugadorId: string;
          cantidadCartas: number;
      }
    | {
          tipo: "CARTAS_ROBADAS";
          jugadorId: string;
          cantidad: number;
          cartasIds: string[];
      }
    | {
          tipo: "ATAQUE_EJECUTADO";
          atacanteId: string;
          objetivoId: string;
          indiceGolpe: number;
          totalGolpes: number;
      }
    | {
          tipo: "IMPACTO_DANIO";
          objetivoId: string;
          atacanteId?: string;
          danioAlHp: number;
          danioBloqueado: number;
          hpRestante: number;
          bloqueoRestante: number;
          fuente: FuenteDanio;
      }
    | {
          tipo: "BLOQUEO_GANADO";
          entidadId: string;
          cantidad: number;
          bloqueoTotal: number;
      }
    | {
          tipo: "ESTADO_APLICADO";
          entidadId: string;
          estadoId: EstadoId;
          valorAgregado: number;
          valorTotal: number;
      }
    | {
          tipo: "CURACION_RECIBIDA";
          entidadId: string;
          cantidad: number;
          hpActual: number;
      }
    | {
          tipo: "ORO_CAMBIADO";
          jugadorId: string;
          delta: number;
          oroTotal: number;
      }
    | {
          tipo: "RELIQUIA_ACTIVADA";
          jugadorId: string;
          reliquiaId: string;
      }
    | {
          tipo: "ENTIDAD_MURIO";
          entidadId: string;
          esEnemigo: boolean;
      };

export interface IMapaEstadosCliente {
    get(clave: EstadoId | string): number | undefined;
    forEach(cb: (valor: number, clave: string) => void): void;
}

export interface IJugadorCliente {
    sessionId: string;
    nombre: string;
    personajeId: PersonajeId;
    listo: boolean;
    hp: number;
    hpMax: number;
    bloqueo: number;
    energia: number;
    energiaMax: number;
    oro: number;
    oroRecompensa: number;
    hpPerdidoCombate: number;
    turnoTerminado: boolean;
    nodoVotadoId: string;
    reliquiaCofreVotadaId: string;
    recompensaElegida: boolean;
    reliquiaRecompensa: string;
    fogataCompletada: boolean;
    tiendaCompletada: boolean;
    tiendaEliminacionUsada: boolean;
    eventoCompletado: boolean;
    eventoVotoOpcion: number;
    cantPilaRobo: number;
    cantDescarte: number;
    cantAgotadas: number;
    mano: Iterable<string> & { length: number; [index: number]: string };
    mazoMaestro: Iterable<string> & { length: number; [index: number]: string };
    pilaRobo: Iterable<string> & { length: number; [index: number]: string };
    descarte: Iterable<string> & { length: number; [index: number]: string };
    agotadas: Iterable<string> & { length: number; [index: number]: string };
    opcionesRecompensa: Iterable<string> & { length: number; [index: number]: string };
    reliquias: Iterable<string> & { length: number; [index: number]: string };
    tiendaCartas: Iterable<string> & { length: number; [index: number]: string };
    tiendaReliquias: Iterable<string> & { length: number; [index: number]: string };
    eventoOpcionCartas: Iterable<string> & { length: number; [index: number]: string };
    eventoOpcionReliquias: Iterable<string> & { length: number; [index: number]: string };
    eventoOpcionMaldiciones: Iterable<string> & { length: number; [index: number]: string };
    estados: IMapaEstadosCliente;
    contadoresReliquias: IMapaEstadosCliente;
    accionReliquiaPendienteTipo: TipoAccionReliquiaPendiente;
    accionReliquiaPendienteParam: string;
    accionReliquiaPendienteRestantes: number;
}

export interface IEnemigoCliente {
    uid: string;
    enemigoId: string;
    nombre: string;
    hp: number;
    hpMax: number;
    bloqueo: number;
    intencionTipo: TipoIntencion;
    intencionValor: number;
    intencionGolpes: number;
    intencionInvocarId: string;
    estados: IMapaEstadosCliente;
}

export interface INodoMapaCliente {
    id: string;
    piso: number;
    columna: number;
    tipo: TipoNodoMapa;
    estado: EstadoNodoMapa;
    siguientesIds: Iterable<string>;
}

export interface IEstadoSalaCliente {
    faseActual: FaseSala;
    mapaActual: number;
    ambientacionActual: AmbientacionId;
    pisoActual: number;
    turnoNumero: number;
    nodoActualId: string;
    nodoGanadorMapaId: string;
    tiempoCuentaRegresivaMapa: number;
    hayEmpateMapa: boolean;
    esCombateElite: boolean;
    esCombateJefe: boolean;
    cofreAbierto: boolean;
    hayConflictoCofre: boolean;
    tiempoCuentaRegresivaCofre: number;
    reliquiasCofre: Iterable<string>;
    eventoActualId: string;
    hayEmpateEvento: boolean;
    opcionGanadoraEventoIdx: number;
    tiempoCuentaRegresivaEvento: number;
    jugadores: {
        get(sessionId: string): IJugadorCliente | undefined;
        forEach(cb: (jugador: IJugadorCliente, sessionId: string) => void): void;
        size?: number;
    };
    enemigos: Iterable<IEnemigoCliente> & {
        length: number;
        [index: number]: IEnemigoCliente;
        forEach(cb: (enemigo: IEnemigoCliente, index: number) => void): void;
    };
    nodosMapa: Iterable<INodoMapaCliente> & {
        length: number;
        forEach(cb: (nodo: INodoMapaCliente, index: number) => void): void;
    };
}