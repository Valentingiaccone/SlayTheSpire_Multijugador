import { SpireState } from "../rooms/schema/SpireState";
import { EventoVisualCombate } from "../../../assets/cliente/compartido/GameTypes";
import { CombatEventBus } from "./CombatEventBus";

export interface IAccionCombate {
    ejecutar(state: SpireState, cola: ActionQueue, bus: CombatEventBus): void;
}

export class ActionQueue {
    private cola: IAccionCombate[] = [];
    private eventosVisuales: EventoVisualCombate[] = [];
    private procesando: boolean = false;
    private static readonly MAX_PASOS_SEGURIDAD = 500;

    public encolarAlFinal(accion: IAccionCombate): void {
        this.cola.push(accion);
    }

    public encolarAlInicio(accion: IAccionCombate): void {
        this.cola.unshift(accion);
    }

    public emitirVisual(evento: EventoVisualCombate): void {
        this.eventosVisuales.push(evento);
    }

    public procesarTodo(state: SpireState, bus: CombatEventBus): EventoVisualCombate[] {
        if (this.procesando) return [];
        this.procesando = true;

        let pasos = 0;
        while (this.cola.length > 0 && pasos < ActionQueue.MAX_PASOS_SEGURIDAD) {
            if (state.faseActual !== "COMBAT") {
                this.cola = [];
                break;
            }
            const accion = this.cola.shift()!;
            accion.ejecutar(state, this, bus);
            pasos++;
        }

        if (pasos >= ActionQueue.MAX_PASOS_SEGURIDAD) {
            console.warn("[ActionQueue] Se alcanzó el límite de seguridad de 500 acciones anidadas.");
            this.cola = [];
        }

        this.procesando = false;
        const lote = [...this.eventosVisuales];
        this.eventosVisuales = [];
        return lote;
    }
}