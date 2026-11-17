import { EstadoId, FuenteDanio } from "./CondicionesYEfectos";
import { EstadoNodoMapa, TipoNodoMapa } from "./Mapa";
import { TipoIntencion } from "./Enemigos";

export type FaseSala = "LOBBY" | "MAP" | "COMBAT" | "REWARD" | "CHEST" | "VICTORY" | "DEFEAT";

export const MENSAJES = {
    ELEGIR_PERSONAJE: "elegir_personaje",
    TOGGLE_LISTO: "toggle_listo",
    VOTAR_NODO: "votar_nodo",
    JUGAR_CARTA: "jugar_carta",
    TERMINAR_TURNO: "terminar_turno",
    ELEGIR_RECOMPENSA: "elegir_recompensa",
    ABRIR_COFRE: "abrir_cofre",
    VOTAR_RELIQUIA_COFRE: "votar_reliquia_cofre",
    REINICIAR_PARTIDA: "reiniciar_partida",
    SECUENCIA_COMBATE: "secuencia_combate" // Nuevo canal Servidor -> Cliente para animaciones paso a paso
} as const;

export type PersonajeId = "SHELLY" | "CROW";
export type ClaseId = "combate" | "ladron" | "shelly" | "veneno" | "asesino" | "crow";

export interface IPersonajeInfo {
    id: PersonajeId;
    nombre: string;
    icono: string;
    hpMax: number;
    energiaMax: number;
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

// ================= EVENTOS VISUALES SECUENCIALES (SERVIDOR -> CLIENTE) =================
export type EventoVisualCombate =
    | {
          tipo: "CARTA_JUGADA";
          jugadorId: string;
          cartaId: string;
          objetivoId?: string;
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
          tipo: "RELIQUIA_ACTIVADA";
          jugadorId: string;
          reliquiaId: string;
      }
    | {
          tipo: "ENTIDAD_MURIO";
          entidadId: string;
          esEnemigo: boolean;
      };

// ================= CONTRATOS TIPADOS DE ESTADO PARA EL CLIENTE (SIN 'any') =================
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
    turnoTerminado: boolean;
    nodoVotadoId: string;
    reliquiaCofreVotadaId: string;
    recompensaElegida: boolean;
    reliquiaRecompensa: string;
    cantPilaRobo: number;
    cantDescarte: number;
    mano: Iterable<string> & { length: number; [index: number]: string };
    mazoMaestro: Iterable<string> & { length: number };
    opcionesRecompensa: Iterable<string> & { length: number };
    reliquias: Iterable<string> & { length: number };
    estados: IMapaEstadosCliente;
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