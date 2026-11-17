import { SpireState, PlayerState, EnemyState } from "../rooms/schema/SpireState";
import { ICartaData } from "../../../assets/cliente/compartido/Cartas";
import { FuenteDanio } from "../../../assets/cliente/compartido/CondicionesYEfectos";
import { ActionQueue } from "./ActionQueue";

export type EntidadCombate = PlayerState | EnemyState;

export interface MapaEventosCombate {
    AL_INICIAR_COMBATE: {
        state: SpireState;
        cola: ActionQueue;
    };
    AL_INICIAR_TURNO: {
        state: SpireState;
        cola: ActionQueue;
        jugador: PlayerState;
    };
    AL_TERMINAR_TURNO: {
        state: SpireState;
        cola: ActionQueue;
        jugador: PlayerState;
    };
    AL_JUGAR_CARTA: {
        state: SpireState;
        cola: ActionQueue;
        jugador: PlayerState;
        carta: ICartaData;
        objetivoId?: string;
    };
    AL_INFLIGIR_DANIO: {
        state: SpireState;
        cola: ActionQueue;
        atacante: PlayerState;
        defensor: EnemyState;
        danioInfligido: number;
        fuente: FuenteDanio;
    };
    AL_RECIBIR_DANIO: {
        state: SpireState;
        cola: ActionQueue;
        defensor: PlayerState;
        atacante?: EntidadCombate;
        danioRecibido: number;
        fuente: FuenteDanio;
    };
    AL_MORIR_ENTIDAD: {
        state: SpireState;
        cola: ActionQueue;
        entidadMuerta: EntidadCombate;
        autorMuerte?: EntidadCombate;
    };
    AL_FINALIZAR_COMBATE: {
        state: SpireState;
        cola: ActionQueue;
    };
}

export type NombreEventoCombate = keyof MapaEventosCombate;
export type ListenerEventoCombate<K extends NombreEventoCombate> = (payload: MapaEventosCombate[K]) => void;

export class CombatEventBus {
    private listeners: { [K in NombreEventoCombate]?: ListenerEventoCombate<K>[] } = {};

    public suscribir<K extends NombreEventoCombate>(evento: K, listener: ListenerEventoCombate<K>): void {
        if (!this.listeners[evento]) {
            this.listeners[evento] = [];
        }
        this.listeners[evento]!.push(listener);
    }

    public emitir<K extends NombreEventoCombate>(evento: K, payload: MapaEventosCombate[K]): void {
        const lista = this.listeners[evento];
        if (!lista) return;
        for (const fn of lista) {
            fn(payload);
        }
    }
}